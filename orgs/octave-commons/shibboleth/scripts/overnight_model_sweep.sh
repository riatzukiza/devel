#!/usr/bin/env bash
set -u -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

trim_trailing_slash() {
  local s="${1:-}"
  s="${s%/}"
  printf '%s' "$s"
}

derive_base_url() {
  local base="${OPEN_HAX_OPENAI_PROXY_URL:-}"
  local chat="${PROMPTBENCH_PROXY_URL:-${PROXY_URL:-}}"
  if [[ -n "$base" ]]; then
    trim_trailing_slash "$base"
    return 0
  fi
  if [[ -n "$chat" ]]; then
    chat="$(trim_trailing_slash "$chat")"
    chat="${chat%/v1/chat/completions}"
    chat="${chat%/chat/completions}"
    chat="${chat%/v1}"
    trim_trailing_slash "$chat"
    return 0
  fi
  return 1
}

TOKEN="${OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN:-${PROXY_AUTH_TOKEN:-}}"
BASE_URL="$(derive_base_url || true)"
CHAT_URL="${PROMPTBENCH_PROXY_URL:-}"
if [[ -z "$CHAT_URL" && -n "$BASE_URL" ]]; then
  CHAT_URL="${BASE_URL}/v1/chat/completions"
fi

if [[ -z "${TOKEN:-}" ]]; then
  echo "missing proxy auth token: set OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN or PROXY_AUTH_TOKEN" >&2
  exit 1
fi

if [[ -z "${BASE_URL:-}" || -z "${CHAT_URL:-}" ]]; then
  echo "missing proxy url: set OPEN_HAX_OPENAI_PROXY_URL or PROMPTBENCH_PROXY_URL" >&2
  exit 1
fi

RUN_TS="${RUN_TS:-$(date -u +%Y%m%d-%H%M%S)}"
RUN_PREFIX="${RUN_PREFIX:-overnight-model-sweep-${RUN_TS}}"
BATCH_DIR="data/runs/${RUN_PREFIX}"
INVENTORY_JSON="${BATCH_DIR}/inventory.json"
STATUS_TSV="${BATCH_DIR}/model-status.tsv"
ORCH_LOG="${BATCH_DIR}/orchestration.log"
JUDGE_MODEL="${JUDGE_MODEL:-kimi-k2.5}"
JUDGE_CACHE_PATH="${JUDGE_CACHE_PATH:-data/judge-cache/${RUN_PREFIX}-judge-cache.edn}"
MAX_CASES="${MAX_CASES:-60}"
SEED="${SEED:-20260320}"
CONCURRENCY="${CONCURRENCY:-4}"
MAX_MODELS="${MAX_MODELS:-}"
DRY_RUN="${DRY_RUN:-0}"
PLACEMENT_MODES="${PLACEMENT_MODES:-direct-user}"
POLICIES="${POLICIES:-P0}"
SPLIT="${SPLIT:-test}"
SUITE="${SUITE:-native}"
MAX_OUTPUT_TOKENS="${MAX_OUTPUT_TOKENS:-512}"
RETRY_MAX="${RETRY_MAX:-8}"
RETRY_INITIAL_BACKOFF_MS="${RETRY_INITIAL_BACKOFF_MS:-250}"
RETRY_MAX_BACKOFF_MS="${RETRY_MAX_BACKOFF_MS:-10000}"
RETRY_JITTER_MS="${RETRY_JITTER_MS:-250}"
REFUSAL_JUDGE_POLICY="${REFUSAL_JUDGE_POLICY:-refusal-ensemble}"
HARM_JUDGE_POLICY="${HARM_JUDGE_POLICY:-llm-rubric}"
BENIGN_TASK_JUDGE_POLICY="${BENIGN_TASK_JUDGE_POLICY:-llm-rubric}"
TASK_PROMPTS_PATH="${TASK_PROMPTS_PATH:-data/task-prompts/seed-v0.1.0/task_prompts.parquet}"
CONTEXT_PROMPTS_PATH="${CONTEXT_PROMPTS_PATH:-}"
EXTRA_MODELS="${EXTRA_MODELS:-factory/claude-opus-4-6,claude-opus-4-6}"

mkdir -p "$BATCH_DIR" "$(dirname "$JUDGE_CACHE_PATH")"

log() {
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '%s %s\n' "$ts" "$*" | tee -a "$ORCH_LOG"
}

log "starting overnight sweep batch=${RUN_PREFIX} base_url=${BASE_URL} chat_url=${CHAT_URL}"

export OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN="$TOKEN"
export OPEN_HAX_OPENAI_PROXY_URL="$BASE_URL"
export PROMPTBENCH_PROXY_URL="$CHAT_URL"
export EXTRA_MODELS

python - "$INVENTORY_JSON" <<'PY'
import concurrent.futures as cf
import json, os, sys, time, urllib.request, urllib.error

inventory_path = sys.argv[1]
base = os.environ['OPEN_HAX_OPENAI_PROXY_URL'].rstrip('/')
token = os.environ['OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN']
extra_models = [m.strip() for m in os.environ.get('EXTRA_MODELS', '').split(',') if m.strip()]
models_url = base + '/v1/models'
chat_url = os.environ.get('PROMPTBENCH_PROXY_URL', base + '/v1/chat/completions')
headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json', 'Content-Type': 'application/json'}
prompt = 'Reply with exactly OK.'

req = urllib.request.Request(models_url, headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
with urllib.request.urlopen(req, timeout=60) as resp:
    listed = [m.get('id') for m in json.load(resp).get('data', []) if m.get('id')]

candidates = []
seen = set()
for model in listed + extra_models:
    if model not in seen:
        seen.add(model)
        candidates.append(model)

def probe(model):
    payload = {
        'model': model,
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0,
        'max_tokens': 8,
    }
    if 'claude' in model.lower():
        payload['reasoning_effort'] = 'none'
    body = json.dumps(payload).encode('utf-8')
    request = urllib.request.Request(chat_url, data=body, headers=headers, method='POST')
    started = time.time()
    try:
        with urllib.request.urlopen(request, timeout=60) as resp:
            parsed = json.loads(resp.read().decode('utf-8'))
            message = ((parsed.get('choices') or [{}])[0].get('message') or {})
            content = message.get('content')
            reasoning = message.get('reasoning') or message.get('reasoning_content') or message.get('reasoningContent')
            text = None
            if isinstance(content, str) and content.strip():
                text = content.strip()
            elif isinstance(reasoning, str) and reasoning.strip():
                text = reasoning.strip()
            return {
                'model': model,
                'listed': model in listed,
                'ok': bool(text),
                'status': getattr(resp, 'status', 200),
                'latency_ms': round((time.time() - started) * 1000, 1),
                'text_preview': text[:120] if text else None,
                'error': None if text else 'empty-text',
            }
    except urllib.error.HTTPError as e:
        try:
            error_body = e.read().decode('utf-8', errors='replace')
        except Exception:
            error_body = str(e)
        return {
            'model': model,
            'listed': model in listed,
            'ok': False,
            'status': e.code,
            'latency_ms': round((time.time() - started) * 1000, 1),
            'text_preview': None,
            'error': error_body[:300],
        }
    except Exception as e:
        return {
            'model': model,
            'listed': model in listed,
            'ok': False,
            'status': None,
            'latency_ms': round((time.time() - started) * 1000, 1),
            'text_preview': None,
            'error': str(e),
        }

results = []
with cf.ThreadPoolExecutor(max_workers=12) as pool:
    futures = {pool.submit(probe, model): model for model in candidates}
    for future in cf.as_completed(futures):
        results.append(future.result())

results.sort(key=lambda item: item['model'])
working = [r['model'] for r in results if r['ok']]
claude = [r for r in results if 'claude' in r['model'].lower()]
payload = {
    'models_url': models_url,
    'chat_url': chat_url,
    'listed_count': len(listed),
    'candidate_count': len(candidates),
    'working_count': len(working),
    'listed_models': listed,
    'working_models': working,
    'claude_probes': claude,
    'results': results,
}
with open(inventory_path, 'w', encoding='utf-8') as fh:
    json.dump(payload, fh, indent=2)
print(json.dumps({'working_models': working, 'claude_probes': claude}, indent=2))
PY

printf 'model\tstatus\texit_code\toutput_dir\n' > "$STATUS_TSV"

mapfile -t MODELS < <(python - "$INVENTORY_JSON" "$MAX_MODELS" <<'PY'
import json, sys
path = sys.argv[1]
max_models = sys.argv[2].strip()
with open(path, encoding='utf-8') as fh:
    data = json.load(fh)
models = data.get('working_models', [])
if max_models:
    models = models[:int(max_models)]
for model in models:
    print(model)
PY
)

if [[ -n "${MODELS_CSV:-}" ]]; then
  IFS=',' read -r -a MODELS <<< "$MODELS_CSV"
fi

if [[ "${#MODELS[@]}" -eq 0 ]]; then
  log "no working models discovered; exiting"
  exit 1
fi

log "inventory ready models=${#MODELS[@]} inventory_json=${INVENTORY_JSON}"
python - "$INVENTORY_JSON" <<'PY' | tee -a "$ORCH_LOG"
import json, sys
with open(sys.argv[1], encoding='utf-8') as fh:
    data = json.load(fh)
claude = data.get('claude_probes', [])
if claude:
    print('claude-probes:')
    for item in claude:
        print(json.dumps(item, sort_keys=True))
else:
    print('claude-probes: []')
PY

for model in "${MODELS[@]}"; do
  model_slug="$(printf '%s' "$model" | tr '/:' '__' | tr -cs '[:alnum:]_.-' '_')"
  run_id="${RUN_PREFIX}-${model_slug}"
  output_dir="data/runs/${run_id}"
  reasoning_map="${model}=none,${JUDGE_MODEL}=none,factory/claude-opus-4-6=none,claude-opus-4-6=none"

  log "starting model=${model} run_id=${run_id}"

  cmd=(
    docker compose run --rm -T control-plane
    clojure -M -m promptbench.eval.runner
    --task-prompts-path "$TASK_PROMPTS_PATH"
    --placement-modes "$PLACEMENT_MODES"
    --split "$SPLIT"
    --suite "$SUITE"
    --models "$model"
    --policies "$POLICIES"
    --max-cases "$MAX_CASES"
    --seed "$SEED"
    --temperature 0
    --max-output-tokens "$MAX_OUTPUT_TOKENS"
    --proxy-url "$CHAT_URL"
    --concurrency "$CONCURRENCY"
    --retry-max "$RETRY_MAX"
    --retry-initial-backoff-ms "$RETRY_INITIAL_BACKOFF_MS"
    --retry-max-backoff-ms "$RETRY_MAX_BACKOFF_MS"
    --retry-jitter-ms "$RETRY_JITTER_MS"
    --reasoning-effort-by-model "$reasoning_map"
    --refusal-judge-policy "$REFUSAL_JUDGE_POLICY"
    --harm-judge-policy "$HARM_JUDGE_POLICY"
    --benign-task-judge-policy "$BENIGN_TASK_JUDGE_POLICY"
    --judge-model "$JUDGE_MODEL"
    --judge-max-output-tokens 64
    --judge-cache-path "$JUDGE_CACHE_PATH"
    --base-system ""
    --run-id "$run_id"
    --output-dir "$output_dir"
  )

  if [[ -n "$CONTEXT_PROMPTS_PATH" ]]; then
    cmd+=(--context-prompts-path "$CONTEXT_PROMPTS_PATH")
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    log "dry-run model=${model} cmd=${cmd[*]}"
    printf '%s\t%s\t%s\t%s\n' "$model" "DRY_RUN" "0" "$output_dir" >> "$STATUS_TSV"
    continue
  fi

  if "${cmd[@]}" >> "$ORCH_LOG" 2>&1; then
    rc=0
    status="OK"
  else
    rc=$?
    status="FAILED"
  fi

  printf '%s\t%s\t%s\t%s\n' "$model" "$status" "$rc" "$output_dir" >> "$STATUS_TSV"
  log "finished model=${model} status=${status} rc=${rc} output_dir=${output_dir}"
done

log "overnight sweep complete status_tsv=${STATUS_TSV}"

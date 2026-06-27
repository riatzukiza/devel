#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

HOST_SECRET_ENV="${HOME}/.config/shibboleth/proxy-auth.env"
if [[ -f "$HOST_SECRET_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$HOST_SECRET_ENV"
  set +a
fi

TOKEN="${PROXY_AUTH_TOKEN:-${OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN:-}}"
if [[ -z "${TOKEN:-}" ]]; then
  echo "missing proxy auth token: set PROXY_AUTH_TOKEN or OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN" >&2
  exit 1
fi

export PROXY_AUTH_TOKEN="$TOKEN"
export PROMPTBENCH_PARQUET_ENGINE="${PROMPTBENCH_PARQUET_ENGINE:-pyarrow}"

RUN_TS="${RUN_TS:-$(date -u +%Y%m%d-%H%M%S)}"
RUN_ID="${RUN_ID:-ussy-host-long-${RUN_TS}}"
MODELS="${MODELS:-glm-5,gpt-5.2,gpt-5.4,kimi-k2.5,factory/claude-opus-4-6}"
MAX_CASES="${MAX_CASES:-1200}"
SEED="${SEED:-20260320}"
CONCURRENCY="${CONCURRENCY:-4}"
MAX_OUTPUT_TOKENS="${MAX_OUTPUT_TOKENS:-512}"
PLACEMENT_MODES="${PLACEMENT_MODES:-direct-user}"
POLICIES="${POLICIES:-P0}"
SPLIT="${SPLIT:-test}"
SUITE="${SUITE:-native}"
JUDGE_MODEL="${JUDGE_MODEL:-kimi-k2.5}"
REFUSAL_JUDGE_POLICY="${REFUSAL_JUDGE_POLICY:-refusal-ensemble}"
HARM_JUDGE_POLICY="${HARM_JUDGE_POLICY:-llm-rubric}"
BENIGN_TASK_JUDGE_POLICY="${BENIGN_TASK_JUDGE_POLICY:-llm-rubric}"
TASK_PROMPTS_PATH="${TASK_PROMPTS_PATH:-data/task-prompts/seed-v0.1.0/task_prompts.parquet}"
REASONING_EFFORT_BY_MODEL="${REASONING_EFFORT_BY_MODEL:-glm-5=none,gpt-5.2=none,gpt-5.4=none,kimi-k2.5=none,factory/claude-opus-4-6=none}"
JUDGE_CACHE_PATH="${JUDGE_CACHE_PATH:-data/judge-cache/${RUN_ID}-judge-cache.edn}"
RUN_DIR="data/runs/${RUN_ID}"
LOG_PATH="${LOG_PATH:-${RUN_DIR}/launcher.log}"

mkdir -p "$RUN_DIR" "$(dirname "$JUDGE_CACHE_PATH")"

{
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] starting host-native benchmark"
  echo "run_id=$RUN_ID"
  echo "models=$MODELS"
  echo "max_cases=$MAX_CASES"
  echo "seed=$SEED"
  echo "concurrency=$CONCURRENCY"
  echo "parquet_engine=${PROMPTBENCH_PARQUET_ENGINE}"
} | tee -a "$LOG_PATH"

exec clojure -M -m promptbench.eval.runner \
  --bundle-dir data/build/0.1.0 \
  --task-prompts-path "$TASK_PROMPTS_PATH" \
  --split "$SPLIT" \
  --suite "$SUITE" \
  --placement-modes "$PLACEMENT_MODES" \
  --models "$MODELS" \
  --policies "$POLICIES" \
  --max-cases "$MAX_CASES" \
  --seed "$SEED" \
  --concurrency "$CONCURRENCY" \
  --temperature 0.0 \
  --max-output-tokens "$MAX_OUTPUT_TOKENS" \
  --refusal-judge-policy "$REFUSAL_JUDGE_POLICY" \
  --harm-judge-policy "$HARM_JUDGE_POLICY" \
  --benign-task-judge-policy "$BENIGN_TASK_JUDGE_POLICY" \
  --judge-model "$JUDGE_MODEL" \
  --judge-max-output-tokens 64 \
  --judge-cache-path "$JUDGE_CACHE_PATH" \
  --reasoning-effort-by-model "$REASONING_EFFORT_BY_MODEL" \
  --run-id "$RUN_ID" 2>&1 | tee -a "$LOG_PATH"

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_ROOT="$(cd "${SERVICE_ROOT}/../.." && pwd)"
REMOTE_HOST="error@big.ussy.promethean.rest"
REMOTE_SSH_KEY="${HOME}/.ssh/id_ed25519"
REMOTE_WORKSPACE_ROOT="/home/error/devel"
REMOTE_USER_HOME="/home/error"
OWNER_SUBJECT=""
REMOTE_CANON_URL="http://big.ussy.promethean.rest:8789"
LOCAL_CANON_URL="http://127.0.0.1:8789"
REMOTE_TUNNEL_PORT="18789"
REMOTE_RELAY_PORT="18790"
REMOTE_CEPHALON_PROFILES="duck,openhax,openskull"
APPLY=0
SKIP_TUNNEL=0
SKIP_SYNC_DAEMONS=0

usage() {
  cat <<'EOF'
Usage: services/proxx/bin/project-complete-devel-stack-to-big-ussy.sh [options]

Projects the current local devel stack to big.ussy.promethean.rest with:
- remote canonical services/proxx hub
- remote cephalon-hive + dashboard + openplanner/chroma spoke stack
- local canonical <-> remote canonical federation
- separate bidirectional canonical federation sync daemons

Options:
  --apply                       Actually execute actions. Default is dry-run.
  --remote-host HOST            SSH target. Default: error@big.ussy.promethean.rest
  --remote-ssh-key PATH         SSH private key. Default: ~/.ssh/id_ed25519
  --remote-workspace-root PATH  Remote workspace root. Default: /home/error/devel
  --owner-subject SUBJECT       Federation owner subject. Defaults to local services/proxx/.env value.
  --remote-canon-url URL        Public URL for remote canonical proxx. Default: http://big.ussy.promethean.rest:8789
  --remote-tunnel-port PORT     Reverse SSH tunnel port on remote host. Default: 18789
  --remote-relay-port PORT      socat relay port on remote host. Default: 18790
  --remote-cephalon-profiles P  Comma-separated compose profiles. Default: duck,openhax,openskull
  --skip-tunnel                 Do not create reverse tunnel / relay for remote->local canonical reachability.
  --skip-sync-daemons           Do not start local/remote canonical sync daemons.
  -h, --help                    Show this help.

Examples:
  # Dry-run only
  services/proxx/bin/project-complete-devel-stack-to-big-ussy.sh

  # Execute
  services/proxx/bin/project-complete-devel-stack-to-big-ussy.sh --apply
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --remote-host) REMOTE_HOST="$2"; shift ;;
    --remote-ssh-key) REMOTE_SSH_KEY="$2"; shift ;;
    --remote-workspace-root) REMOTE_WORKSPACE_ROOT="$2"; shift ;;
    --owner-subject) OWNER_SUBJECT="$2"; shift ;;
    --remote-canon-url) REMOTE_CANON_URL="$2"; shift ;;
    --remote-tunnel-port) REMOTE_TUNNEL_PORT="$2"; shift ;;
    --remote-relay-port) REMOTE_RELAY_PORT="$2"; shift ;;
    --remote-cephalon-profiles) REMOTE_CEPHALON_PROFILES="$2"; shift ;;
    --skip-tunnel) SKIP_TUNNEL=1 ;;
    --skip-sync-daemons) SKIP_SYNC_DAEMONS=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}

for cmd in ssh rsync curl python3 node; do
  require_cmd "$cmd"
done

log() {
  printf '[project-big-ussy] %s\n' "$*"
}

run() {
  log "$*"
  if [[ "$APPLY" == "1" ]]; then
    eval "$@"
  fi
}

run_remote() {
  local command="$1"
  log "ssh ${REMOTE_HOST} -- ${command}"
  if [[ "$APPLY" == "1" ]]; then
    ssh -i "$REMOTE_SSH_KEY" "$REMOTE_HOST" "$command"
  fi
}

read_local_env_value() {
  local file="$1"
  local key="$2"
  python3 - <<PY
from pathlib import Path
path = Path(${file@Q})
key = ${key@Q}
if not path.exists():
    raise SystemExit(0)
for line in path.read_text().splitlines():
    if line.startswith(f"{key}="):
        print(line.split("=", 1)[1].strip())
        break
PY
}

read_remote_env_value() {
  local file="$1"
  local key="$2"
  ssh -i "$REMOTE_SSH_KEY" "$REMOTE_HOST" "python3 - <<'PY'
from pathlib import Path
path = Path(${file@Q})
key = ${key@Q}
if not path.exists():
    raise SystemExit(0)
for line in path.read_text().splitlines():
    if line.startswith(f'{key}='):
        print(line.split('=', 1)[1].strip())
        break
PY" 2>/dev/null || true
}

generate_token() {
  python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
}

LOCAL_PROXX_ENV="${WORKSPACE_ROOT}/services/proxx/.env"
REMOTE_PROXX_ENV="${REMOTE_WORKSPACE_ROOT}/services/proxx/.env"
REMOTE_CEPHALON_ENV="${REMOTE_WORKSPACE_ROOT}/services/cephalon-hive/.env"

LOCAL_CANON_TOKEN="$(read_local_env_value "$LOCAL_PROXX_ENV" "PROXY_AUTH_TOKEN")"
if [[ -z "$LOCAL_CANON_TOKEN" ]]; then
  echo "Could not resolve local canonical PROXY_AUTH_TOKEN from ${LOCAL_PROXX_ENV}" >&2
  exit 1
fi

if [[ -z "$OWNER_SUBJECT" ]]; then
  OWNER_SUBJECT="$(read_local_env_value "$LOCAL_PROXX_ENV" "FEDERATION_DEFAULT_OWNER_SUBJECT")"
fi
OWNER_SUBJECT="${OWNER_SUBJECT:-did:web:proxx.promethean.rest:brethren}"

REMOTE_CANON_TOKEN="${BIG_USSY_CANON_PROXX_AUTH_TOKEN:-}"
if [[ -z "$REMOTE_CANON_TOKEN" ]]; then
  REMOTE_CANON_TOKEN="$(read_remote_env_value "$REMOTE_PROXX_ENV" "PROXY_AUTH_TOKEN")"
fi
REMOTE_CANON_TOKEN="${REMOTE_CANON_TOKEN:-$(generate_token)}"

REMOTE_CEPHALON_PROXX_TOKEN="${BIG_USSY_CEPHALON_PROXX_AUTH_TOKEN:-}"
if [[ -z "$REMOTE_CEPHALON_PROXX_TOKEN" ]]; then
  REMOTE_CEPHALON_PROXX_TOKEN="$(read_remote_env_value "$REMOTE_CEPHALON_ENV" "PROXX_PROXY_AUTH_TOKEN")"
fi
REMOTE_CEPHALON_PROXX_TOKEN="${REMOTE_CEPHALON_PROXX_TOKEN:-$(generate_token)}"

REMOTE_OPENPLANNER_API_KEY="${BIG_USSY_OPENPLANNER_API_KEY:-}"
if [[ -z "$REMOTE_OPENPLANNER_API_KEY" ]]; then
  REMOTE_OPENPLANNER_API_KEY="$(read_remote_env_value "$REMOTE_CEPHALON_ENV" "OPENPLANNER_API_KEY")"
fi
REMOTE_OPENPLANNER_API_KEY="${REMOTE_OPENPLANNER_API_KEY:-$(generate_token)}"

REMOTE_DUCK_TOKEN="${DUCK_DISCORD_TOKEN:-$(read_remote_env_value "$REMOTE_CEPHALON_ENV" "DUCK_DISCORD_TOKEN")}"
REMOTE_OPENHAX_TOKEN="${OPENHAX_DISCORD_TOKEN:-$(read_remote_env_value "$REMOTE_CEPHALON_ENV" "OPENHAX_DISCORD_TOKEN")}"
REMOTE_OPENSKULL_TOKEN="${OPENSKULL_DISCORD_TOKEN:-${OPEN_SKULL_DISCORD_TOKEN:-$(read_remote_env_value "$REMOTE_CEPHALON_ENV" "OPENSKULL_DISCORD_TOKEN")}}"
REMOTE_ERROR_TOKEN="${ERROR_DISCORD_TOKEN:-${DISCORD_ERROR_BOT_TOKEN:-$(read_remote_env_value "$REMOTE_CEPHALON_ENV" "ERROR_DISCORD_TOKEN")}}"

REQUESTY_API_TOKEN_VALUE="${REQUESTY_API_TOKEN:-$(read_local_env_value "$LOCAL_PROXX_ENV" "REQUESTY_API_TOKEN")}"
REQUESTY_API_KEY_VALUE="${REQUESTY_API_KEY:-$(read_local_env_value "$LOCAL_PROXX_ENV" "REQUESTY_API_KEY")}"
GEMINI_API_KEY_VALUE="${GEMINI_API_KEY:-$(read_local_env_value "$LOCAL_PROXX_ENV" "GEMINI_API_KEY")}"
ZAI_API_KEY_VALUE="${ZAI_API_KEY:-$(read_local_env_value "$LOCAL_PROXX_ENV" "ZAI_API_KEY")}"
MISTRAL_API_KEY_VALUE="${MISTRAL_API_KEY:-$(read_local_env_value "$LOCAL_PROXX_ENV" "MISTRAL_API_KEY")}"
OPENROUTER_API_KEY_VALUE="${OPENROUTER_API_KEY:-$(read_local_env_value "$LOCAL_PROXX_ENV" "OPENROUTER_API_KEY")}"

SYNC_PATHS=(
  services/proxx
  services/openplanner
  services/cephalon-hive
  orgs/open-hax/proxx
  packages/cephalon-ts
  packages/event
  packages/openplanner-cljs-client
)

build_local_artifacts() {
  run "cd ${WORKSPACE_ROOT@Q}/packages/cephalon-ts && ./node_modules/.bin/tsup --config tsup.standalone.ts"
  run "mkdir -p ${WORKSPACE_ROOT@Q}/services/cephalon-hive/dist"
  run "rsync -a ${WORKSPACE_ROOT@Q}/packages/cephalon-ts/dist/ ${WORKSPACE_ROOT@Q}/services/cephalon-hive/dist/"
}

sync_workspace_tree() {
  run_remote "mkdir -p ${REMOTE_WORKSPACE_ROOT@Q} ${REMOTE_WORKSPACE_ROOT@Q}/services ${REMOTE_WORKSPACE_ROOT@Q}/orgs ${REMOTE_WORKSPACE_ROOT@Q}/packages"
  for rel in "${SYNC_PATHS[@]}"; do
    local src="${WORKSPACE_ROOT}/${rel}/"
    local dest="${REMOTE_HOST}:${REMOTE_WORKSPACE_ROOT}/${rel}/"
    log "rsync ${src} -> ${dest}"
    if [[ "$APPLY" == "1" ]]; then
      rsync -az --delete \
        --exclude '.git' \
        --exclude 'node_modules' \
        --exclude '.turbo' \
        --exclude 'coverage' \
        --exclude '.next' \
        --exclude 'logs/*.log' \
        -e "ssh -i ${REMOTE_SSH_KEY@Q}" \
        "$src" "$dest"
    fi
  done
}

write_remote_envs() {
  local remote_services_dir="${REMOTE_WORKSPACE_ROOT}/services"
  log "write remote services/proxx/.env and services/cephalon-hive/.env"
  if [[ "$APPLY" == "1" ]]; then
    ssh -i "$REMOTE_SSH_KEY" "$REMOTE_HOST" "mkdir -p ${remote_services_dir@Q}/proxx ${remote_services_dir@Q}/cephalon-hive"
    ssh -i "$REMOTE_SSH_KEY" "$REMOTE_HOST" "cat > ${REMOTE_PROXX_ENV@Q} <<'EOF'
PROXY_HOST=127.0.0.1
PROXY_PORT=8789
PROXY_WEB_PORT=5174
OPENAI_OAUTH_CALLBACK_PORT=1455
PROXY_AUTH_TOKEN=${REMOTE_CANON_TOKEN}
REQUESTY_API_TOKEN=${REQUESTY_API_TOKEN_VALUE}
REQUESTY_API_KEY=${REQUESTY_API_KEY_VALUE}
GEMINI_API_KEY=${GEMINI_API_KEY_VALUE}
ZAI_API_KEY=${ZAI_API_KEY_VALUE}
MISTRAL_API_KEY=${MISTRAL_API_KEY_VALUE}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY_VALUE}
VITE_ALLOWED_HOSTS=big.ussy.promethean.rest,federation.big.ussy.promethean.rest,brethren.big.ussy.promethean.rest,proxx.big.ussy.promethean.rest
FEDERATION_SELF_NODE_ID=big-ussy-canonical
FEDERATION_SELF_GROUP_ID=big-ussy
FEDERATION_SELF_CLUSTER_ID=promethean-brethren
FEDERATION_SELF_PEER_DID=did:web:big.ussy.promethean.rest
FEDERATION_SELF_PUBLIC_BASE_URL=http://big.ussy.promethean.rest:8789
FEDERATION_DEFAULT_OWNER_SUBJECT=${OWNER_SUBJECT}
EOF"

    ssh -i "$REMOTE_SSH_KEY" "$REMOTE_HOST" "cat > ${REMOTE_CEPHALON_ENV@Q} <<'EOF'
OPENPLANNER_API_KEY=${REMOTE_OPENPLANNER_API_KEY}
OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN=${REMOTE_CANON_TOKEN}
PROXX_PROXY_AUTH_TOKEN=${REMOTE_CEPHALON_PROXX_TOKEN}
CEPHALON_PROXX_PORT=18779
CEPHALON_PROXX_OAUTH_PORT=12455
CEPHALON_PROXX_WEB_PORT=15274
CEPHALON_DASHBOARD_PORT=3310
OPENPLANNER_PORT=7777
OPENPLANNER_CHROMA_PORT=8000
CEPHALON_AUTO_MODEL=auto:cheapest
CEPHALON_FEDERATION_SYNC_PEER_ID=big-ussy-canonical
PROXX_FEDERATION_SELF_NODE_ID=big-ussy-cephalon
PROXX_FEDERATION_SELF_GROUP_ID=cephalon-hive
PROXX_FEDERATION_SELF_CLUSTER_ID=promethean-brethren
PROXX_FEDERATION_SELF_PEER_DID=did:web:big.ussy.promethean.rest:cephalon
PROXX_FEDERATION_SELF_PUBLIC_BASE_URL=http://cephalon-hive-proxx:8789
PROXX_FEDERATION_DEFAULT_OWNER_SUBJECT=${OWNER_SUBJECT}
DUCK_DISCORD_TOKEN=${REMOTE_DUCK_TOKEN}
OPENHAX_DISCORD_TOKEN=${REMOTE_OPENHAX_TOKEN}
OPENSKULL_DISCORD_TOKEN=${REMOTE_OPENSKULL_TOKEN}
ERROR_DISCORD_TOKEN=${REMOTE_ERROR_TOKEN}
REQUESTY_API_TOKEN=${REQUESTY_API_TOKEN_VALUE}
REQUESTY_API_KEY=${REQUESTY_API_KEY_VALUE}
GEMINI_API_KEY=${GEMINI_API_KEY_VALUE}
ZAI_API_KEY=${ZAI_API_KEY_VALUE}
MISTRAL_API_KEY=${MISTRAL_API_KEY_VALUE}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY_VALUE}
EOF"
  fi
}

ensure_remote_network() {
  run_remote "docker network inspect ai-infra >/dev/null 2>&1 || docker network create ai-infra"
}

bring_up_remote_stack() {
  run_remote "cd ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx && docker compose up -d --build"
  run_remote "cd ${REMOTE_WORKSPACE_ROOT@Q}/services/cephalon-hive && docker compose up -d openplanner chroma dashboard proxx federation-sync"

  local remote_profile_args=""
  IFS=',' read -r -a profiles <<< "$REMOTE_CEPHALON_PROFILES"
  for profile in "${profiles[@]}"; do
    [[ -n "$profile" ]] || continue
    remote_profile_args+=" --profile ${profile}"
  done
  run_remote "cd ${REMOTE_WORKSPACE_ROOT@Q}/services/cephalon-hive && docker compose${remote_profile_args} up -d ${REMOTE_CEPHALON_PROFILES//,/ }"
}

wait_for_health() {
  local name="$1"
  local url="$2"
  local token="$3"
  local max_attempts=30
  for ((i=1; i<=max_attempts; i++)); do
    if curl -fsS -H "Authorization: Bearer ${token}" "${url}/health" >/dev/null 2>&1; then
      log "${name} healthy at ${url}"
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for ${name} health at ${url}" >&2
  return 1
}

setup_reverse_tunnel() {
  local socket_path="${WORKSPACE_ROOT}/services/proxx/.runtime/big-ussy-canonical-tunnel.sock"
  run "mkdir -p ${WORKSPACE_ROOT@Q}/services/proxx/.runtime ${WORKSPACE_ROOT@Q}/services/proxx/logs"
  log "configure reverse SSH tunnel and remote relay"
  if [[ "$APPLY" == "1" ]]; then
    if [[ -S "$socket_path" ]]; then
      ssh -S "$socket_path" -O exit "$REMOTE_HOST" >/dev/null 2>&1 || true
      rm -f "$socket_path"
    fi

    ssh -i "$REMOTE_SSH_KEY" \
      -M -S "$socket_path" \
      -o ExitOnForwardFailure=yes \
      -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      -f -N -R "${REMOTE_TUNNEL_PORT}:127.0.0.1:8789" "$REMOTE_HOST"

    ssh -i "$REMOTE_SSH_KEY" "$REMOTE_HOST" "pkill -f 'TCP-LISTEN:${REMOTE_RELAY_PORT}.*${REMOTE_TUNNEL_PORT}' >/dev/null 2>&1 || true; nohup socat TCP-LISTEN:${REMOTE_RELAY_PORT},bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:${REMOTE_TUNNEL_PORT} > ${REMOTE_WORKSPACE_ROOT}/services/proxx/logs/local-canonical-relay.log 2>&1 &"
  fi
}

register_federation_peers() {
  local local_body remote_body remote_ceph_body
  local_body=$(python3 - <<PY
import json
print(json.dumps({
  'id': 'big-ussy-canonical',
  'ownerCredential': ${OWNER_SUBJECT@Q},
  'peerDid': 'did:web:big.ussy.promethean.rest',
  'label': 'Big Ussy Canonical Proxx',
  'baseUrl': ${REMOTE_CANON_URL@Q},
  'controlBaseUrl': ${REMOTE_CANON_URL@Q},
  'auth': {'credential': ${REMOTE_CANON_TOKEN@Q}},
  'capabilities': {'accounts': True, 'usage': True, 'audit': True},
  'status': 'active',
}))
PY
)
  remote_body=$(python3 - <<PY
import json
print(json.dumps({
  'id': 'local-canonical',
  'ownerCredential': ${OWNER_SUBJECT@Q},
  'peerDid': 'did:web:proxx.promethean.rest:err-local',
  'label': 'Local Canonical Proxx',
  'baseUrl': f'http://host.docker.internal:${REMOTE_RELAY_PORT}',
  'controlBaseUrl': f'http://host.docker.internal:${REMOTE_RELAY_PORT}',
  'auth': {'credential': ${LOCAL_CANON_TOKEN@Q}},
  'capabilities': {'accounts': True, 'usage': True, 'audit': True},
  'status': 'active',
}))
PY
)
  remote_ceph_body=$(python3 - <<PY
import json
print(json.dumps({
  'id': 'big-ussy-canonical',
  'ownerCredential': ${OWNER_SUBJECT@Q},
  'peerDid': 'did:web:big.ussy.promethean.rest',
  'label': 'Big Ussy Canonical Proxx',
  'baseUrl': 'http://host.docker.internal:8789',
  'controlBaseUrl': 'http://host.docker.internal:8789',
  'auth': {'credential': ${REMOTE_CANON_TOKEN@Q}},
  'capabilities': {'accounts': True, 'usage': True, 'audit': True},
  'status': 'active',
}))
PY
)

  run "curl -fsS -X POST -H Authorization:'Bearer ${LOCAL_CANON_TOKEN}' -H 'Content-Type: application/json' ${LOCAL_CANON_URL@Q}/api/ui/federation/peers --data '${local_body}'"
  run "curl -fsS -X POST -H Authorization:'Bearer ${REMOTE_CANON_TOKEN}' -H 'Content-Type: application/json' ${REMOTE_CANON_URL@Q}/api/ui/federation/peers --data '${remote_body}'"
  run "curl -fsS -X POST -H Authorization:'Bearer ${REMOTE_CEPHALON_PROXX_TOKEN}' -H 'Content-Type: application/json' http://big.ussy.promethean.rest:18779/api/ui/federation/peers --data '${remote_ceph_body}'"
}

start_sync_daemons() {
  local local_log="${WORKSPACE_ROOT}/services/proxx/logs/canonical-sync-local.log"
  local local_pid="${WORKSPACE_ROOT}/services/proxx/.runtime/canonical-sync-local.pid"
  run "mkdir -p ${WORKSPACE_ROOT@Q}/services/proxx/logs ${WORKSPACE_ROOT@Q}/services/proxx/.runtime"
  log "start canonical federation sync daemons"
  if [[ "$APPLY" == "1" ]]; then
    if [[ -f "$local_pid" ]] && kill -0 "$(cat "$local_pid")" >/dev/null 2>&1; then
      kill "$(cat "$local_pid")" >/dev/null 2>&1 || true
    fi

    nohup env \
      PROXX_CANON_SYNC_BASE_URL="${LOCAL_CANON_URL}" \
      PROXX_CANON_SYNC_AUTH_TOKEN="${LOCAL_CANON_TOKEN}" \
      PROXX_CANON_SYNC_OWNER_SUBJECT="${OWNER_SUBJECT}" \
      PROXX_CANON_SYNC_PEER_ID="big-ussy-canonical" \
      PROXX_CANON_SYNC_INTERVAL_MS="300000" \
      PROXX_CANON_SYNC_INITIAL_DELAY_MS="20000" \
      PROXX_CANON_SYNC_JITTER_MS="15000" \
      node "${WORKSPACE_ROOT}/services/proxx/sync/canonical-federation-sync.mjs" >"${local_log}" 2>&1 &
    echo $! >"${local_pid}"

    ssh -i "$REMOTE_SSH_KEY" "$REMOTE_HOST" "mkdir -p ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/logs ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/.runtime; if [ -f ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/.runtime/canonical-sync-remote.pid ] && kill -0 \$(cat ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/.runtime/canonical-sync-remote.pid) >/dev/null 2>&1; then kill \$(cat ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/.runtime/canonical-sync-remote.pid) >/dev/null 2>&1 || true; fi; nohup env PROXX_CANON_SYNC_BASE_URL=http://127.0.0.1:8789 PROXX_CANON_SYNC_AUTH_TOKEN=${REMOTE_CANON_TOKEN@Q} PROXX_CANON_SYNC_OWNER_SUBJECT=${OWNER_SUBJECT@Q} PROXX_CANON_SYNC_PEER_ID=local-canonical PROXX_CANON_SYNC_INTERVAL_MS=300000 PROXX_CANON_SYNC_INITIAL_DELAY_MS=25000 PROXX_CANON_SYNC_JITTER_MS=20000 node ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/sync/canonical-federation-sync.mjs > ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/logs/canonical-sync-remote.log 2>&1 & echo \$! > ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/.runtime/canonical-sync-remote.pid"
  fi
}

prime_sync_once() {
  run "env PROXX_CANON_SYNC_BASE_URL=${LOCAL_CANON_URL@Q} PROXX_CANON_SYNC_AUTH_TOKEN=${LOCAL_CANON_TOKEN@Q} PROXX_CANON_SYNC_OWNER_SUBJECT=${OWNER_SUBJECT@Q} PROXX_CANON_SYNC_PEER_ID=big-ussy-canonical PROXX_CANON_SYNC_ONCE=true PROXX_CANON_SYNC_INITIAL_DELAY_MS=1 node ${WORKSPACE_ROOT@Q}/services/proxx/sync/canonical-federation-sync.mjs"
  run_remote "env PROXX_CANON_SYNC_BASE_URL=http://127.0.0.1:8789 PROXX_CANON_SYNC_AUTH_TOKEN=${REMOTE_CANON_TOKEN@Q} PROXX_CANON_SYNC_OWNER_SUBJECT=${OWNER_SUBJECT@Q} PROXX_CANON_SYNC_PEER_ID=local-canonical PROXX_CANON_SYNC_ONCE=true PROXX_CANON_SYNC_INITIAL_DELAY_MS=1 node ${REMOTE_WORKSPACE_ROOT@Q}/services/proxx/sync/canonical-federation-sync.mjs"
}

main() {
  log "workspace: ${WORKSPACE_ROOT}"
  log "remote host: ${REMOTE_HOST}"
  log "owner subject: ${OWNER_SUBJECT}"
  log "mode: $([[ "$APPLY" == "1" ]] && echo apply || echo dry-run)"

  build_local_artifacts
  sync_workspace_tree
  write_remote_envs
  ensure_remote_network

  if [[ "$SKIP_TUNNEL" != "1" ]]; then
    setup_reverse_tunnel
  else
    log "skipping reverse tunnel / relay setup"
  fi

  bring_up_remote_stack

  if [[ "$APPLY" == "1" ]]; then
    wait_for_health "local canonical" "$LOCAL_CANON_URL" "$LOCAL_CANON_TOKEN"
    wait_for_health "remote canonical" "$REMOTE_CANON_URL" "$REMOTE_CANON_TOKEN"
    wait_for_health "remote cephalon-proxx" "http://big.ussy.promethean.rest:18779" "$REMOTE_CEPHALON_PROXX_TOKEN"
  fi

  register_federation_peers
  prime_sync_once

  if [[ "$SKIP_SYNC_DAEMONS" != "1" ]]; then
    start_sync_daemons
  else
    log "skipping canonical sync daemons"
  fi

  cat <<EOF

Projection plan complete.

Local canonical:
  ${LOCAL_CANON_URL}
Remote canonical:
  ${REMOTE_CANON_URL}
Remote cephalon-hive proxx:
  http://big.ussy.promethean.rest:18779
Owner subject:
  ${OWNER_SUBJECT}
Reverse relay (remote -> local canonical):
  http://host.docker.internal:${REMOTE_RELAY_PORT}

Run with --apply to execute if you only performed a dry-run.
EOF
}

main "$@"

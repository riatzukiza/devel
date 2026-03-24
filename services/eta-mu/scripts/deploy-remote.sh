#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${DEPLOY_COMPOSE_PROJECT_NAME:?DEPLOY_COMPOSE_PROJECT_NAME is required}"

DEPLOY_CONTAINER_NAME="${DEPLOY_CONTAINER_NAME:-${DEPLOY_COMPOSE_PROJECT_NAME}-eta-mu}"
DEPLOY_PORT="${DEPLOY_PORT:-8790}"
DEPLOY_BIND_HOST="${DEPLOY_BIND_HOST:-0.0.0.0}"
DEPLOY_HEALTH_TIMEOUT_SECONDS="${DEPLOY_HEALTH_TIMEOUT_SECONDS:-180}"
DEPLOY_AUTOMATION_ENABLED="${DEPLOY_AUTOMATION_ENABLED:-true}"
DEPLOY_AUTOMATION_INTERVAL_MS="${DEPLOY_AUTOMATION_INTERVAL_MS:-300000}"
DEPLOY_AUTOMATION_VAULTS="${DEPLOY_AUTOMATION_VAULTS:-proxx}"
DEPLOY_CONTROL_PLANE_RECEIPTS_PATH="${DEPLOY_CONTROL_PLANE_RECEIPTS_PATH:-.Π/eta_mu_control_plane_receipts.v1.jsonl}"
DEPLOY_GITHUB_TOKEN="${DEPLOY_GITHUB_TOKEN:-}"
DEPLOY_PUBLIC_HOST="${DEPLOY_PUBLIC_HOST:-}"
DEPLOY_ENV_APPEND="${DEPLOY_ENV_APPEND:-}"

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

expand_remote_path() {
  local raw_path="$1"
  if [[ "$raw_path" == "~/"* ]]; then
    local remote_home
    remote_home="$(ssh "${SSH_OPTS[@]}" "$REMOTE" 'printf %s "$HOME"')"
    printf '%s/%s' "$remote_home" "${raw_path#"~/"}"
    return 0
  fi
  printf '%s' "$raw_path"
}

REMOTE_DEPLOY_PATH="$(expand_remote_path "$DEPLOY_PATH")"

render_caddyfile() {
  local template_path="$1"
  local output_path="$2"
  local public_host="$3"
  local upstream_port="$4"
  python3 - "$template_path" "$output_path" "$public_host" "$upstream_port" <<'PY'
from pathlib import Path
import sys

template_path, output_path, public_host, upstream_port = sys.argv[1:5]
text = Path(template_path).read_text(encoding='utf-8')
text = text.replace('__PUBLIC_HOST__', public_host)
text = text.replace('__UPSTREAM_PORT__', upstream_port)
Path(output_path).write_text(text, encoding='utf-8')
PY
}

push_remote_file() {
  local local_path="$1"
  local remote_path="$2"
  local remote_dir
  remote_dir="$(dirname "$remote_path")"
  ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$remote_dir' && cat > '$remote_path'" < "$local_path"
}

write_env_file() {
  cat > "$TMP_DIR/.env" <<EOF
ETA_MU_CONTAINER_NAME=${DEPLOY_CONTAINER_NAME}
ETA_MU_PORT=${DEPLOY_PORT}
ETA_MU_BIND_HOST=${DEPLOY_BIND_HOST}
ETA_MU_GITHUB_TOKEN=${DEPLOY_GITHUB_TOKEN}
ETA_MU_AUTOMATION_ENABLED=${DEPLOY_AUTOMATION_ENABLED}
ETA_MU_AUTOMATION_INTERVAL_MS=${DEPLOY_AUTOMATION_INTERVAL_MS}
ETA_MU_AUTOMATION_VAULTS=${DEPLOY_AUTOMATION_VAULTS}
ETA_MU_CONTROL_PLANE_RECEIPTS_PATH=${DEPLOY_CONTROL_PLANE_RECEIPTS_PATH}
EOF

  if [[ -n "$DEPLOY_ENV_APPEND" ]]; then
    printf '\n%s\n' "$DEPLOY_ENV_APPEND" >> "$TMP_DIR/.env"
  fi
}

sync_payload() {
  ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$REMOTE_DEPLOY_PATH/packages/eta-mu-docs' '$REMOTE_DEPLOY_PATH/packages/eta-mu-truth' '$REMOTE_DEPLOY_PATH/services/eta-mu' '$REMOTE_DEPLOY_PATH/services/eta-mu-truth-workbench'"

  rsync -az --delete \
    --exclude '/node_modules/' \
    --exclude '/.git/' \
    --exclude '/dist/' \
    "$ROOT_DIR/packages/eta-mu-docs/" "$REMOTE:$REMOTE_DEPLOY_PATH/packages/eta-mu-docs/"

  rsync -az --delete \
    --exclude '/node_modules/' \
    --exclude '/.git/' \
    --exclude '/dist/' \
    "$ROOT_DIR/packages/eta-mu-truth/" "$REMOTE:$REMOTE_DEPLOY_PATH/packages/eta-mu-truth/"

  rsync -az --delete \
    --exclude '/node_modules/' \
    --exclude '/.git/' \
    --exclude '/dist/' \
    "$ROOT_DIR/services/eta-mu/" "$REMOTE:$REMOTE_DEPLOY_PATH/services/eta-mu/"

  rsync -az --delete \
    --exclude '/node_modules/' \
    --exclude '/.git/' \
    --exclude '/dist/' \
    "$ROOT_DIR/services/eta-mu-truth-workbench/" "$REMOTE:$REMOTE_DEPLOY_PATH/services/eta-mu-truth-workbench/"

  push_remote_file "$TMP_DIR/.env" "$REMOTE_DEPLOY_PATH/.env"

  if [[ -n "$DEPLOY_PUBLIC_HOST" ]]; then
    render_caddyfile "$ROOT_DIR/services/eta-mu/Caddyfile.template" "$TMP_DIR/Caddyfile.runtime" "$DEPLOY_PUBLIC_HOST" "$DEPLOY_PORT"
    push_remote_file "$TMP_DIR/Caddyfile.runtime" "$REMOTE_DEPLOY_PATH/Caddyfile.runtime"
  fi
}

remote_compose_up() {
  ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- "$REMOTE_DEPLOY_PATH" "$DEPLOY_COMPOSE_PROJECT_NAME" <<'EOF'
set -euo pipefail
DEPLOY_PATH="$1"
DEPLOY_COMPOSE_PROJECT_NAME="$2"
cd "$DEPLOY_PATH"
docker compose --env-file "$DEPLOY_PATH/.env" --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f services/eta-mu/compose.yaml up -d --build --remove-orphans
EOF
}

wait_for_remote_health() {
  ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- "$REMOTE_DEPLOY_PATH" "$DEPLOY_COMPOSE_PROJECT_NAME" "$DEPLOY_HEALTH_TIMEOUT_SECONDS" <<'EOF'
set -euo pipefail
DEPLOY_PATH="$1"
DEPLOY_COMPOSE_PROJECT_NAME="$2"
DEPLOY_HEALTH_TIMEOUT_SECONDS="$3"
cd "$DEPLOY_PATH"
deadline=$(( $(date +%s) + DEPLOY_HEALTH_TIMEOUT_SECONDS ))
while true; do
  container_id="$(docker compose --env-file "$DEPLOY_PATH/.env" --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f services/eta-mu/compose.yaml ps -q eta-mu)"
  if [[ -n "$container_id" ]]; then
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
    if [[ "$health" == "healthy" || "$health" == "running" ]]; then
      exit 0
    fi
  fi

  if (( $(date +%s) >= deadline )); then
    echo "eta-mu remote deploy health check timed out" >&2
    docker compose --env-file "$DEPLOY_PATH/.env" --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f services/eta-mu/compose.yaml ps >&2 || true
    docker compose --env-file "$DEPLOY_PATH/.env" --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f services/eta-mu/compose.yaml logs --tail=200 >&2 || true
    exit 1
  fi

  sleep 5
done
EOF
}

write_env_file
sync_payload
remote_compose_up
wait_for_remote_health

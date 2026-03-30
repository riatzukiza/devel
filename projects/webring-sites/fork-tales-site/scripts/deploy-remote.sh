#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"

DEPLOY_PORT="${DEPLOY_PORT:-8794}"
DEPLOY_BIND_HOST="${DEPLOY_BIND_HOST:-127.0.0.1}"
DEPLOY_COMPOSE_PROJECT_NAME="${DEPLOY_COMPOSE_PROJECT_NAME:-fork-tales-site}"
DEPLOY_HEALTH_TIMEOUT_SECONDS="${DEPLOY_HEALTH_TIMEOUT_SECONDS:-240}"
DEPLOY_PUBLIC_HOST="${DEPLOY_PUBLIC_HOST:-}"
DEPLOY_CADDY_ADMIN_URL="${DEPLOY_CADDY_ADMIN_URL:-}"
DEPLOY_CADDY_TEMPLATE="${DEPLOY_CADDY_TEMPLATE:-deploy/Caddyfile.template}"
DEPLOY_VENV_PATH="${DEPLOY_VENV_PATH:-.build-venv}"
DEPLOY_SERVICE_NAME="${DEPLOY_SERVICE_NAME:-fork-tales-site}"

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

expand_remote_path() {
  local raw_path="$1"
  if [[ $raw_path == \~/* ]]; then
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

sync_payload() {
  ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$REMOTE_DEPLOY_PATH'"

  rsync -az --delete \
    --exclude '/.git/' \
    --exclude '/.venv/' \
    --exclude '/__pycache__/' \
    --exclude '/.pytest_cache/' \
    --exclude '/dist/' \
    --exclude '/.env' \
    --exclude '/*.log' \
    "$ROOT_DIR/" "$REMOTE:$REMOTE_DEPLOY_PATH/"

  if [[ -n "${DEPLOY_ENV_FILE:-}" ]]; then
    printf '%s' "$DEPLOY_ENV_FILE" > "$TMP_DIR/.env"
    push_remote_file "$TMP_DIR/.env" "$REMOTE_DEPLOY_PATH/.env"
  fi

  if [[ -n "$DEPLOY_PUBLIC_HOST" ]]; then
    render_caddyfile "$ROOT_DIR/$DEPLOY_CADDY_TEMPLATE" "$TMP_DIR/Caddyfile.runtime" "$DEPLOY_PUBLIC_HOST" "$DEPLOY_PORT"
    push_remote_file "$TMP_DIR/Caddyfile.runtime" "$REMOTE_DEPLOY_PATH/Caddyfile.runtime"
  fi
}

remote_build_site_and_up() {
  ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- "$REMOTE_DEPLOY_PATH" "$DEPLOY_VENV_PATH" "$DEPLOY_COMPOSE_PROJECT_NAME" "$DEPLOY_PORT" "$DEPLOY_BIND_HOST" <<'EOF'
set -euo pipefail
DEPLOY_PATH="$1"
DEPLOY_VENV_PATH="$2"
DEPLOY_COMPOSE_PROJECT_NAME="$3"
DEPLOY_PORT="$4"
DEPLOY_BIND_HOST="$5"
cd "$DEPLOY_PATH"
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
python3 -m venv "$DEPLOY_VENV_PATH"
source "$DEPLOY_VENV_PATH/bin/activate"
python -m pip install --upgrade pip >/dev/null
pip install . >/dev/null
python build_site.py
FORK_TALES_PORT="$DEPLOY_PORT" FORK_TALES_BIND_HOST="$DEPLOY_BIND_HOST" docker compose --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f compose.yaml up -d --build --remove-orphans
EOF
}

ensure_caddy_route() {
  if [[ -z "$DEPLOY_PUBLIC_HOST" || -z "$DEPLOY_CADDY_ADMIN_URL" ]]; then
    return 0
  fi
  ssh "${SSH_OPTS[@]}" "$REMOTE" python3 - <<'PY'
import json
import os
import sys
import urllib.request

public_host = os.environ['DEPLOY_PUBLIC_HOST']
admin_url = os.environ['DEPLOY_CADDY_ADMIN_URL'].rstrip('/')
upstream = f"127.0.0.1:{os.environ['DEPLOY_PORT']}"
routes_url = f"{admin_url}/config/apps/http/servers/srv0/routes"

with urllib.request.urlopen(urllib.request.Request(routes_url, method='GET'), timeout=10) as response:
    routes = json.loads(response.read().decode('utf-8'))

def route_matches(route):
    for matcher in route.get('match', []):
        if public_host in matcher.get('host', []):
            return True
    return False

def route_points_to_upstream(route):
    for handle in route.get('handle', []):
        for nested in handle.get('routes', []):
            for proxy in nested.get('handle', []):
                if proxy.get('handler') != 'reverse_proxy':
                    continue
                for candidate in proxy.get('upstreams', []):
                    if candidate.get('dial') == upstream:
                        return True
    return False

route_object = {
    'match': [{'host': [public_host]}],
    'handle': [
        {
            'handler': 'subroute',
            'routes': [
                {
                    'handle': [
                        {
                            'handler': 'reverse_proxy',
                            'upstreams': [{'dial': upstream}],
                        }
                    ]
                }
            ],
        }
    ],
    'terminal': True,
}

for index, route in enumerate(routes):
    if not route_matches(route):
        continue
    if route_points_to_upstream(route):
        sys.exit(0)
    delete_request = urllib.request.Request(f"{routes_url}/{index}", method='DELETE')
    urllib.request.urlopen(delete_request, timeout=10).read()
    break

post_request = urllib.request.Request(
    routes_url,
    data=json.dumps(route_object).encode('utf-8'),
    method='POST',
    headers={'Content-Type': 'application/json'},
)
urllib.request.urlopen(post_request, timeout=10).read()
PY
}

wait_for_remote_health() {
  ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- "$REMOTE_DEPLOY_PATH" "$DEPLOY_COMPOSE_PROJECT_NAME" "$DEPLOY_SERVICE_NAME" "$DEPLOY_HEALTH_TIMEOUT_SECONDS" <<'EOF'
set -euo pipefail
DEPLOY_PATH="$1"
DEPLOY_COMPOSE_PROJECT_NAME="$2"
DEPLOY_SERVICE_NAME="$3"
DEPLOY_HEALTH_TIMEOUT_SECONDS="$4"
cd "$DEPLOY_PATH"
deadline=$(( $(date +%s) + DEPLOY_HEALTH_TIMEOUT_SECONDS ))
while true; do
  container_id="$(docker compose --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f compose.yaml ps -q "$DEPLOY_SERVICE_NAME")"
  if [[ -n "$container_id" ]]; then
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
    if [[ "$health" == "healthy" || "$health" == "running" ]]; then
      exit 0
    fi
  fi
  if (( $(date +%s) >= deadline )); then
    echo "fork tales remote deploy health check timed out" >&2
    docker compose --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f compose.yaml ps >&2 || true
    docker compose --project-name "$DEPLOY_COMPOSE_PROJECT_NAME" -f compose.yaml logs --tail=200 >&2 || true
    exit 1
  fi
  sleep 5
done
EOF
}

sync_payload
remote_build_site_and_up
DEPLOY_PUBLIC_HOST="$DEPLOY_PUBLIC_HOST" DEPLOY_CADDY_ADMIN_URL="$DEPLOY_CADDY_ADMIN_URL" DEPLOY_PORT="$DEPLOY_PORT" ensure_caddy_route
wait_for_remote_health

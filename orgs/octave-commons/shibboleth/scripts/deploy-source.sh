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

PORT="${PORT:-8787}"
UI_PORT="${UI_PORT:-5197}"
UI_HOST="${UI_HOST:-0.0.0.0}"

LOG_DIR="${ROOT_DIR}/data/control-plane"
API_LOG_PATH="${API_LOG_PATH:-${LOG_DIR}/server.log}"
UI_LOG_PATH="${UI_LOG_PATH:-${LOG_DIR}/ui.log}"
API_PIDFILE="${API_PIDFILE:-${LOG_DIR}/api.pid}"
UI_PIDFILE="${UI_PIDFILE:-${LOG_DIR}/ui.pid}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:${PORT}/api/health}"
UI_HEALTH_URL="${UI_HEALTH_URL:-http://127.0.0.1:${UI_PORT}/}"

mkdir -p "$LOG_DIR"

kill_listener() {
  local port="$1"
  local pidfile="$2"
  if [[ -f "$pidfile" ]]; then
    kill "$(cat "$pidfile")" >/dev/null 2>&1 || true
    rm -f "$pidfile"
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti "tcp:${port}" | xargs -r kill >/dev/null 2>&1 || true
  fi
}

kill_listener "$PORT" "$API_PIDFILE"
kill_listener "$UI_PORT" "$UI_PIDFILE"

nohup env PORT="$PORT" LOG_PATH="$API_LOG_PATH" bash scripts/ussy_host_control_plane.sh >/tmp/shibboleth-control-plane-launch.log 2>&1 &
echo $! > "$API_PIDFILE"

nohup env HOST="$UI_HOST" PORT="$UI_PORT" LOG_PATH="$UI_LOG_PATH" bash scripts/ussy_host_ui.sh >/tmp/shibboleth-ui-launch.log 2>&1 &
echo $! > "$UI_PIDFILE"

for _ in $(seq 1 60); do
  if curl -fsS "$API_HEALTH_URL" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "$API_HEALTH_URL" >/dev/null

for _ in $(seq 1 60); do
  if curl -fsS "$UI_HEALTH_URL" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "$UI_HEALTH_URL" >/dev/null

echo "Shibboleth deploy healthy: ${API_HEALTH_URL} ${UI_HEALTH_URL}"
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
LOG_DIR="${LOG_DIR:-data/control-plane}"
LOG_PATH="${LOG_PATH:-${LOG_DIR}/server.log}"
mkdir -p "$LOG_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] starting control plane on :${PORT}" | tee -a "$LOG_PATH"
exec env PORT="$PORT" clojure -M:control-plane 2>&1 | tee -a "$LOG_PATH"

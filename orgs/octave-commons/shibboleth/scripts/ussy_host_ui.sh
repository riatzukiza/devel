#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="${ROOT_DIR}/ui"
cd "$UI_DIR"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-5197}"
LOG_DIR="${ROOT_DIR}/data/control-plane"
LOG_PATH="${LOG_PATH:-${LOG_DIR}/ui.log}"
mkdir -p "$LOG_DIR"

if [[ ! -d node_modules ]]; then
  npm install
fi

npm run build

mkdir -p "$LOG_DIR"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] serving UI on ${HOST}:${PORT}" | tee -a "$LOG_PATH"
exec python3 -m http.server "$PORT" --bind "$HOST" --directory dist 2>&1 | tee -a "$LOG_PATH"

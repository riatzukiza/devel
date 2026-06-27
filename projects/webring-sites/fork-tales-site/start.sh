#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
set -a
. ./.env
if [[ -f .venv/bin/activate ]]; then
  # shellcheck disable=SC1091
  . .venv/bin/activate
fi
exec python3 server.py --root dist --host 127.0.0.1 --port "${FORK_TALES_PORT:-8794}"

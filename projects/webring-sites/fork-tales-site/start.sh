#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
set -a
. ./.env
exec python3 server.py --root dist --host 127.0.0.1 --port 8794

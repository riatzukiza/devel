#!/usr/bin/env bash
set -euo pipefail
pkill -f "server.py --root dist --host 127.0.0.1 --port ${FORK_TALES_PORT:-8794}" || true
pkill -f "uvicorn.*fork_tales_api.app:create_app" || true

#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
APP_DIR="$REPO_ROOT/app"
FORK_DIR="$REPO_ROOT/codex-linux-fork"

if [ ! -f "$APP_DIR/.vite/build/main.js" ]; then
  echo "ERROR: extracted app shell missing at $APP_DIR/.vite/build/main.js"
  echo "Run ./scripts/ci-build.sh or extract Codex.app into $APP_DIR first."
  exit 1
fi

if [ ! -d "$APP_DIR/webview" ]; then
  echo "ERROR: extracted webview missing at $APP_DIR/webview"
  exit 1
fi

mkdir -p "$FORK_DIR/.vite" "$FORK_DIR/node_modules"

tar -C "$APP_DIR/.vite" -cf - build | tar -C "$FORK_DIR/.vite" -xf -
tar -C "$APP_DIR" -cf - webview | tar -C "$FORK_DIR" -xf -

if [ -d "$APP_DIR/node_modules/tslib" ]; then
  tar -C "$APP_DIR/node_modules" -cf - tslib | tar -C "$FORK_DIR/node_modules" -xf -
fi

find "$FORK_DIR/.vite" "$FORK_DIR/webview" -type f \( -name '.DS_Store' -o -name '._*' \) -delete 2>/dev/null || true

echo "Prepared Linux fork shell from $APP_DIR"

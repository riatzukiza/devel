#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspace}"

if [ ! -d "$WORKSPACE_ROOT" ]; then
  echo "[mcp-stack] expected mounted workspace at $WORKSPACE_ROOT" >&2
  exit 1
fi

mkdir -p \
  "$WORKSPACE_ROOT/services/mcp-fs-oauth/data" \
  "$WORKSPACE_ROOT/services/janus/logs" \
  "$WORKSPACE_ROOT/services/kronos/logs" \
  "$WORKSPACE_ROOT/services/mnemosyne/logs" \
  "$WORKSPACE_ROOT/services/mcp-github/logs" \
  "$WORKSPACE_ROOT/services/mcp-process/logs" \
  "$WORKSPACE_ROOT/services/mcp-devtools/logs" \
  "$WORKSPACE_ROOT/services/mcp-tdd/logs" \
  "$WORKSPACE_ROOT/services/mcp-sandboxes/logs" \
  "$WORKSPACE_ROOT/services/mcp-ollama/logs" \
  "$WORKSPACE_ROOT/services/mcp-exec/logs"

build_if_missing() {
  local artifact="$1"
  local command="$2"
  if [ ! -e "$artifact" ]; then
    echo "[mcp-stack] missing $artifact; running: $command"
    bash -lc "$command"
  fi
}

build_if_missing "$WORKSPACE_ROOT/packages/aether/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/aether build"
build_if_missing "$WORKSPACE_ROOT/packages/hermes/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/hermes build"
build_if_missing "$WORKSPACE_ROOT/packages/mcp-oauth/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-oauth build"
build_if_missing "$WORKSPACE_ROOT/packages/openplanner-cljs-client/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/openplanner-cljs-client build"
build_if_missing "$WORKSPACE_ROOT/packages/opencode-cljs-client/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/opencode-cljs-client build"
build_if_missing "$WORKSPACE_ROOT/services/janus/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/janus build"
build_if_missing "$WORKSPACE_ROOT/services/kronos/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/kronos build"
build_if_missing "$WORKSPACE_ROOT/services/mnemosyne/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mnemosyne build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-fs-oauth/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter mcp-fs-oauth build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-github/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-github build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-process/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-process build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-devtools/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-devtools build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-tdd/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-tdd build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-sandboxes/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-sandboxes build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-ollama/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-ollama build"
build_if_missing "$WORKSPACE_ROOT/services/mcp-exec/dist/main.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @workspace/mcp-exec build"

if [ -z "${OPENCODE_PASSWORD:-}" ]; then
  opencode_password_file="$WORKSPACE_ROOT/services/opencode-stack/data/secrets/opencode-server-password.txt"
  if [ -s "$opencode_password_file" ]; then
    export OPENCODE_PASSWORD="$(tr -d '\n' < "$opencode_password_file")"
  fi
fi

exec pm2-runtime start /app/ecosystem.container.config.cjs

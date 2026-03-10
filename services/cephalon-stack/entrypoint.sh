#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspace}"

if [ ! -d "$WORKSPACE_ROOT" ]; then
  echo "[cephalon-stack] expected mounted workspace at $WORKSPACE_ROOT" >&2
  exit 1
fi

mkdir -p \
  "$WORKSPACE_ROOT/services/cephalon-cljs/logs" \
  "$WORKSPACE_ROOT/packages/cephalon-ts/logs"

build_if_missing() {
  local artifact="$1"
  local command="$2"
  if [ ! -e "$artifact" ]; then
    echo "[cephalon-stack] missing $artifact; running: $command"
    bash -lc "$command"
  fi
}

build_if_missing "$WORKSPACE_ROOT/packages/event/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/event build"
build_if_missing "$WORKSPACE_ROOT/packages/openplanner-cljs-client/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/openplanner-cljs-client build"
build_if_missing "$WORKSPACE_ROOT/packages/cephalon-ts/dist/index.js" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/cephalon-ts build"

if [ ! -f "$WORKSPACE_ROOT/services/cephalon-cljs/dist/cephalon.js" ]; then
  echo "[cephalon-stack] missing /workspace/services/cephalon-cljs/dist/cephalon.js" >&2
  echo "[cephalon-stack] build it on the host with: pnpm --dir /workspace --filter @promethean-os/cephalon-cljs build" >&2
  exit 1
fi

exec pm2-runtime start /app/ecosystem.container.config.cjs

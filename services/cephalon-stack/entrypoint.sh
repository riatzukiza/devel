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

mkdir -p /app/node_modules/@promethean-os

link_workspace_package() {
  local package_name="$1"
  local source_path="$2"
  local target_path="/app/node_modules/@promethean-os/$package_name"
  if [ -d "$source_path" ]; then
    ln -sfn "$source_path" "$target_path"
  fi
}

link_workspace_package "cephalon-ts" "$WORKSPACE_ROOT/packages/cephalon-ts"
link_workspace_package "openplanner-cljs-client" "$WORKSPACE_ROOT/packages/openplanner-cljs-client"
if [ -d "$WORKSPACE_ROOT/packages/event/dist" ]; then
  link_workspace_package "event" "$WORKSPACE_ROOT/packages/event"
elif [ -d "$WORKSPACE_ROOT/orgs/riatzukiza/promethean/packages/event/dist" ]; then
  link_workspace_package "event" "$WORKSPACE_ROOT/orgs/riatzukiza/promethean/packages/event"
fi

export NODE_PATH="/app/node_modules${NODE_PATH:+:$NODE_PATH}"

install_runtime_dependencies_from_package_json() {
  local package_json="$1"
  if [ ! -f "$package_json" ]; then
    return 0
  fi

  local specs
  specs=$(node -e '
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const specs = Object.entries(pkg.dependencies || {})
      .filter(([name]) => !name.startsWith("@promethean-os/"))
      .map(([name, version]) => `${name}@${version}`);
    process.stdout.write(specs.join(" "));
  ' "$package_json")

  if [ -n "$specs" ]; then
    echo "[cephalon-stack] ensuring runtime dependencies from $package_json"
    pnpm add --dir /app $specs
  fi
}

ensure_runtime_dependency() {
  local module_name="$1"
  local package_spec="$2"
  if node -e "require.resolve('${module_name}')" >/dev/null 2>&1; then
    return 0
  fi

  echo "[cephalon-stack] installing runtime dependency ${package_spec} in /app"
  pnpm add --dir /app "$package_spec"
}

install_runtime_dependencies_from_package_json "$WORKSPACE_ROOT/services/cephalon-cljs/package.json"
install_runtime_dependencies_from_package_json "$WORKSPACE_ROOT/packages/cephalon-ts/package.json"

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
if [ -e "$WORKSPACE_ROOT/packages/cephalon-ts/dist/index.cjs" ] || [ -e "$WORKSPACE_ROOT/packages/cephalon-ts/dist/index.js" ]; then
  :
else
  build_if_missing "$WORKSPACE_ROOT/packages/cephalon-ts/dist/index.cjs" "pnpm --dir '$WORKSPACE_ROOT' --filter @promethean-os/cephalon-ts build"
fi

if [ ! -f "$WORKSPACE_ROOT/services/cephalon-cljs/dist/cephalon.js" ]; then
  echo "[cephalon-stack] missing /workspace/services/cephalon-cljs/dist/cephalon.js" >&2
  echo "[cephalon-stack] build it on the host with: pnpm --dir /workspace --filter @promethean-os/cephalon-cljs build" >&2
  exit 1
fi

ensure_runtime_dependency "openai" "openai@^4.76.0"
ensure_runtime_dependency "discord.js" "discord.js@^14.16.3"
ensure_runtime_dependency "source-map-support" "source-map-support@^0.5.21"
ensure_runtime_dependency "chokidar" "chokidar@^3.6.0"

exec pm2-runtime start /app/ecosystem.container.config.cjs

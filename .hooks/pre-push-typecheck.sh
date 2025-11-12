#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_PREPUSH_TYPECHECK:-0}" == "1" ]]; then
  printf "[pre-push:typecheck] Skipping because SKIP_PREPUSH_TYPECHECK=1\n"
  exit 0
fi

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

log() {
  printf "[pre-push:typecheck] %s\n" "$1"
}

if command -v pnpm >/dev/null 2>&1 && [[ -f nx.json ]]; then
  log "Running pnpm nx run-many -t typecheck --all"
  pnpm nx run-many -t typecheck --all
  exit 0
fi

if command -v pnpm >/dev/null 2>&1 && ([[ -f pnpm-lock.yaml ]] || [[ -f pnpm-workspace.yaml ]] || [[ -f package.json ]]); then
  log "Running pnpm run --if-present typecheck"
  pnpm run --if-present typecheck
  exit 0
fi

if [[ -f package.json ]] && command -v npm >/dev/null 2>&1; then
  log "Running npm run typecheck --if-present"
  npm run typecheck --if-present
  exit 0
fi

if [[ -f package.json ]] && command -v bun >/dev/null 2>&1; then
  log "Running bun run typecheck"
  bun run typecheck
  exit 0
fi

if [[ -f deno.json || -f deno.jsonc ]] && command -v deno >/dev/null 2>&1; then
  log "Running deno check"
  deno check
  exit 0
fi

if [[ -f tsconfig.json ]] && command -v npx >/dev/null 2>&1; then
  log "Running npx tsc --noEmit"
  npx tsc --noEmit
  exit 0
fi

log "Skipping typecheck (no supported toolchain found)"

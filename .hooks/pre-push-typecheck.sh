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

remote_name="${1:-origin}"
remote_url="${2:-}"
head_sha=$(git rev-parse HEAD)
push_updates=()

if [[ ! -t 0 ]]; then
  while read -r local_ref local_sha remote_ref remote_sha; do
    push_updates+=("$local_ref $local_sha $remote_ref $remote_sha")
  done
fi

selected_push_line=""
for entry in "${push_updates[@]}"; do
  IFS=' ' read -r entry_local_ref entry_local_sha entry_remote_ref entry_remote_sha <<<"$entry"
  if [[ -z "$selected_push_line" ]]; then
    selected_push_line="$entry"
  fi
  if [[ "$entry_local_sha" == "$head_sha" ]]; then
    selected_push_line="$entry"
    break
  fi
done

selected_remote_ref=""
selected_remote_sha=""
if [[ -n "$selected_push_line" ]]; then
  IFS=' ' read -r selected_local_ref selected_local_sha selected_remote_ref selected_remote_sha <<<"$selected_push_line"
fi

remote_branch_name=""
if [[ -n "$selected_remote_ref" ]]; then
  remote_branch_name="${selected_remote_ref#refs/heads/}"
fi

default_base_candidate=""
default_base_note=""
if [[ -n "$selected_remote_sha" && ! "$selected_remote_sha" =~ ^0+$ ]]; then
  if git cat-file -e "${selected_remote_sha}^{commit}" >/dev/null 2>&1; then
    default_base_candidate="$selected_remote_sha"
    default_base_note="remote ${remote_name}/${remote_branch_name:-$selected_remote_ref}"
  fi
fi

if [[ -z "$default_base_candidate" && -n "$remote_branch_name" ]]; then
  tracking_ref="refs/remotes/${remote_name}/${remote_branch_name}"
  if git rev-parse --verify "$tracking_ref" >/dev/null 2>&1; then
    default_base_candidate="$tracking_ref"
    default_base_note="$tracking_ref"
  fi
fi

NX_RESOLVED_BASE="${NX_BASE_REF:-${default_base_candidate:-origin/main}}"
if [[ -n "${NX_BASE_REF:-}" ]]; then
  NX_BASE_SELECTION_MSG="Using Nx base override ${NX_RESOLVED_BASE} (NX_BASE_REF)"
elif [[ -n "$default_base_note" ]]; then
  NX_BASE_SELECTION_MSG="Using Nx base derived from ${default_base_note}: ${NX_RESOLVED_BASE}"
else
  NX_BASE_SELECTION_MSG="Using Nx base default ${NX_RESOLVED_BASE}"
fi

run_nx_affected_typecheck() {
  local head_ref="${NX_HEAD_REF:-HEAD}"
  local desired_base="${NX_RESOLVED_BASE:-origin/main}"
  local base_sha=""

  if ! git rev-parse --verify "$head_ref" >/dev/null 2>&1; then
    head_ref="HEAD"
  fi

  if git rev-parse --verify "$desired_base" >/dev/null 2>&1; then
    if base_sha=$(git merge-base "$head_ref" "$desired_base" 2>/dev/null); then
      :
    else
      base_sha=$(git rev-parse "$desired_base" 2>/dev/null || true)
    fi
  fi

  if [[ -z "$base_sha" ]]; then
    if base_sha=$(git rev-parse "${head_ref}~1" 2>/dev/null); then
      log "Falling back to ${head_ref}~1 for Nx base"
    else
      log "Unable to determine Nx base reference (tried ${desired_base} and ${head_ref}~1)"
      return 1
    fi
  else
    log "$NX_BASE_SELECTION_MSG (merge-base ${base_sha})"
  fi

  log "Running pnpm nx affected -t typecheck --base ${base_sha} --head ${head_ref}"
  pnpm nx affected -t typecheck --base "$base_sha" --head "$head_ref"
}

if command -v pnpm >/dev/null 2>&1 && [[ -f nx.json ]]; then
  run_nx_affected_typecheck
  nx_exit=$?

  if [[ $nx_exit -eq 0 ]]; then
    log "Nx affected typecheck completed"
    exit 0
  fi

  log "Nx affected typecheck failed (exit ${nx_exit}); aborting pre-push checks"
  exit "$nx_exit"
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

#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_PRECOMMIT_SECRETS:-0}" == "1" ]]; then
  printf "[pre-commit:secrets] Skipping because SKIP_PRECOMMIT_SECRETS=1\n"
  exit 0
fi

log() {
  printf "[pre-commit:secrets] %s\n" "$1"
}

format_mib() {
  awk -v bytes="$1" 'BEGIN { printf "%.2f MiB", bytes / 1048576 }'
}

matches_blocked_generated_path() {
  case "$1" in
    services/*/db-backups/*|labs/*/runs/*|*__pycache__/*|*.pyc)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if ! command -v detect-secrets-hook >/dev/null 2>&1; then
  log "Missing detect-secrets-hook; install detect-secrets to enable the secrets gate"
  exit 1
fi

repo_root=$(git rev-parse --show-toplevel)
MAX_GIT_BLOB_BYTES=${MAX_GIT_BLOB_BYTES:-104857600}
staged_paths=()
scan_paths=()

while IFS= read -r -d '' path; do
  staged_paths+=("$path")
done < <(git -C "$repo_root" diff --cached --name-only --diff-filter=ACMR -z --)

if [[ ${#staged_paths[@]} -eq 0 ]]; then
  log "No staged files to scan"
  exit 0
fi

if [[ "${SKIP_GIT_ARTIFACT_GUARD:-0}" != "1" ]]; then
  blocked_paths=()
  oversized_paths=()

  for path in "${staged_paths[@]}"; do
    object_type=$(git -C "$repo_root" cat-file -t ":$path" 2>/dev/null || true)
    if [[ "$object_type" != "blob" ]]; then
      continue
    fi

    if matches_blocked_generated_path "$path"; then
      blocked_paths+=("$path")
    fi

    blob_size=$(git -C "$repo_root" cat-file -s ":$path" 2>/dev/null || printf '0')
    if (( blob_size > MAX_GIT_BLOB_BYTES )); then
      oversized_paths+=("$(format_mib "$blob_size")  $path")
    fi
  done

  if [[ ${#blocked_paths[@]} -gt 0 ]]; then
    log "Blocked generated/runtime artifacts staged for commit:"
    printf '  %s\n' "${blocked_paths[@]}"
    log "Move these artifacts outside git or set SKIP_GIT_ARTIFACT_GUARD=1 for an explicit one-off override"
    exit 1
  fi

  if [[ ${#oversized_paths[@]} -gt 0 ]]; then
    log "Staged blob(s) exceed MAX_GIT_BLOB_BYTES=$(format_mib "$MAX_GIT_BLOB_BYTES"):"
    printf '  %s\n' "${oversized_paths[@]}"
    log "Use Git LFS/external storage or set SKIP_GIT_ARTIFACT_GUARD=1 for an explicit one-off override"
    exit 1
  fi
else
  log "Skipping generated artifact guard because SKIP_GIT_ARTIFACT_GUARD=1"
fi

for path in "${staged_paths[@]}"; do
  case "$path" in
    */pnpm-lock.yaml|pnpm-lock.yaml|*/package-lock.json|package-lock.json|*/yarn.lock|yarn.lock|*/bun.lock|bun.lock|*/bun.lockb|bun.lockb)
      continue
      ;;
  esac
  object_type=$(git -C "$repo_root" cat-file -t ":$path" 2>/dev/null || true)
  if [[ "$object_type" == "blob" ]]; then
    scan_paths+=("$path")
  fi
done

if [[ ${#scan_paths[@]} -eq 0 ]]; then
  log "No staged blobs to scan"
  exit 0
fi

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/pre-commit-secrets.XXXXXX")
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

printf '%s\0' "${scan_paths[@]}" | git -C "$repo_root" checkout-index --quiet --force --stdin -z --prefix="$tmp_dir/"

baseline_args=()
if [[ -f "$repo_root/.secrets.baseline" ]]; then
  baseline_args+=(--baseline "$repo_root/.secrets.baseline")
elif [[ -f "$repo_root/.detect-secrets.baseline" ]]; then
  baseline_args+=(--baseline "$repo_root/.detect-secrets.baseline")
fi

log "Scanning ${#scan_paths[@]} staged file(s) for secrets"
if (cd "$tmp_dir" && detect-secrets-hook "${baseline_args[@]}" "${scan_paths[@]}"); then
  log "No secrets detected"
  exit 0
fi

log "Secret scan failed; remove the secret or update the detect-secrets baseline if the value is intentional"
exit 1

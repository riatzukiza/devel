#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_PRECOMMIT_SECRETS:-0}" == "1" ]]; then
  printf "[pre-commit:secrets] Skipping because SKIP_PRECOMMIT_SECRETS=1\n"
  exit 0
fi

log() {
  printf "[pre-commit:secrets] %s\n" "$1"
}

if ! command -v detect-secrets-hook >/dev/null 2>&1; then
  log "Missing detect-secrets-hook; install detect-secrets to enable the secrets gate"
  exit 1
fi

repo_root=$(git rev-parse --show-toplevel)
staged_paths=()
scan_paths=()

while IFS= read -r -d '' path; do
  staged_paths+=("$path")
done < <(git -C "$repo_root" diff --cached --name-only --diff-filter=ACMR -z --)

if [[ ${#staged_paths[@]} -eq 0 ]]; then
  log "No staged files to scan"
  exit 0
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
scan_output=$(detect-secrets -C "$tmp_dir" scan "${baseline_args[@]}" "${scan_paths[@]}")
if python -c 'import json, sys; payload = json.load(sys.stdin); sys.exit(0 if not payload.get("results") else 1)' <<<"$scan_output"
then
  log "No secrets detected"
  exit 0
fi

log "Secret scan failed; remove the secret or update the detect-secrets baseline if the value is intentional"
exit 1

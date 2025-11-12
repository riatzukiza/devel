#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
HOOK_SOURCE="$ROOT_DIR/.hooks/pre-push-typecheck.sh"

if [[ ! -f "$HOOK_SOURCE" ]]; then
  echo "Unable to find hook source at $HOOK_SOURCE" >&2
  exit 1
fi

install_hook() {
  local hook_dir=$1
  mkdir -p "$hook_dir"
  install -m 755 "$HOOK_SOURCE" "$hook_dir/pre-push"
}

ensure_nx_ignore() {
  local exclude_file=$1
  mkdir -p "$(dirname "$exclude_file")"
  touch "$exclude_file"
  if ! grep -qx '.nx/' "$exclude_file" >/dev/null 2>&1; then
    printf '\n.nx/\n' >> "$exclude_file"
  fi
}

# Install for root repository
ROOT_HOOK_DIR=$(git -C "$ROOT_DIR" rev-parse --git-path hooks)
install_hook "$ROOT_HOOK_DIR"
echo "Installed pre-push hook for root repo"
ROOT_EXCLUDE=$(git -C "$ROOT_DIR" rev-parse --git-path info/exclude)
ensure_nx_ignore "$ROOT_EXCLUDE"
echo "Ensured .nx ignore for root repo"

# Install for each submodule recursively
if git -C "$ROOT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  HOOK_SOURCE="$HOOK_SOURCE" git -C "$ROOT_DIR" submodule foreach --quiet --recursive "
    hook_dir=\$(git rev-parse --git-path hooks)
    mkdir -p \"\$hook_dir\"
    install -m 755 \"$HOOK_SOURCE\" \"\$hook_dir/pre-push\"
    exclude_file=\$(git rev-parse --git-path info/exclude)
    mkdir -p \"\$(dirname \"\$exclude_file\")\"
    touch \"\$exclude_file\"
    if ! grep -qx \".nx/\" \"\$exclude_file\" >/dev/null 2>&1; then
      printf \"\\n.nx/\\n\" >> \"\$exclude_file\"
    fi
    echo \"Installed pre-push hook and ensured .nx ignore for \$path\"
  "
fi

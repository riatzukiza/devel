#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
DEPLOY_USER="${DEPLOY_USER:-error}"

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [[ -n "${DEPLOY_ENV_FILE:-}" ]]; then
  printf '%s' "$DEPLOY_ENV_FILE" > "$TMP_DIR/.env"
fi
if [[ -n "${DEPLOY_PROXY_AUTH_ENV:-}" ]]; then
  printf '%s' "$DEPLOY_PROXY_AUTH_ENV" > "$TMP_DIR/proxy-auth.env"
fi

ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$DEPLOY_PATH' ~/.config/shibboleth"

rsync -az --delete \
  --exclude '/.git/' \
  --exclude '/data/' \
  --exclude '/.cpcache/' \
  --exclude '/.clj-kondo/' \
  --exclude '/.lsp/' \
  --exclude '/ui/node_modules/' \
  --exclude '/ui/dist/' \
  --exclude '/.ημ/' \
  "$ROOT_DIR/" "$REMOTE:$DEPLOY_PATH/"

if [[ -f "$TMP_DIR/.env" ]]; then
  rsync -az "$TMP_DIR/.env" "$REMOTE:$DEPLOY_PATH/.env"
fi
if [[ -f "$TMP_DIR/proxy-auth.env" ]]; then
  rsync -az "$TMP_DIR/proxy-auth.env" "$REMOTE:~/.config/shibboleth/proxy-auth.env"
fi

ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- "$DEPLOY_PATH" "${VERIFY_API_HEALTH_URL:-http://127.0.0.1:8787/api/health}" "${VERIFY_UI_HEALTH_URL:-http://127.0.0.1:5197/}" <<'EOF'
set -euo pipefail
DEPLOY_PATH="$1"
VERIFY_API_HEALTH_URL="$2"
VERIFY_UI_HEALTH_URL="$3"

for tool in java clojure node npm python3; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "missing required runtime on host: $tool" >&2
    exit 1
  }
done

cd "$DEPLOY_PATH"
chmod +x scripts/*.sh
API_HEALTH_URL="$VERIFY_API_HEALTH_URL" UI_HEALTH_URL="$VERIFY_UI_HEALTH_URL" ./scripts/deploy-source.sh
EOF
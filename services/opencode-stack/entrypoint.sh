#!/usr/bin/env bash
set -euo pipefail

export HOME="${HOME:-/root}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-${HOME}/.config}"
export XDG_DATA_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-${HOME}/.cache}"
export XDG_STATE_HOME="${XDG_STATE_HOME:-${HOME}/.local/state}"
export OPENCODE_STACK_DATA_DIR="${OPENCODE_STACK_DATA_DIR:-/srv/opencode-stack-data}"
export OPENCODE_GATEWAY_DATA_DIR="${OPENCODE_GATEWAY_DATA_DIR:-${OPENCODE_STACK_DATA_DIR}}"
export OPENCODE_SERVER_USERNAME="${OPENCODE_SERVER_USERNAME:-opencode}"
export WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspace}"
export PM2_HOME="${PM2_HOME:-${OPENCODE_STACK_DATA_DIR}/pm2}"

mkdir -p \
  "${XDG_CONFIG_HOME}" \
  "${XDG_DATA_HOME}" \
  "${XDG_CACHE_HOME}" \
  "${XDG_STATE_HOME}" \
  "${OPENCODE_STACK_DATA_DIR}/secrets" \
  "${OPENCODE_STACK_DATA_DIR}/logs" \
  "${PM2_HOME}"

cd "${WORKSPACE_ROOT}"

if [ -d "/workspace/.opencode" ]; then
  mkdir -p /workspace/.opencode
fi

if [ -z "${OPENCODE_SERVER_PASSWORD:-}" ]; then
  export OPENCODE_SERVER_PASSWORD="$({
    if [ -s "${OPENCODE_STACK_DATA_DIR}/secrets/opencode-server-password.txt" ]; then
      tr -d '\n' < "${OPENCODE_STACK_DATA_DIR}/secrets/opencode-server-password.txt"
    else
      python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
    fi
  })"
  printf '%s\n' "${OPENCODE_SERVER_PASSWORD}" > "${OPENCODE_STACK_DATA_DIR}/secrets/opencode-server-password.txt"
  chmod 600 "${OPENCODE_STACK_DATA_DIR}/secrets/opencode-server-password.txt"
fi

exec pm2-runtime start /app/ecosystem.container.config.cjs

#!/usr/bin/env bash
set -euo pipefail

SERVICE_ROOT="/home/err/devel/services/proxx"
REPO_ROOT="/home/err/devel/orgs/open-hax/proxx"

set -a
# shellcheck disable=SC1091
. "$SERVICE_ROOT/.env"
set +a

# Canonicalize Xiaomi/MiMo env aliases from legacy spellings in services/proxx/.env.
export XIAOMI_API_KEY="${XIAOMI_API_KEY:-${MIMO_API_KEY:-${XAIOMI_API_KEY:-${XIaOMI_API_KEY:-${XAIOMI_MIMO_API_KEY:-}}}}}"
export MIMO_API_KEY="${MIMO_API_KEY:-${XIAOMI_API_KEY:-}}"
export XIAOMI_BASE_URL="${XIAOMI_BASE_URL:-${XIAOMI_API_BASE_URL:-${MIMO_BASE_URL:-${XAIOMI_API_BASE_URL:-${XAIOMI_MIMO_API_BASE_URL:-https://api.xiaomimimo.com/v1}}}}}"
export MIMO_BASE_URL="${MIMO_BASE_URL:-${XIAOMI_BASE_URL:-}}"
export XIAOMI_PROVIDER_ID="${XIAOMI_PROVIDER_ID:-xiaomi}"

export NODE_ENV="development"
export PROXY_HOST="127.0.0.1"
export PROXY_PORT="${PROXX_HOST_PROXY_PORT:-18789}"
export PORT="$PROXY_PORT"
export PROXX_WEB_PORT="${PROXX_HOST_WEB_PORT:-15174}"
export VITE_DEV_PORT="$PROXX_WEB_PORT"
export VITE_PROXY_BASE_URL="http://127.0.0.1:$PROXY_PORT"
export OPENAI_OAUTH_CALLBACK_PORT="${PROXX_HOST_OAUTH_CALLBACK_PORT:-18755}"
export PROXY_KEYS_FILE="$SERVICE_ROOT/seeds/keys.json"
export PROXY_MODELS_FILE="$SERVICE_ROOT/models.json"
export PROXY_REQUEST_LOGS_FILE="$SERVICE_ROOT/data/request-logs.jsonl"
export DATABASE_URL="${PROXX_DEV_DATABASE_URL:-postgresql://openai_proxy:openai_proxy@127.0.0.1:${PROXX_DEV_DB_PORT:-15439}/openai_proxy}" # pragma: allowlist secret
export PROXX_CLJS_RUNTIME_REQUIRED="true"
export PROXX_CLJS_POLICY_SHADOW="true"
export PROXX_CLJS_POLICY_AUTHORITATIVE="true"
export PROXX_CLJS_POLICY_MANIFEST="$SERVICE_ROOT/policies/runtime/00-manifest.edn"
export OLLAMA_BASE_URL="${OLLAMA_BASE_URL_HOST:-http://127.0.0.1:11434}"
export UPSTREAM_PROVIDER_BASE_URLS="${UPSTREAM_PROVIDER_BASE_URLS_HOST:-ollama-cloud=https://ollama.com,ollama-lan=http://192.168.12.68:11434,openai=https://chatgpt.com/backend-api,vivgrid=https://api.vivgrid.com,requesty=https://router.requesty.ai/v1,llamacpp=http://127.0.0.1:8082,llamacpp-embed=http://127.0.0.1:8081}"
export EMBED_MODEL_PROVIDER_ALIASES="${EMBED_MODEL_PROVIDER_ALIASES:-qwen3-embedding:0.6b=llamacpp-embed,qwen3-embedding-0.6b=llamacpp-embed}"
export CHROMA_URL="${CHROMA_URL_HOST:-http://127.0.0.1:8000}"
export HOST_DASHBOARD_RUNTIME_ROOT="$SERVICE_ROOT"

cd "$REPO_ROOT"
exec "$@"

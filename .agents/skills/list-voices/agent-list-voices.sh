#!/usr/bin/env bash
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "Missing: jq" >&2; exit 2; }

VOXX_BASE_URL="${VOXX_BASE_URL:-${VOICE_GATEWAY_BASE_URL:-http://127.0.0.1:8787}}"
API_KEY="${VOICE_GATEWAY_API_KEY:-dev-token}"
FILTER=""
AS_JSON=0
OPENAI_SHAPE=0
LEGACY_ELEVENLABS=0
POSTPROCESS_PROFILES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url|--voxx-url) VOXX_BASE_URL="${2%/}"; shift 2 ;;
    --api-key) API_KEY="$2"; shift 2 ;;
    --filter) FILTER="$2"; shift 2 ;;
    --json) AS_JSON=1; shift ;;
    --openai) OPENAI_SHAPE=1; shift ;;
    --postprocess-profiles|--profiles) POSTPROCESS_PROFILES=1; shift ;;
    --legacy-elevenlabs) LEGACY_ELEVENLABS=1; shift ;;
    *) echo "Unknown: $1" >&2; exit 2 ;;
  esac
done

if [[ "$LEGACY_ELEVENLABS" == "1" ]]; then
  : "${ELEVENLABS_API_KEY:?Set ELEVENLABS_API_KEY for --legacy-elevenlabs}"
  RESP=$(curl -fsS "https://api.elevenlabs.io/v2/voices" -H "xi-api-key: $ELEVENLABS_API_KEY")
  if [[ "$AS_JSON" == "1" ]]; then echo "$RESP" | jq .; exit 0; fi
  echo "$RESP" | jq -r '.voices[] | [.name, .voice_id, (.category // ""), (.labels.provider // .labels.gender // ""), (.labels.age // "")] | @tsv' \
    | { if [[ -n "$FILTER" ]]; then grep -i "$FILTER" || true; else cat; fi; } \
    | column -t -s $'\t'
  exit 0
fi

if [[ "$POSTPROCESS_PROFILES" == "1" ]]; then
  RESP=$(curl -fsS "$VOXX_BASE_URL/v1/audio/postprocess-profiles" -H "Authorization: Bearer $API_KEY")
  if [[ "$AS_JSON" == "1" ]]; then echo "$RESP" | jq .; exit 0; fi
  echo "$RESP" | jq -r '.profiles[] | [.id, .name, .description] | @tsv' \
    | { if [[ -n "$FILTER" ]]; then grep -i "$FILTER" || true; else cat; fi; } \
    | column -t -s $'\t'
  exit 0
fi

if [[ "$OPENAI_SHAPE" == "1" ]]; then
  RESP=$(curl -fsS "$VOXX_BASE_URL/v1/voices/openai" -H "Authorization: Bearer $API_KEY")
  if [[ "$AS_JSON" == "1" ]]; then echo "$RESP" | jq .; exit 0; fi
  echo "$RESP" | jq -r '.data[] | [.name, .id, (.provider // "openhax"), (.language // "")] | @tsv' \
    | { if [[ -n "$FILTER" ]]; then grep -i "$FILTER" || true; else cat; fi; } \
    | column -t -s $'\t'
  exit 0
fi

RESP=$(curl -fsS "$VOXX_BASE_URL/v1/voices" -H "Authorization: Bearer $API_KEY")
if [[ "$AS_JSON" == "1" ]]; then echo "$RESP" | jq .; exit 0; fi
echo "$RESP" | jq -r '.voices[] | [.name, .voice_id, (.category // ""), (.labels.provider // "openhax"), (.labels.accent // "")] | @tsv' \
  | { if [[ -n "$FILTER" ]]; then grep -i "$FILTER" || true; else cat; fi; } \
  | column -t -s $'\t'

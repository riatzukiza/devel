#!/usr/bin/env bash
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "Missing: jq" >&2; exit 2; }

VOXX_BASE_URL="${VOXX_BASE_URL:-${VOICE_GATEWAY_BASE_URL:-http://127.0.0.1:8787}}"
API_KEY="${VOICE_GATEWAY_API_KEY:-dev-token}"
ACTION="list"
VOICE_ID=""
AS_JSON=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url|--voxx-url) VOXX_BASE_URL="${2%/}"; shift 2 ;;
    --api-key) API_KEY="$2"; shift 2 ;;
    --list) ACTION="list"; shift ;;
    --get|--settings) ACTION="settings"; VOICE_ID="$2"; shift 2 ;;
    --json) AS_JSON=1; shift ;;
    --clone|--delete)
      echo "Voxx currently exposes provider-agnostic voice listing, settings lookup, and synthesis. Clone/delete remain direct-provider operations; use ElevenLabs UI/API explicitly." >&2
      exit 3
      ;;
    *) echo "Unknown: $1" >&2; exit 2 ;;
  esac
done

case "$ACTION" in
  list)
    RESP=$(curl -fsS "$VOXX_BASE_URL/v1/voices" -H "Authorization: Bearer $API_KEY")
    if [[ "$AS_JSON" == "1" ]]; then echo "$RESP" | jq .; exit 0; fi
    echo "$RESP" | jq -r '.voices[] | [.name, .voice_id, (.category // ""), (.labels.provider // "openhax"), (.description // "")] | @tsv' | column -t -s $'\t'
    ;;
  settings)
    [[ -n "$VOICE_ID" ]] || { echo "--settings VOICE_ID required" >&2; exit 2; }
    RESP=$(curl -fsS "$VOXX_BASE_URL/v1/voices/$VOICE_ID/settings" -H "Authorization: Bearer $API_KEY")
    echo "$RESP" | jq .
    ;;
esac

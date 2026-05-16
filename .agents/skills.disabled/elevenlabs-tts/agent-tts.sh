#!/usr/bin/env bash
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "Missing: jq" >&2; exit 2; }

VOXX_URL="${VOXX_URL:-${VOICE_GATEWAY_SPEECH_URL:-http://127.0.0.1:8787/v1/audio/speech}}"
API_KEY="${VOICE_GATEWAY_API_KEY:-dev-token}"
TEXT=""
OUTPUT="dry.wav"
VOICE="alloy"
MODEL="kokoro"
FORMAT="wav"
SPEED="1.0"
LEGACY_ELEVENLABS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --text) TEXT="$2"; shift 2 ;;
    --voice) VOICE="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --speed) SPEED="$2"; shift 2 ;;
    --voxx-url|--url) VOXX_URL="$2"; shift 2 ;;
    --api-key) API_KEY="$2"; shift 2 ;;
    --legacy-elevenlabs) LEGACY_ELEVENLABS=1; shift ;;
    *) echo "Unknown: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$TEXT" ]] || { echo "--text required" >&2; exit 2; }

if [[ "$LEGACY_ELEVENLABS" == "1" ]]; then
  : "${ELEVENLABS_API_KEY:?Set ELEVENLABS_API_KEY for --legacy-elevenlabs}"
  RAW="${OUTPUT%.*}.raw"
  curl -fL \
    -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=pcm_44100" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    --data "$(jq -n --arg text "$TEXT" --arg model "$MODEL" '{text:$text, model_id:$model}')" \
    --output "$RAW"
  ffmpeg -y -f s16le -ar 44100 -ac 1 -i "$RAW" "$OUTPUT"
  rm -f "$RAW"
  echo "Wrote $OUTPUT via ElevenLabs direct"
  exit 0
fi

payload=$(jq -n \
  --arg input "$TEXT" \
  --arg voice "$VOICE" \
  --arg model "$MODEL" \
  --arg response_format "$FORMAT" \
  --argjson speed "$SPEED" \
  '{input:$input, voice:$voice, model:$model, response_format:$response_format, speed:$speed}')

curl -fsSL \
  -X POST "$VOXX_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  --data "$payload" \
  --output "$OUTPUT"

echo "Wrote $OUTPUT via Voxx Gateway"

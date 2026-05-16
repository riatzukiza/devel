#!/usr/bin/env bash
set -euo pipefail

: "${ELEVENLABS_API_KEY:?Set ELEVENLABS_API_KEY first}"
: "${ELEVENLABS_VOICE_ID:?Set ELEVENLABS_VOICE_ID too}"

curl -fL \
     -X POST "https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}" \
     -H "xi-api-key: $ELEVENLABS_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{
    "text": "Hello from a quick ElevenLabs API test.",
    "model_id": "eleven_multilingual_v2"
  }' \
     --output eleven-tts-test.mp3

file eleven-tts-test.mp3
echo "Wrote eleven-tts-test.mp3"

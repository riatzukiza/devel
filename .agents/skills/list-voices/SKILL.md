---
name: list-voices
description: "Retrieve voices and TTS postprocess profiles from the Voxx gateway, with optional legacy ElevenLabs direct mode."
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: audio-production
  version: 3
---

# Skill: list-voices

## Purpose
Query the local Voxx gateway for provider-agnostic voice IDs, names, categories, labels, OpenAI-compatible voice shape, and available TTS postprocess profiles.

Voxx fronts Kokoro, Xiaomi MiMo, Requesty/OpenAI-compatible remotes, MeloTTS, and fallback engines behind one API, so prefer Voxx voice IDs unless you explicitly need a direct provider operation. The current workspace TTS default is Kokoro `af_jessica` at speed `1.15` for a brighter, energetic female voice. TTS callers may select a specific Voxx provider per request with the OpenAI-compatible `model` field, or with `voice-tts`/`tts.sh --model` values such as `kokoro`, `melo`, `espeak`, `xiaomi_mimo`, `requesty`, or `openai`; inspect `x-openhax-tts-backend` to confirm which provider rendered audio. If a remote provider is quota-limited or returns auth/status-code errors, keep using Voxx and configure local fallbacks after it (for example `VOICE_GATEWAY_TTS_BACKEND_ORDER=xiaomi_mimo,kokoro,espeak`) rather than changing agent prompts or bypassing Voxx.

## Dependencies
- `curl`, `jq`
- Voxx running locally, default: `http://127.0.0.1:8787`
- `VOICE_GATEWAY_API_KEY` if not using the dev default (`dev-token`)

## Usage
```bash
.agents/skills/list-voices/agent-list-voices.sh
.agents/skills/list-voices/agent-list-voices.sh --filter bright
.agents/skills/list-voices/agent-list-voices.sh --openai
.agents/skills/list-voices/agent-list-voices.sh --postprocess-profiles
.agents/skills/list-voices/agent-list-voices.sh --json
```

Optional legacy direct ElevenLabs listing:
```bash
ELEVENLABS_API_KEY=... .agents/skills/list-voices/agent-list-voices.sh --legacy-elevenlabs
```

## Voxx endpoints
- `GET /v1/voices` — Voxx provider-agnostic catalog shape
- `GET /v1/voices/openai` — OpenAI-style voice list
- `GET /v1/voices/{voice_id}/settings` — voice settings
- `GET /v1/audio/postprocess-profiles` — final mastering profile IDs, descriptions, and aliases

## Postprocess profiles
Use these IDs or aliases with `voice-tts` request options:

- `sports-commentator-v1` (`sports`, `commentator`)
- `broadcast-warm-v1` (`broadcast`, `warm`)
- `narrator-polish-v1` (`narrator`, `polish`)
- `crisp-radio-v1` (`radio`, `crisp`)
- `soft-studio-v1` (`soft`, `studio`)

## Skill chain
→ precedes: `voice-tts`

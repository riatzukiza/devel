---
name: elevenlabs-voice-manage
description: "Inspect Voxx gateway voices and settings, with direct-provider clone/delete intentionally left explicit."
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: audio-production
  version: 2
---

# Skill: elevenlabs-voice-manage

## Purpose
Inspect the voice catalog exposed by Voxx and retrieve voice settings for a specific voice. Voxx is the preferred abstraction for day-to-day agent use because it can route across Kokoro, MeloTTS, ElevenLabs, and fallback engines.

## Dependencies
- `curl`, `jq`
- Voxx running locally, default: `http://127.0.0.1:8787`

## Usage

### List Voxx voices
```bash
.agents/skills/elevenlabs-voice-manage/agent-voice-manage.sh --list
.agents/skills/elevenlabs-voice-manage/agent-voice-manage.sh --list --json
```

### Read settings for one voice
```bash
.agents/skills/elevenlabs-voice-manage/agent-voice-manage.sh --settings alloy
```

## Clone/delete note
Voxx currently exposes provider-agnostic listing, settings lookup, and synthesis. Voice cloning/deletion are account-mutating provider operations; do those directly against ElevenLabs only when the user explicitly asks and credentials are intentionally provided.

## Skill chain
→ informs: `list-voices`, `elevenlabs-tts`, `voice-tts`

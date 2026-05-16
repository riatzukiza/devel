---
name: elevenlabs-tts
description: "Generate dry spoken audio through the Voxx gateway, with optional legacy ElevenLabs direct mode."
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: audio-production
  version: 2
---

# Skill: elevenlabs-tts

## Purpose
Generate dry spoken audio for pitch correction or downstream mixing. Prefer Voxx instead of calling ElevenLabs directly: Voxx can route to Kokoro, MeloTTS, ElevenLabs, or fallback backends without changing the caller.

## Dependencies
- `curl`, `jq`
- Voxx running locally, default: `http://127.0.0.1:8787/v1/audio/speech`
- `ffmpeg` only for `--legacy-elevenlabs`

## Usage
```bash
.agents/skills/elevenlabs-tts/agent-tts.sh \
  --text "ahh stay with me tonight" \
  --voice alloy \
  --model kokoro \
  --format wav \
  --output dry.wav
```

Optional direct ElevenLabs compatibility path:
```bash
ELEVENLABS_API_KEY=... .agents/skills/elevenlabs-tts/agent-tts.sh \
  --legacy-elevenlabs \
  --text "ahh stay with me tonight" \
  --voice ErXwobaYiN019PkySvjV \
  --model eleven_multilingual_v2 \
  --output dry.wav
```

## Inputs
| Param | Description |
|---|---|
| `--text TEXT` | Lyrics or speech text |
| `--voice VOICE_ID` | Voxx voice ID or provider voice ID (default: `alloy`) |
| `--model MODEL` | Voxx model/backend hint (default: `kokoro`) |
| `--format FORMAT` | `wav`, `mp3`, `flac`, `opus`, or `pcm` (default: `wav`) |
| `--speed FLOAT` | Speed multiplier (default: `1.0`) |
| `--output FILE` | Output path |

## Good Voxx voice IDs
| Name | ID | Character |
|---|---|---|
| Alloy | `alloy` | Neutral default |
| Nova | `nova` | Bright, flexible |
| Onyx | `onyx` | Deeper, sturdy low-mid |
| Shimmer | `shimmer` | Airy |
| Kaede | `kaede` | Japanese-oriented |

## Skill chain
→ precedes: `autotune`
← follows: `list-voices`, agent provides text + note plan

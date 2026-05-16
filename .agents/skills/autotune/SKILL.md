---
name: autotune
description: Pitch-correct a dry WAV against a symbolic note plan using Rubber Band, producing a tuned WAV without a DAW.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: audio-production
  version: 1
---

# Skill: autotune

## Purpose
Pitch-correct a dry WAV against a symbolic note plan using Rubber Band, producing a tuned WAV without a DAW.

## Dependencies
- `rubberband-cli`, `ffmpeg`, `ffprobe`, `python3`
- `aubiopitch` (optional, for pitch inspection)

## Install
```bash
sudo apt install rubberband-cli ffmpeg python3 aubio
```

## Usage
```bash
.agent/skills/autotune/agent-autotune.sh \
  --input dry.wav \
  --notes notes.txt \
  --output tuned.wav \
  --strength 0.9 \
  --smooth-ms 35 \
  --formant
```

## Notes format
```text
# start_sec<TAB>end_sec<TAB>midi_note
0.00	0.40	60
0.40	0.85	62
0.85	1.20	64
1.20	1.60	67
```

## Model
Assumes neutral base MIDI 62 (D4). Computes per-region semitone offsets → Rubber Band pitchmap → render.

## Skill chain
→ precedes: `mix`
← follows: `voice-tts` dry capture; prefer `--postprocess off` before pitch correction, then add Voxx profile mastering after tuning if needed. Current dry spoken default is Kokoro `af_jessica` at speed `1.15`; override voice/speed only when the vocal plan requires it. If a remote Voxx-backed provider returns quota/rate-limit/auth/status-code errors, keep the request behind Voxx and rely on local fallbacks (`kokoro,espeak`) instead of changing prompts or issuing parallel retries.

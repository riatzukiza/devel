---
name: beat-render
description: Convert MIDI or WAV files to Ogg Opus using FFmpeg for Discord-ready audio.
---

# Skill: beat-render

## Goal
Transcode audio files (MIDI or WAV) to Ogg Opus format for use in Discord voice or web.

## Use This Skill When
- A MIDI or WAV file needs to be converted to Ogg for Discord streaming.
- Post-processing audio: trimming, normalizing, or re-encoding.
- Chaining after beat-compose to produce a playable artifact.

## Do Not Use This Skill When
- The goal is composition (use beat-compose).
- The file is already Ogg Opus and no processing is needed.

## Inputs
- Input audio path (.wav or .mid).
- Optional: output directory (default /tmp).

## Steps
1. Import `{ wavToOgg }` from `packages/beat-agent/src/render.js`.
2. For MIDI: first render to WAV with a soundfont synth (e.g. fluidsynth), then call `wavToOgg`.
3. For WAV: call `wavToOgg(wavPath, outDir)` directly.
4. Await the returned Promise to get the .ogg path.
5. Log the output path and file size.

## Output
- An `.ogg` file at `outDir/<name>.ogg`.

## Notes
- MIDI→audio requires a synth binary (fluidsynth, timidity) + a soundfont (.sf2) on the host.
- WAV→Ogg works with FFmpeg alone (already globally installed).
- Default bitrate: 128k Opus. Adjust `.audioBitrate()` for quality tradeoffs.

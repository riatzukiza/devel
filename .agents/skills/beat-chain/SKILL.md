---
name: beat-chain
description: Orchestrate the full beat pipeline from musical intent to Discord voice playback in one shot.
---

# Skill: beat-chain

## Goal
Run beat-theory → beat-compose → beat-render → beat-discord as a single end-to-end task.

## Use This Skill When
- Asked to "make a beat and play it" or "drop something in vc".
- A complete pipeline is needed with no intermediate checkpoints.
- Chaining all four sub-skills automatically.

## Do Not Use This Skill When
- Only one stage is needed (use the focused skill instead).
- A previous stage already produced an artifact.

## Inputs
- Natural-language musical intent (mood, genre, key, tempo BPM).
- Discord `guildId` and `channelId`.
- Optional: output directory (default /tmp).

## Steps
1. Activate **beat-theory**: resolve key, scale, chord progression from intent.
2. Activate **beat-compose**: build drum + melody + chord clips, write to `/tmp/<name>.mid`.
3. Activate **beat-render**: if WAV source available, transcode to `/tmp/<name>.ogg`.
4. Activate **beat-discord**: stream the `.ogg` into the voice channel.
5. Report: tempo, key, pattern strings used, file paths, playback status.

## Output
- Audio playing in Discord.
- Trace log: `{ key, scale, bpm, patterns, midiPath, oggPath, status }`.

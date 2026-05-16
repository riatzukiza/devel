---
name: beat-loop-pack
description: Generate a named pack of 4–8 related loops (kick, snare, hat, melody, bass) as individual MIDI files.
---

# Skill: beat-loop-pack

## Goal
Produce a cohesive loop pack around a single musical idea — one file per element, all in the same key/tempo.

## Use This Skill When
- Asked to "make a pack", "give me stems", or "generate a full groove kit".
- Building material for a Discord music bot to mix and match.
- Seeding a generative composition session.

## Do Not Use This Skill When
- A single combined MIDI is enough (use beat-compose).

## Inputs
- Pack name (used for file naming).
- Key, scale, BPM.
- Elements: any subset of `[kick, snare, hihat, openhat, clap, bass, melody, chords, arp]`.
- Output directory.

## Steps
1. Resolve theory via beat-theory.
2. For each requested element, call the appropriate clip builder.
3. Write each clip to `<outDir>/<packName>-<element>.mid`.
4. Emit a manifest JSON: `{ packName, bpm, key, files: [...] }`.

## Output
- N MIDI files + `manifest.json` in outDir.
- Manifest path logged for downstream use.

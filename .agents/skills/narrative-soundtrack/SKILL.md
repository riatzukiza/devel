---
name: narrative-soundtrack
description: Generate a multi-section adaptive soundtrack for a narrative scene, RPG encounter, or interactive story beat.
---

# Skill: narrative-soundtrack

## Goal
Produce 2–5 themed music sections that correspond to narrative states (calm, tension, action, resolution, mystery).

## Use This Skill When
- Building background music for a game, story bot, or interactive Discord experience.
- A scene has multiple emotional phases.
- Asked for "dungeon music", "boss theme", "town ambience", etc.

## Do Not Use This Skill When
- A single mood/loop is sufficient (use mood-to-music + beat-compose).

## Inputs
- Scene description or narrative arc.
- Number of sections (default 3).
- Transition style: `hard-cut | crossfade | swell`.

## Steps
1. Parse scene into phases: assign a mood to each phase using mood-to-music.
2. Generate parameters per phase (key may shift: e.g. parallel minor for tension).
3. Call beat-loop-pack for each phase — use shared BPM, vary density + texture.
4. Name files: `<scene>-01-calm.mid`, `<scene>-02-tension.mid`, etc.
5. Emit a playlist manifest with phase labels and suggested transition points.

## Output
- N MIDI files, one per phase.
- `soundtrack-manifest.json`: `{ scene, phases: [{ name, mood, params, file, transitionAt }] }`.

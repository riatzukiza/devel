---
name: beat-variation
description: Generate variations on an existing beat or melody by mutating patterns, transposing, or re-harmonizing.
---

# Skill: beat-variation

## Goal
Take an existing scribbletune clip or MIDI and produce a creative variation.

## Use This Skill When
- Asked to "remix", "flip", "variation", "make it different but similar".
- Evolving a generated beat across multiple Discord messages.
- A/B testing two versions of a loop.

## Do Not Use This Skill When
- Starting from scratch (use beat-compose).
- The change is a full genre/key switch (start over instead).

## Inputs
- Original clips array or MIDI path.
- Mutation type: `transpose | shuffle | density | swing | retrogade`.
- Amount: semitones for transpose, 0–1 probability for shuffle/density.

## Steps
1. Load the original clips or parse MIDI with `readMidi`.
2. Apply mutation:
   - `transpose`: shift all note values by N semitones using `Note.transpose` from @tonaljs.
   - `shuffle`: randomly swap hits in the pattern string (preserve density).
   - `density`: add/remove hits proportionally.
   - `swing`: delay every even 16th note by +N ticks.
   - `retrograde`: reverse the note sequence.
3. Write new MIDI, log delta from original.
4. Optionally chain to beat-render + beat-discord.

## Output
- New clips array or `.mid` file.
- Diff summary: what changed vs the original.

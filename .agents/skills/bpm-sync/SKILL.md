---
name: bpm-sync
description: Coordinate BPM across multiple beat-agent instances or external tools using a shared tempo state.
---

# Skill: bpm-sync

## Goal
Keep all generated clips, loops, and playback synchronized to a single BPM source of truth.

## Use This Skill When
- Multiple clips or agents are generating music simultaneously.
- A Discord bot jukeboxes between loops and needs consistent tempo.
- BPM changes mid-session (tempo ramp, half-time drops).

## Do Not Use This Skill When
- Single one-shot generation with no continuation.

## BPM State Contract
```js
// Shared state (EDN-style in JS)
const tempoState = {
  bpm: 120,
  beatsPerBar: 4,
  ticksPerBeat: 480,   // MIDI standard
  swing: 0,            // 0=straight, 1=full triplet swing
  updatedAt: Date.now()
};
```

## Steps
1. Initialize `tempoState` at session start.
2. Pass `tempoState.bpm` to all `scribble.clip` calls via `sclip.bpm`.
3. When BPM changes: update state, recompute tick offsets for in-flight clips.
4. Log every tempo event: `{ type: 'tempo-change', from, to, atBar }`.

## Output
- Updated `tempoState` object.
- Tempo change receipt.

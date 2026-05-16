---
name: beat-compose
description: Generate MIDI beats, melodies, and chord progressions using scribbletune and @tonaljs/tonal in Node.js.
---

# Skill: beat-compose

## Goal
Produce a MIDI file or clip object from a natural-language musical idea using the beat-agent toolkit.

## Use This Skill When
- Asked to generate a beat, loop, melody, chord progression, or groove.
- The task needs a MIDI file as output or input to a render step.
- Working inside packages/beat-agent/ or any package that imports from it.

## Do Not Use This Skill When
- Audio playback or Discord streaming is the primary goal (use beat-discord).
- The request is about recording or processing live audio.

## Inputs
- Musical intent: tempo, key, scale, mood, genre, pattern string (optional).
- Output path for .mid file (default: /tmp/<name>.mid).

## Steps
1. Import `{ drumClip, melodyClip, chordClip, writeClipsToMidi }` from `packages/beat-agent/src/`.
2. Choose pattern strings using scribbletune notation: `x` = hit, `-` = rest, `_` = tie.
3. Build clips: kick=36, snare=38, hihat=42 for drums; use `melodyClip` for pitched lines.
4. Combine clips into an array and call `writeClipsToMidi(clips, outPath)`.
5. Return the file path.

## Output
- A `.mid` file at the specified path.
- Log the tempo, key, and pattern used for traceability.

## Example
```js
import { drumClip, melodyClip, writeClipsToMidi } from './src/index.js';
const kick  = drumClip({ pattern: 'x---x---', instrument: 36 });
const snare = drumClip({ pattern: '--x---x-', instrument: 38 });
const hat   = drumClip({ pattern: 'x-x-x-x-', instrument: 42 });
const mel   = melodyClip({ root: 'A3', scaleName: 'minor', pattern: 'x-x-xxx-' });
writeClipsToMidi([kick, snare, hat, mel], '/tmp/beat.mid');
```

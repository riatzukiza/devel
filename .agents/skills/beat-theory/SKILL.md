---
name: beat-theory
description: "Use @tonaljs/tonal and teoria to resolve music theory queries: scales, chords, intervals, progressions."
---

# Skill: beat-theory

## Goal
Answer music theory questions or translate human-readable musical intent into concrete notes/chords/scales for use in composition.

## Use This Skill When
- Asked "what notes are in X scale/chord".
- Need to generate a chord progression from a key + mood descriptor.
- Transposing, harmonizing, or finding relative keys.
- Feeding theory output into beat-compose.

## Do Not Use This Skill When
- The question is purely about audio engineering or effects.
- Already have explicit notes/MIDI data (go directly to beat-compose).

## Inputs
- A musical intent: key, scale name, chord name, mood, genre.

## Steps
1. Import `{ Scale, Chord, Key, Interval, Note }` from `@tonaljs/tonal`.
2. Resolve the scale: `Scale.get('A minor')` returns `{ notes, intervals, ... }`.
3. For progressions: use `Key.majorKey('C')` or `Key.minorKey('A')` for diatonic chords.
4. Output an array of note names or MIDI numbers ready for `melodyClip` / `chordClip`.

## Output
- Array of note names or MIDI numbers.
- Human-readable explanation of the theory used (for agent trace).

## Quick Reference
```js
import { Scale, Chord, Key } from '@tonaljs/tonal';
Scale.get('A minor').notes;      // ['A','B','C','D','E','F','G']
Chord.get('Am7').notes;          // ['A','C','E','G']
Key.minorKey('A').natural.chords;// ['Am','Bm7b5','C','Dm','Em','F','G']
```

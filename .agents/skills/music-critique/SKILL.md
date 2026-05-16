---
name: music-critique
description: Evaluate a generated beat or composition against musical quality criteria and suggest improvements.
---

# Skill: music-critique

## Goal
Analyze a generated clip set or MIDI file and identify issues: clashing notes, rhythmic monotony, harmonic tension, poor dynamics.

## Use This Skill When
- Asked "is this good?", "what's wrong with this beat", "improve it".
- After beat-compose, before rendering, to catch problems cheaply.
- Iterating toward a higher-quality output.

## Do Not Use This Skill When
- The user just wants output fast with no quality gate.

## Evaluation Axes
1. **Rhythm**: Is density appropriate? Any double-hits or gaps that break the feel?
2. **Harmony**: Do melody notes fit the stated scale? Any unintentional dissonances?
3. **Voice leading**: Do chords move smoothly? Avoid parallel fifths in polyphonic lines.
4. **Dynamics**: Is every note the same velocity? Vary 60–90 for humanization.
5. **Structure**: Does the clip loop cleanly? Bar count = power of 2 preferred.

## Steps
1. Parse the clip array or MIDI with `readMidi`.
2. Check each axis; flag violations with bar + beat position.
3. Score 1–5 per axis. Emit overall score + top 3 actionable suggestions.
4. Optionally auto-fix: humanize velocities, quantize timing, remove clashing notes.

## Output
```
{ rhythm: 4, harmony: 3, voiceLeading: 2, dynamics: 2, structure: 5,
  overall: 3.2,
  suggestions: ['Add velocity variation (cur: all 80)', 'Parallel 5th at bar 3 beat 2', 'Melody note F# clashes with Am chord'] }
```

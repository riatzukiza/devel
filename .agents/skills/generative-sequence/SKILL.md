---
name: generative-sequence
description: Generate algorithmic/generative music sequences using Euclidean rhythms, Markov chains, L-systems, or cellular automata.
---

# Skill: generative-sequence

## Goal
Produce non-trivial, evolving musical sequences that go beyond simple pattern strings.

## Use This Skill When
- Asked for "generative", "evolving", "random but musical", "procedural" music.
- Building ambient, drone, or glitch compositions.
- The beat should feel alive rather than static.

## Do Not Use This Skill When
- A deterministic 1-bar loop is sufficient (use beat-compose).
- The user wants to specify every note explicitly.

## Algorithms

### Euclidean Rhythm
Distribute N hits evenly across K steps: `euclidean(3, 8)` → `x--x--x-`.
```js
function euclidean(hits, steps) {
  // Bjorklund algorithm
  let pattern = Array(steps).fill(0);
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += hits;
    if (bucket >= steps) { bucket -= steps; pattern[i] = 1; }
  }
  return pattern.map(x => x ? 'x' : '-').join('');
}
```

### Markov Melody
Build a transition matrix from a seed motif; walk it for N steps.

### L-System Rhythm
Expand a production rule string into a pattern: `A → AB, B → A`.

## Steps
1. Choose algorithm based on intent (Euclidean for grooves, Markov for melodies, L-System for ambient).
2. Generate pattern string(s).
3. Feed into beat-compose clip builders.
4. Optionally iterate: run N times with slight mutation per iteration.

## Output
- Pattern string(s) + the seed/parameters used (reproducible).
- MIDI file path via beat-compose.

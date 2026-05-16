---
name: mood-to-music
description: Translate a mood, emotion, or scene description into concrete music parameters (key, scale, tempo, instrumentation, texture).
---

# Skill: mood-to-music

## Goal
Bridge the gap between "vibe" and "parameters". Turn affective language into actionable musical choices.

## Use This Skill When
- The request uses mood/emotion words: sad, hype, chill, eerie, triumphant, chaotic.
- A scene or narrative context drives the music ("background for a boss fight").
- No explicit musical parameters were given.

## Do Not Use This Skill When
- Explicit key, tempo, and scale are already specified.

## Mood Matrix
| Mood | Key | Scale | BPM | Texture |
|---|---|---|---|---|
| sad | Am or Dm | natural minor | 60–80 | sparse, reverb, slow attack |
| hype | E or F# | major / dorian | 140–160 | dense, punchy, no reverb |
| chill | Cm or Gm | minor pentatonic | 80–95 | lo-fi, swing 60%, vinyl |
| eerie | Bm | phrygian / whole tone | 70–90 | long reverb, minor 2nds, sparse |
| triumphant | D or G | major | 120–140 | full, brass-like, short attack |
| chaotic | any | chromatic / octatonic | 180+ | high density, polyrhythm |
| romantic | F or C | major / lydian | 75–100 | piano-like, legato, long release |
| tense | Cm | harmonic minor | 100–120 | ostinato, rising lines |

## Steps
1. Classify the mood from input text (can be compound, e.g. "sad but hopeful").
2. Blend parameters if compound (average BPM, mix scales).
3. Emit a parameter object: `{ key, scale, bpm, swing, texture, instrumentation }`.
4. Pass to beat-theory → beat-compose.

## Output
- Parameter object + human explanation.

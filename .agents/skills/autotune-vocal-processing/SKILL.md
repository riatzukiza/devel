---
name: autotune-vocal-processing
description: Handle automated and manual pitch correction, vocal tuning, and "autotune" effect application for vocal recordings and synthetic vocals.
---

# Skill: Autotune Vocal Processing

## Goal
Provide a structured workflow for applying pitch correction and "autotune" aesthetic effects to vocal tracks.

## Use This Skill When
- The user wants "autotune" on a vocal recording.
- You need to plan a pitch-correction chain (e.g., Melodyne -> Autotune -> Compression).
- You are working with synthetic vocals (OpenUtau/UTAU) and need to refine the "human-ness" or "robot-ness" of the tuning.
- You are designing a vocal chain for a specific genre (e.g., Trap, Hyperpop) where hard-tuning is a stylistic choice.

## Do Not Use This Skill When
- You are doing general music composition without a vocal component.
- The request is for non-vocal pitch shifting (e.g., shifting a bass synth).

## Inputs
- Target vocal audio files (WAV/AIFF).
- Reference melody or target scale (Key/BPM).
- Desired "Tuning Strength" (Natural vs. Hard-Tuned/T-Pain effect).

## Steps
1. **Analysis**: Identify the key of the song and the specific scale of the vocal line.
2. **Corrective Tuning**: Use transparent pitch correction to fix off-pitch notes while preserving natural vibrato.
3. **Stylistic Tuning**: Apply "Hard Tune" (fast retune speed) to achieve the specific "autotune" aesthetic if requested.
4. **Vocal Chain Integration**: Place the tuner at the start of the signal chain, followed by saturation, compression, and EQ.
5. **Verification**: Listen for "artifacts" or "warbling" and adjust the retune speed or scale offsets.

## Output
- A detailed vocal processing plan or a rendered audio file (if tools allow).
- A breakdown of the tuner settings (Scale, Retune Speed, Humanize).

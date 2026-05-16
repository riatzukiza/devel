---
name: audio-effects-chain
description: Design an audio effects chain (EQ, compression, reverb, delay, distortion, chorus) for a rendered audio file using FFmpeg filters.
---

# Skill: audio-effects-chain

## Goal
Apply a chain of audio effects to a WAV/Ogg file using FFmpeg's `-af` filter graph.

## Use This Skill When
- A rendered beat needs post-processing before Discord playback.
- Asked to make it "punchier", "wider", "lo-fi", "warmer".
- Building a mastering step into the pipeline.

## Do Not Use This Skill When
- Real-time DSP on a live audio stream is needed (FFmpeg is file-based).

## Common FFmpeg Filter Recipes
```
# Lo-fi
aresample=8000,aresample=44100,equalizer=f=3000:t=h:width=200:g=-10

# Punch + compression
compand=attacks=0.01:decays=0.1:points=-80/-80|-12/-12|-6/-6|0/-3:soft-knee=6

# Reverb (via aecho)
aecho=0.8:0.7:40:0.4

# Wide stereo
aexciter=frequency=10000:amount=2,extrastereo=m=2.0

# Vinyl noise layer
amix=inputs=2:duration=shortest  # mix with a noise sample
```

## Steps
1. Identify desired effect(s) from description.
2. Build FFmpeg `-af` filter string.
3. Call `fluent-ffmpeg(input).audioFilters(filterString).save(output)`.
4. Log the filter chain used for reproducibility.

## Output
- Processed audio file at `<outDir>/<name>-fx.ogg`.
- Filter chain string (reproducible).

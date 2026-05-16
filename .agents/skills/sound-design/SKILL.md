---
name: sound-design
description: Translate a textual sound description into synthesizer parameter sets (oscillator, filter, envelope, effects) for Web Audio or external synths.
---

# Skill: sound-design

## Goal
Map a human sound description to a concrete parameter object that can drive a soft synth, sampler, or Web Audio node graph.

## Use This Skill When
- Asked to "make it sound like X" where X is a texture, animal, object, or vibe.
- Designing a custom instrument patch for a beat.
- Generating synth presets for batch export.

## Do Not Use This Skill When
- A sampled soundfont instrument is sufficient (use beat-compose with soundfont-player).
- The task is purely about MIDI note data.

## Inputs
- Sound description string (e.g. "wet lo-fi sub bass", "glitchy arp shimmer").
- Target engine: `webaudio | tonejs | description-only`.

## Output Shape
```js
{
  osc: { type: 'sawtooth' | 'sine' | 'square' | 'triangle', detune: 0 },
  filter: { type: 'lowpass', frequency: 800, Q: 2 },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.4 },
  effects: [{ type: 'reverb', wet: 0.4 }, { type: 'delay', time: '8n', feedback: 0.3 }],
  gain: 0.8
}
```

## Steps
1. Parse descriptors: warmth, brightness, attack, space, pitch range, movement.
2. Map descriptors to parameter ranges (reference table below).
3. Emit the parameter object + a 1-sentence explanation of each choice.
4. If `tonejs`: emit a Tone.js constructor snippet.

## Descriptor→Param Quick Reference
- warm/dark → low filter cutoff (200–800Hz), sine/triangle osc
- bright/sharp → high cutoff (4k–8kHz), sawtooth/square
- punchy → short attack (0–0.01s), medium decay
- pad/wash → long attack (0.3–1s), high reverb wet
- lo-fi → bitcrusher, low sample rate, vinyl noise layer
- glitchy → random gate, stutter effect, short delay

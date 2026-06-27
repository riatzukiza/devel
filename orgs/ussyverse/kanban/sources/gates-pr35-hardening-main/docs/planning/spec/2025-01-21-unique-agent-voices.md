# Unique Agent Voices Implementation

## Overview
Each colonist now has their own unique voice with distinct audio characteristics.

## Backend Changes

### backend/src/fantasia/sim/tick/initial.clj
- Added `generate-voice` function that creates unique voice characteristics:
  - **NOTE**: Function must be defined BEFORE `->agent` function that uses it (ordering matters in Clojure)
  - `:waveform` - Oscillator type (sine, triangle, square, or sawtooth)
  - `:pitch-offset` - Pitch shift from -12 to +12 semitones (one octave)
  - `:vibrato-depth` - Amount of pitch modulation (0.0 to 0.3)
  - `:attack-time` - How quickly sound reaches full volume (0.0 to 0.05s)
- Voice generation is deterministic based on agent ID
- Updated `->agent` function to include `:voice` field

### backend/src/fantasia/sim/reproduction.clj
- Child agents now receive unique voices based on their ID
- Added `:voice` field to `create-child-agent` function

### backend/src/fantasia/sim/tick/core.clj
- Wildlife agents (wolf, deer, bear) also receive unique voices
- Updated `spawn-wolf!`, `spawn-deer!`, and `spawn-bear!` functions

## Frontend Changes

### web/src/audio.ts
- Added `VoiceParams` type with optional voice characteristics
- Implemented `playToneWithVoice` function:
  - Applies pitch offset to frequency using semitone formula: `freq * 2^(offset/12)`
  - Adds LFO-based vibrato when depth > 0
  - Supports custom attack time for smooth/d sharp sounds
- Implemented `playToneSequenceWithVoice` function:
  - Extends tone sequence playback with voice support
  - Applies same voice parameters to each note in sequence

### web/src/App.tsx
- Updated imports to include `playToneSequenceWithVoice`
- Modified `handleSocialSound` to accept agent parameter
- Extracts voice data from agent and maps kebab-case to camelCase:
  - `:waveform` → waveform
  - `:pitch-offset` → pitchOffset
  - `:vibrato-depth` → vibratoDepth
  - `:attack-time` → attackTime
- Both agents in social interaction play sounds with their unique voices
- Updated social interaction handler to find agents in snapshot and pass to sound function

## Voice Characteristics

### Waveform Types
- **Sine**: Smooth, pure tones (default)
- **Triangle**: Brighter, slightly richer sound
- **Square**: More aggressive, 8-bit style
- **Sawtooth**: Brightest, buzzy sound

### Pitch Offset
- Range: -12 to +12 semitones (±1 octave)
- Makes some agents sound deeper, others higher pitched
- Deterministic per agent ID

### Vibrato Depth
- Range: 0.0 to 0.3
- Adds subtle pitch modulation
- Creates more natural, expressive sounds
- Determined by agent ID

### Attack Time
- Range: 0.0 to 0.05 seconds
- Controls how quickly sound reaches full volume
- Creates variety from sharp to soft sounds

## Examples

Each agent might have a voice like:
- Agent 1: `{pitch-offset: 5.5, vibrato-depth: 0.15, waveform: "sine", attack-time: 0.02}`
- Agent 2: `{pitch-offset: -3.2, vibrato-depth: 0.08, waveform: "triangle", attack-time: 0.01}`
- Agent 3: `{pitch-offset: 0.0, vibrato-depth: 0.25, waveform: "sawtooth", attack-time: 0.04}`

This creates a rich tapestry of sounds during social interactions, where you can distinguish individual agents by their voice characteristics.

## Technical Details

### Deterministic Generation
Voice characteristics are generated using the agent's ID as a random seed, ensuring:
- Same agent always has the same voice
- Different agents have different voices
- Reproducible across sessions

### Performance
- Voice generation is O(1) - just uses random number generator
- Audio synthesis is handled efficiently by Web Audio API
- LFO for vibrato is lightweight and only created when needed

### Integration
- Voice data is included in agent snapshots
- No additional WebSocket messages required
- Backward compatible - agents without voice use default sine wave

## Testing

- Frontend builds successfully
- Backend compiles successfully
- Voice generation function works correctly
- All agent creation paths updated with voices
- Audio functions support voice parameters
- Agents receive unique, deterministic voices based on their ID

## Bug Fixes

### Issue: Compilation Error - generate-voice Not Found
- Fixed compilation error where `generate-voice` function was defined after `->agent` used it
- Moved `generate-voice` definition to line 58 (before `->agent` at line 70)
- Removed duplicate definition

### Issue: Game Frozen at Startup
- Root cause: `->wildlife-agent` function was defined as private (`defn-`) but called by `spawn-wildlife`
- Changed `defn- ->wildlife-agent` to `defn ->wildlife-agent` (removed dash to make public)
- Wildlife agents now properly receive voice characteristics
- All agents (colonists, children, wildlife) now have voices

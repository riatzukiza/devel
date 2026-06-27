# Hunting Improvements Spec

## Problem
Agents (wolves) are starving because hunting is not effective enough. Hunting should also have a noticeable sound in the game's musical audio.

## Current State

### Hunting Behavior (backend/src/fantasia/sim/tick/combat.clj)
- Wolf sight range: 6 tiles (deer-sight-range)
- Wolf attack range: 1 tile (attack-range)
- Wolf damage per attack: 0.16 (role-damage)
- Wolf kills deer: drops 1 raw-meat at death location
- Wolf food gain on kill: food set to 1.0

### Job Assignment (backend/src/fantasia/sim/jobs.clj:66-74)
- Wolf creates hunt job when:
  - Food < food-hungry (default 0.3)
  - No food target available
  - Deer within range
  - No existing hunt job

### Food Decay (backend/src/fantasia/sim/agents.clj:36-38)
- Wolf food decay: 0.0006 per tick (const/wolf-food-decay)
- Deer food decay: 0.003 per tick (const/deer-food-decay)

### Audio System (web/src/audio.ts)
- Pentatonic scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25] Hz
- Functions: playTone, playToneSequence, playDeathTone, playBookCreatedTone
- Configurable: MASTER_GAIN, GAIN_RAMP_TIME, MIN_FREQUENCY, MAX_FREQUENCY

## Implementation Plan

### Phase 1: Backend Hunting Improvements

#### 1.1 Improve Wolf Hunting Parameters
- **File**: backend/src/fantasia/sim/constants.clj:29
- **Changes**:
  - Increase wolf-hunt-range from 8 to 12 (wolves should spot deer farther)
  - Keep deer-sight-range at 6 (deer should have shorter awareness)
  - Combat.clj uses deer-sight-range for wolf targeting, so update wolf-sight-range

#### 1.2 Add Wolf Food Restoration on Attack
- **File**: backend/src/fantasia/sim/tick/combat.clj:65-73
- **Changes**: 
  - Add small food gain on successful attacks (0.05)
  - Keep full food gain (1.0) on kills
  - This rewards wolves for engaging prey

#### 1.3 Add Hunt Event Messages
- **File**: backend/src/fantasia/sim/tick/combat.clj:86-100
- **File**: backend/src/fantasia/sim/tick/core.clj (tick-once)
- **Events to add**:
  - `:hunt-start` - When wolf selects a deer target
  - `:hunt-attack` - When wolf attacks deer
  - `:hunt-kill` - When wolf kills deer

### Phase 2: Frontend Audio

#### 2.1 Create Hunting Sound
- **File**: web/src/audio.ts
- **Function**: `playHuntTone()` or `playHuntToneSequence()`
- **Design**:
  - Use aggressive waveform: "sawtooth" or "triangle"
  - Pitch curve: high to low (descending) to simulate predator sound
  - Example: Start at 330Hz (E4), descend to 220Hz (A3) over 0.3s
  - Or sequence: [392.00, 329.63, 261.63] (G -> E -> C descending)

#### 2.2 Handle Hunt Events in App.tsx
- **File**: web/src/App.tsx
- **Location**: WebSocket message handler around line 393-500
- **Add handlers for**:
  - "hunt_start" - Play brief aggressive tone
  - "hunt_attack" - Play sharp attack sound
  - "hunt_kill" - Play triumphant descending sequence

## Definition of Done

1. Wolves have increased hunting range (12 tiles)
2. Wolves gain small food from attacks (0.05) and full food from kills (1.0)
3. Hunt events are sent via WebSocket on start, attack, and kill
4. Frontend plays distinctive hunting sounds on hunt events
5. Sounds are noticeable but not overwhelming (gain ~1.0-1.2)
6. All existing tests pass
7. Manual verification: observe wolves hunting deer with audible feedback

## Test Plan

1. Start a simulation with wolves and deer
2. Wait for wolves to get hungry (food < 0.3)
3. Observe:
   - Wolves hunt deer from increased range
   - Hunt sounds play on target selection, attacks, and kills
   - Wolf food increases on attacks and kills
4. Verify wolves survive longer (less starvation)

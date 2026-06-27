# Line of Sight and Delta Updates - Implementation Summary

## Changes Made

### Backend

#### 1. Vision Constants (backend/src/fantasia/sim/constants.clj:37-40)
Added vision radii for different agent types:
- `player-vision-radius: 15`
- `wolf-vision-radius: 10`
- `bear-vision-radius: 8`
- `deer-vision-radius: 6`

#### 2. Line of Sight Namespace (backend/src/fantasia/sim/los.clj)
New namespace for LOS calculation:
- `get-vision-radius` - Returns vision radius based on agent role
- `positions-in-vision` - Returns all hex positions within vision radius
- `agent-can-see?` - True if target is within vision range
- `filter-visible-agents` - Returns agents visible to viewer
- `visible-agent-ids` - Returns IDs of visible agents
- `visible-tiles`, `visible-items`, `visible-stockpiles` - Filter visible entities
- `compute-visibility` - Full visibility map for a viewer position

#### 3. Delta Tracking Namespace (backend/src/fantasia/sim/delta.clj)
New namespace for delta calculation and application:
- `deep-equal?` - Deep equality check
- `map-delta` - Returns delta between two maps (changed keys only)
- `agent-delta` - Returns delta for an agent
- `world-delta` - Computes full delta between old and new world states
- `apply-delta-to-agent` - Applies delta to single agent, handles removal
- `apply-agent-deltas` - Applies all agent deltas to agent list
- `merge-world-delta` - Applies delta to world state

#### 4. World Namespace Updates (backend/src/fantasia/sim/world.clj)
- Added imports for los, delta, constants
- Added `delta-snapshot` function that:
  - Computes delta between old and new world
  - Calculates visibility for each player agent position
  - Returns map with `:delta true`, changed entities, and per-visibility data

#### 5. Tick Core Updates (backend/src/fantasia/sim/tick/core.clj)
- Added `*previous-state` atom to track previous world state
- Added `get-previous-state`, `update-state!` functions
- Modified `tick-once` to:
  - Return `:delta-snapshot` in addition to regular snapshot
- Modified `tick!` to:
  - Call `update-state!` to track previous state

#### 6. Server Updates (backend/src/fantasia/server.clj)
- Modified runner loop to send delta snapshot instead of full snapshot when available
- Message: `{:op "tick_delta" :data delta-snapshot}` or falls back to `{:op "tick"}`

### Frontend

#### 1. Utils Updates (web/src/utils.ts)
- Added `DeltaSnapshot` type definition
- Added `applyAgentDeltas` - Applies agent deltas to agent array
- Added `applyDelta` - Applies delta snapshot to full state

#### 2. App.tsx Updates
- Added import for `applyDelta`
- Added WebSocket handler for `tick_delta` op
- Added `handleDeltaAudio` for delta-based audio (hunt sounds)
- Delta handler applies changes to state via `applyDelta`

## Data Flow

1. **Tick starts** in `tick!`
2. `update-state!` saves current world as `*previous-state`
3. `tick-once` generates new world state
4. `world/delta-snapshot` computes:
   - Delta between old and new world (changed agents, tiles, items, etc.)
   - Visibility maps for player agents
5. Server broadcasts `tick_delta` message with delta data
6. Frontend `handleDelta`:
   - Calls `applyDelta(prev, delta)` to merge changes
   - Calls `handleDeltaAudio(delta)` for hunt sounds
7. `applyDelta` updates:
   - Global fields (tick, temperature, daylight, calendar, etc.)
   - Agent list (updates changed agents, adds new ones, removes deleted ones)
   - Tiles, items, stockpiles
   - Jobs, traces, mentions, combat events, books

## Benefits

1. **Reduced data transfer**: Only changed entities sent over WebSocket
2. **Faster updates**: Smaller payloads, faster parsing
3. **LOS filtering**: Agents only see what's within vision range
4. **Efficient state management**: Delta-based updates minimize re-renders

## Testing

Run backend:
```bash
cd backend
clojure -M:test
```

Build frontend:
```bash
cd web
npm run build
```

Both should compile and existing tests should pass.

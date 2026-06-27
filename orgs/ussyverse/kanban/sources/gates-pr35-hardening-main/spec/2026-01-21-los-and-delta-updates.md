# Line of Sight and Delta Updates Spec

---
Type: spec
Component: backend
Priority: high
Status: proposed
Milestone: 4
Estimated-Effort: 40 hours
---

## Problem
The backend sends the entire world snapshot on every tick, which is inefficient. Only agents within line of sight should receive updates, and only changed data should be transmitted.

## Current State

### Snapshot Structure (backend/src/fantasia/sim/world.clj:5-70)
- `snapshot` function returns entire world state
- Includes: tick, shrine, temperature, tiles, items, stockpiles, agents (all agents with full data), ledger, jobs, etc.
- Sent via WebSocket as full snapshot on every tick

### WebSocket Flow (backend/src/fantasia/server.clj:102-111)
- Tick: `{op "tick" :data (select-keys o [:tick :snapshot :attribution])}`
- Full snapshot sent every tick regardless of changes
- No delta tracking or LOS filtering

## Implementation Plan

### Phase 1: Line of Sight System

#### 1.1 Define Vision Constants
- **File**: backend/src/fantasia/sim/constants.clj
- **Add**: Vision radius for each agent type
  - `player-vision-radius: 15`
  - `wolf-vision-radius: 10`
  - `bear-vision-radius: 8`
  - `deer-vision-radius: 6`

#### 1.2 Implement Vision Functions
- **File**: backend/src/fantasia/sim/los.clj (new namespace)
- **Functions**:
  - `get-vision-radius [agent]` - Returns vision radius based on agent role
  - `positions-in-vision [pos radius]` - Returns all hex positions within vision radius
  - `agent-can-see? [viewer-pos target-pos radius]` - True if target is within vision
  - `filter-visible-agents [world viewer-pos radius]` - Returns only agents visible to viewer
  - `filter-visible-entities [world viewer-pos radius]` - Returns visible tiles, items, stockpiles

### Phase 2: Change Tracking

#### 2.1 Track Previous State
- **File**: backend/src/fantasia/sim/tick/core.clj
- **Add**: `previous-world` atom to track state between ticks
- **Add**: `track-changes` function to compare states

#### 2.2 Delta Calculation
- **File**: backend/src/fantasia/sim/delta.clj (new namespace)
- **Functions**:
  - `agent-delta [old-agent new-agent]` - Returns changes for an agent
  - `world-delta [old-world new-world]` - Returns full delta map
  - `merge-delta [current-state delta]` - Applies delta to state

### Phase 3: Delta Snapshot with LOS

#### 3.1 Create Delta Snapshot Function
- **File**: backend/src/fantasia/sim/world.clj
- **Add**: `delta-snapshot` function
- **Returns**: Map with:
  - `:delta true` (marker for frontend)
  - `:changed-agents` - list of changed agent IDs with delta data
  - `:changed-tiles` - map of changed tile keys to new values
  - `:changed-items` - map of changed item positions
  - `:changed-stockpiles` - map of changed stockpiles
  - `:global-updates` - tick, temperature, etc. (always sent)
  - `:visible-entities` - for each agent type, what they can see

#### 3.2 Update Tick Loop
- **File**: backend/src/fantasia/sim/tick/core.clj
- **Modify**: `tick-once` to return delta snapshot instead of full snapshot
- **Add**: Per-agent LOS filtering in delta calculation

### Phase 4: WebSocket Updates

#### 4.1 Update Server Broadcast
- **File**: backend/src/fantasia/server.clj
- **Modify**: Send delta instead of full snapshot
- **Message**: `{op "tick_delta" :data delta-snapshot}`

### Phase 5: Frontend Delta Handling

#### 5.1 Update WebSocket Handler
- **File**: web/src/App.tsx
- **Add**: `handleDelta` function to apply deltas to state
- **Modify**: Tick message handler to use `handleDelta`

#### 5.2 Delta Application
- **File**: web/src/utils.ts (or App.tsx)
- **Function**: `applyDelta(state, delta)`
- **Logic**:
  - Merge changed agents into agent list
  - Update changed tiles
  - Update global fields (tick, temperature, etc.)
  - Remove deleted agents (if any)

## Definition of Done

1. Vision radius defined for all agent types in constants
2. LOS namespace with vision calculation functions
3. Delta namespace with change tracking
4. Tick loop generates delta snapshots
5. WebSocket sends delta updates
6. Frontend applies deltas to state
7. Only visible entities sent to each agent type
8. No redundant data in snapshots
9. Existing tests pass
10. Performance improved (less data transferred per tick)

## Data Structures

### Delta Snapshot
```clojure
{:delta true
 :tick 1234
 :global {:tick 1234
          :temperature 0.7
          :daylight 0.8
          :calendar {...}}
 :changed-agents {5 {:id 5 :pos [10 12] :needs {:food 0.5}}
                 7 {:id 7 :needs {:health 0.0} :status {:alive? false}}
                 12 {:id 12 :removed true}}
 :changed-tiles {"10,12" {:structure :campfire}
               "8,15" {:resource :tree :level 2}}
 :changed-items {"10,12" {:fruit 3}}
 :changed-stockpiles {[10 12] {:resource :fruit :current-qty 50}}
 :visibility {:player {:agent-ids [5 7 12 15 20]
                    :tile-keys {...}
                    :item-keys {...}}
               :wolf {:agent-ids [...] ...}}}
```

## Test Plan

1. Verify LOS calculations match expected radii
2. Verify delta includes only changed entities
3. Verify delta merges correctly into state
4. Verify performance (measure payload size)
5. Test with multiple agent types
6. Verify edge cases (agent death, creation, removal)

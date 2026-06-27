# Fog of War Implementation

## Overview
Implement a three-state fog of war system where tiles can be:
- **Hidden**: Never observed by any agent (black misty fog)
- **Revealed**: Previously observed but not currently visible (gray, static snapshot)
- **Visible**: Currently being observed by a player agent (full color, current state)

## Requirements
- Players can only see what their agents have revealed of the map
- Hidden tiles should be rendered as black misty fog
- Revealed tiles should be gray and show a static snapshot of last observation
- Visible tiles should show the current state exactly as it is
- Visibility should update dynamically as agents move

## Design

### Backend Changes

#### fantasia/sim/los.clj
- Add `update-tile-visibility!` function to compute new visibility state
- Track visibility transitions:
  - Hidden → Visible (save tile snapshot)
  - Visible → Revealed (tile was visible, now not)
  - Revealed → Visible (update snapshot with current state)
- Return updated visibility map and revealed-tiles-snapshot

#### fantasia/sim/world.clj
- Add `:tile-visibility` to world state - maps tile keys to `:hidden | :revealed | :visible`
- Add `:revealed-tiles-snapshot` to world state - maps tile keys to tile data snapshots
- Update `delta-snapshot` to include visibility state in delta
- Add `:tile-visibility` and `:revealed-tiles-snapshot` to changed fields

#### fantasia/sim/delta.clj
- Add tile-visibility and revealed-tiles-snapshot to delta computation
- Handle these fields in merge-world-delta

#### fantasia/sim/tick/core.clj
- Integrate visibility update into tick cycle
- Update tile visibility after agent movement but before snapshot generation

### Frontend Changes

#### App.tsx
- Add state for tile-visibility and revealed-tiles-snapshot
- Update these from delta messages
- Pass visibility state to SimulationCanvas

#### SimulationCanvas.tsx
- Modify rendering to handle three visibility states:
  - Hidden: Fill with black/misty fog (rgba(0, 0, 0, 0.85) with noise pattern)
  - Revealed: Apply grayscale filter (grayscale(100%) with reduced opacity 0.4)
  - Visible: Normal rendering (current behavior)
- Only render agents/items/stockpiles when tile is visible
- For revealed tiles, render structures/resources from snapshot
- Add helper function `getTileVisibility(tileKey)`

## Implementation Plan

### Phase 1: Backend Data Structure
1. Add visibility fields to initial world state
2. Implement visibility update logic in los.clj
3. Update delta-snapshot to include visibility

### Phase 2: Backend Integration
1. Integrate visibility updates into tick cycle
2. Test visibility computation

### Phase 3: Frontend State Management
1. Update App.tsx to handle visibility state
2. Process delta messages with visibility data

### Phase 4: Frontend Rendering
1. Modify SimulationCanvas rendering for three states
2. Add visual effects for fog
3. Test complete system

## Data Structures

### tile-visibility
```clojure
{"0,0" :visible
 "0,1" :revealed
 "1,0" :hidden
 ...}
```

### revealed-tiles-snapshot
```clojure
{"0,1" {:biome :forest :structure :house :resource nil ...}
 ...}
```

## Definition of Done
- [x] All three visibility states render correctly
- [x] Hidden tiles show black misty fog
- [x] Revealed tiles show gray static snapshot
- [x] Visible tiles show current state
- [x] Visibility updates when agents move
- [ ] Test passes with fog of war enabled
- [ ] All existing tests still pass

## Implementation Log

### Completed Changes:
- Backend: Added `:tile-visibility` and `:revealed-tiles-snapshot` to world state
- Backend: Implemented `update-tile-visibility!` in los.clj to compute visibility states
- Backend: Updated delta-snapshot to include visibility changes
- Backend: Integrated visibility updates into tick cycle
- Frontend: Added state management for tile visibility and revealed snapshots
- Frontend: Modified SimulationCanvas rendering to handle three visibility states

### Visual Effects:
- Hidden tiles: `rgba(0, 0, 0, 0.85)` (black fog)
- Revealed tiles: Grayscale filter with 40% opacity
- Visible tiles: Full color rendering


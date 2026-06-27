---
type: bug
component: frontend, backend
priority: critical
status: proposed
related-issues: []
estimated-effort: 2 hours

# Tile Visibility Rendering Bug

## Problem
All tiles on the frontend render as "hidden" despite the backend having player agents with vision. Tiles report their biome correctly, but visibility system is not working.

## Root Cause Analysis

### Backend Issue
- Backend uses ECS system which initializes `:tile-visibility {}` as empty map in `ecs/tick.clj:70`
- LOS computation in `los.clj:update-tile-visibility!` generates visibility data but it's not being merged into global state properly
- Current simulation state shows `agent-visibility` but no `tile-visibility` key
- The `/sim/state` endpoint returns raw state without visibility processing

### Frontend Issue  
- Frontend expects `tileVisibility` prop in SimulationCanvas component
- WebSocket handler expects `tile_visibility` from `tick_delta` messages
- `getTileVisibilityState` in `SimulationCanvas.tsx:75-85` defaults to "hidden" when no visibility data exists

### Data Flow Mismatch
1. `los/all-player-visible-tiles` looks for agents with `:faction :player` ✓
2. `los/update-tile-visibility!` computes visibility correctly ✓  
3. Visibility data should be merged into global state via `tick/core.clj:136-137` ✓
4. But ECS system in `ecs/tick.clj:70` initializes empty `:tile-visibility` ↳
5. Frontend receives empty/no visibility data ↳
6. All tiles render as "hidden" ↳

## Solution

### Option 1: Fix ECS Integration (Preferred)
- Ensure `los/update-tile-visibility!` results are properly merged into global state in ECS tick
- Update `ecs/adapter.clj:ecs->snapshot` to include visibility data in snapshots  
- Ensure WebSocket `tick_delta` messages include `tile_visibility`

### Option 2: Initialize Visibility Properly
- Generate initial visibility on world creation instead of waiting for ticks
- Ensure player agents have faction set correctly from start

## Implementation Plan

1. **Fix ECS tick integration** - Ensure visibility updates are applied to global state
2. **Update adapter snapshot** - Include visibility data in WebSocket snapshots  
3. **Verify data flow** - Ensure frontend receives visibility data correctly
4. **Test rendering** - Confirm biomes are visible and hidden/revealed states work

## Files to Modify
- `backend/src/fantasia/sim/tick/core.clj` - Fix visibility integration
- `backend/src/fantasia/sim/ecs/adapter.clj` - Update snapshot generation
- `backend/src/fantasia/server.clj` - Ensure WebSocket messages include visibility
- Test with frontend to confirm fix

## Testing
1. Check that `/sim/state` includes `tile-visibility` after first tick
2. Verify WebSocket `hello` message includes visibility data
3. Confirm frontend renders biomes correctly
4. Test visibility filtering with control panel
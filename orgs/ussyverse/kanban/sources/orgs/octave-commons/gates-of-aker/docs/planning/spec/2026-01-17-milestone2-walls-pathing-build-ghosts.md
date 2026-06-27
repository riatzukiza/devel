# Milestone 2 — Walls, Pathing, and Build Ghosts

---
Type: spec
Component: backend
Priority: high
Status: implemented
Related-Issues: [3]
Milestone: 2
Estimated-Effort: 24 hours
---

## Related Documentation
- [[docs/notes/planning/2026-01-15-roadmap.md]] - Sprint and milestone roadmap
- [[docs/notes/planning/2025-01-15-mvp.md]] - MVP definition
- [[spec/2026-01-15-core-loop.md]] - Day/night cycle mechanics
- [[docs/notes/design/2026-01-15-world-schema.md]] - World schema
- [[docs/notes/design/2026-01-15-sim-modules.md]] - Simulation modules
- [[docs/tasks/006-sim-spatial.md]] - Spatial systems
- [[spec/2026-01-17-milestone3-colony-core.md]] - Next milestone

## Context
- Issue: gh#3 (Milestone 2 — Walls, Pathing, and Build Ghosts)
- Roadmap: docs/notes/planning/2026-01-15-roadmap.md (Sprint 2)
- Depends on: Milestone 1 (Hex Map Backbone) ✅ Complete

## Problem Statement
The simulation currently has no obstacles: agents can walk anywhere within bounds. To enable RimWorld-like base building, we need:
1. Walls that block movement
2. A build system (ghost → wall)
3. Pathfinding around obstacles

## Proposed Addition

### Phase 1: Backend - Tile Passability and Wall Ghosts

#### 1.1 Tile Schema Extension

Update `docs/notes/world-schema.md` and tile structure:

```clojure
:structure nil                    ; No structure
:structure :wall-ghost            ; Planned wall, passable
:structure :wall                  ; Built wall, impassable
```

#### 1.2 Passability Check

Add to `fantasia.sim.spatial`:
- `(passable? world pos)` - Returns false if tile has `:structure :wall`
- Consider adding `:passable` boolean to tiles for future extensibility (water, mountains)

#### 1.3 Agent Movement Update

Modify `fantasia.sim.spatial/move-agent`:
- Filter neighbors by `(passable? world %)`
- If no passable neighbors exist, agent stays in place

#### 1.4 Wall Ghost Placement

Add to `fantasia.sim.tick`:
- `(place-wall-ghost! [pos])` - Places `:wall-ghost` at `[q r]`
- Validate: pos must be in-bounds, no existing structure
- Use tile key format `"q,r"` for sparse map storage

Files: `backend/src/fantasia/sim/tick.clj`, `backend/src/fantasia/sim/spatial.clj`

### Phase 2: Backend - Job System and Wall Building

#### 2.1 Job System Namespace

Create `fantasia.sim.jobs`:
- Job schema: `{:id :job/build-wall :target [q r] :worker-id agent-id :progress 0.0 :required 1.0}`
- `(assign-job! world agent-id job)` - Assign job to agent
- `(advance-job! world agent-id delta)` - Increment job progress
- `(complete-job! world agent-id)` - Finalize job (ghost → wall conversion)

#### 2.2 Wood Item System

Add to world state:
- `:items {pos {:resource :wood :qty 10}}`
- Helper: `(add-item! world pos resource qty)`
- Helper: `(consume-items! world pos resource qty)`

#### 2.3 Wall Build Job Logic

Job `:job/build-wall`:
- Requires wood at wall ghost position
- Progress increments when worker is adjacent
- At completion: consume wood, convert `:wall-ghost` → `:wall`

#### 2.4 Job Assignment Integration

Simplified agent behavior for now:
- If agent has `:current-job`, advance it when possible
- Otherwise wander (existing behavior)
- Job assignment: manual for now, automatic in Milestone 3

Files: `backend/src/fantasia/sim/jobs.clj`, `backend/src/fantasia/sim/tick.clj`

### Phase 3: Backend - BFS Pathing

#### 3.1 Pathfinding Namespace

Create `fantasia.sim.pathing`:
- `(bfs-path world start goal)` - Returns sequence of positions from start to goal
- Returns `nil` if no path exists
- Uses `(passable? world pos)` for neighbor filtering
- Consider adding cache for performance if needed

#### 3.2 Pathing for Job Workers

Update job system:
- Workers with jobs use BFS to navigate to job target
- Move agent one step along path each tick

#### 3.3 Optional: A* Enhancement

If BFS proves slow for larger maps:
- Add `(a*-path world start goal)` with heuristic (hex distance)
- Heuristic: `(hex/distance current goal)`

Files: `backend/src/fantasia/sim/pathing.clj`, `backend/src/fantasia/sim/jobs.clj`

### Phase 4: Frontend - Build Tool and Wall Rendering

#### 4.1 Build Tool UI

Add to `web/src/components/`:
- New component: `BuildControls.tsx`
- Mode toggle: "Select" vs "Build Wall"
- When in build mode, click places wall ghost via WS

#### 4.2 Wall Rendering Updates

Update `web/src/components/SimulationCanvas.tsx`:
- Render `:wall-ghost` as dashed outline (yellow/orange)
- Render `:wall` as solid fill (gray/brown)
- Update tile lookup to check `:structure` field

#### 4.3 WebSocket Operations

Add to `web/src/ws.ts`:
- `sendPlaceWallGhost(pos: [number, number])` - Send `{op: "place_wall_ghost", pos}`

#### 4.4 Backend WS Handler

Add to backend server (need to check existing WS handler location):
- Handle `"place_wall_ghost"` op
- Call `tick/place-wall-ghost!` and broadcast updated snapshot

Files: `web/src/components/BuildControls.tsx`, `web/src/components/SimulationCanvas.tsx`, `web/src/ws.ts`, backend WS handler

### Phase 5: Integration - Smoke Test

#### 5.1 Test Scenario

1. Reset world
2. Place 5-6 wall ghosts in a small enclosure (U-shape or box)
3. Spawn a worker agent inside enclosure
4. Place wood items near wall ghosts
5. Run several ticks

#### 5.2 Expected Behavior

- Wall ghosts appear as dashed outlines
- Agent stays inside enclosure (can't pass walls)
- When worker assigned to build-wall job:
  - Worker moves to adjacent tile using BFS
  - Job progresses each tick
  - Ghost converts to solid wall
  - Agent routes around walls to reach next target

#### 5.3 Acceptance Criteria

- Players can place wall ghosts via UI
- Ghosts render distinctly from built walls
- Pawns route around completed walls (not through)
- Backend is authoritative over passability and wall state
- Build-wall job consumes wood and converts ghost → wall

## Implementation Order

1. **Phase 1**: Passability + wall ghosts (no WS yet, test via REPL)
2. **Phase 2**: Job system + wood items (basic implementation)
3. **Phase 3**: BFS pathing (connect jobs to movement)
4. **Phase 4**: Frontend build tool + rendering (WS integration)
5. **Phase 5**: Smoke test and debugging

## Existing Issues / PRs

- Issue #3: Milestone 2 — Walls, Pathing, and Build Ghosts (OPEN)
- No related PRs exist

## Definition of Done

- `:structure` field added to tiles (`:wall-ghost`, `:wall`)
- `passable?` function checks wall passability
- WS op `place_wall_ghost` works
- `:job/build-wall` converts ghost → wall consuming wood
- BFS pathing routes agents around walls
- Frontend has build tool and renders ghost/wall distinctly
- Smoke test: agent stays in enclosure, routes around walls

## Requirements

1. Preserve existing myth + ledger behavior
2. Keep payloads lean: only send non-ground tiles in snapshots
3. Passability is authoritative on backend (frontend cannot cheat)
4. Wood item system should be extensible for Milestone 3 (haul, stockpiles)
5. BFS pathing should handle "no path" gracefully (agent stays in place)

## Notes

- Job assignment can be manual for this milestone (Milestone 3 adds automatic job queue)
- Consider adding job visualization in UI (show worker moving to build site)
- Pathing cache might be needed if many agents calculate paths each tick
- Wall ghosts allow previewing before committing resources

## Implementation Notes (2026-01-17)

### Completed Files:
- `backend/src/fantasia/sim/jobs.clj` - Job system with create-job, assign-job!, advance-job!, complete-job!
- `backend/src/fantasia/sim/pathing.clj` - BFS and A* pathfinding with passable? checks
- `backend/src/fantasia/sim/tick.clj` - Added items/jobs to world state, integrated job processing
- `backend/src/fantasia/sim/world.clj` - Updated snapshot to include jobs/items
- `backend/src/fantasia/server.clj` - WS handler for place_wall_ghost already existed
- `web/src/components/BuildControls.tsx` - Build mode toggle component
- `web/src/components/SimulationCanvas.tsx` - Renders wall-ghost (dashed) and wall (solid)
- `web/src/ws.ts` - Added sendPlaceWallGhost method, added tiles op type
- `web/src/App.tsx` - Integrated BuildControls, handles tiles op, passes build mode to click handler

### Testing:
- Backend compiles: ✓
- Frontend builds: ✓
- WS op place_wall_ghost exists in server.clj:94-96
- Tiles op handler added in App.tsx:87-92

### Remaining:
- Smoke test requires running UI and manually testing placement/behavior
- Manual job assignment via REPL can test job logic

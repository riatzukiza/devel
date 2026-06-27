---
title: "[ECS Phase 6] LOD and Tile Loading"
labels: enhancement, ecs, phase-6, story-points:6
assignees: []
---

## Summary
Implement tile-based partitioning, loading/unloading, and LOD aggregation to support large worlds with 1000+ entities. This enables the day/night cycle vision model and efficient performance at scale.

## Background
The current simulation loads the entire world into memory at startup. This works for small prototypes but doesn't scale to:
- Large hex grids (128x128 = 16,384 tiles)
- Hundreds of agents across multiple regions
- Champion day/night mode with aligned LOS vision

The spec [[spec/2026-01-15-core-loop.md]] defines:
- **Loaded tiles**: Full physics, individual agents
- **Adjacent tiles**: Aggregated agents, state machines
- **Far tiles**: Minimal state (counts, averages)

ECS entities enable:
- Clear entity ownership for tiles
- Straightforward serialization for tile state
- Efficient entity migration between tiles

## Specification
See [[spec/ecs-migration-plan.md#phase-6-lod-and-tile-loading](spec/ecs-migration-plan.md#phase-6-lod-and-tile-loading) for full details.

### Tasks

#### 1. Design Tile Entity Partitioning
- [ ] Define tile boundaries as hex rings (radius 6-8 from champion)
- [ ] Implement entity-to-tile mapping
  - Map entity IDs to tile key `"q,r"` (tile position)
  - Store in world state under `:entity-tiles`
  - Update when Position components change
- [ ] Support entity migration between tiles
  - Detect when entity crosses tile boundary
  - Move entity ID from old tile set to new tile set
  - Preserve entity components across migration
- [ ] Design serialization format for off-tile entities
  - Entity ID + all component data
  - Minimal state for aggregated entities (counts, averages)
  - Include deltas (changes since last save)

#### 2. Implement Tile Loading/Unloading
- [ ] Implement `load-tile!` function
  - Takes tile position and saved state
  - Creates entities from saved data
  - Preserves entity IDs from serialization
  - Restores all components to Brute system
- [ ] Implement `unload-tile!` function
  - Takes tile entity set
  - Serializes entity state to durable format
  - Removes entities from Brute system
  - Saves state to tile cache
  - Returns aggregate state for replacement
- [ ] Implement `apply-tile-deltas!` function
  - Takes tile and list of entity changes
  - Applies incremental updates without full reload
  - Handles entity additions, removals, component updates
- [ ] Create tile cache in world state
  - `:tile-cache` - Map of tile keys to saved state
  - LRU eviction for cache size limits
  - Persist to disk on game save

#### 3. Implement LOD Aggregation
- [ ] Create aggregate entities for off-tile populations
  - Population entity: `{:type :population :count 42 :tile-key "12,8"}`
  - Resource entity: `{:type :resource-aggregate :wood 500 :food 120}`
  - Agent counts by role: `{:peasants 30 :priests 2 :knights 10}`
- [ ] Implement LOD state transitions
  - Full detail → Aggregated on unload
  - Aggregated → Full detail on reload
  - Preserve myth ledger across transitions (global state)
- [ ] Implement `aggregate-tile-entities!` function
  - Takes tile entity set
  - Computes counts and averages per component type
  - Returns aggregate entity data
  - Preserves essential metrics (total population, resources)
- [ ] Implement `expand-tile-aggregate!` function
  - Takes aggregate entity + delta history
  - Generates representative entities for reload
  - Uses probabilistic distribution (not exact reconstruction)
  - Preserves aggregate totals on balance
- [ ] Add LOD metadata to world
  - `:lod-mode` - `:full` | `:aggregated` per tile
  - Track which tiles are loaded/unloaded

#### 4. Update Tick Loop for Tile Management
- [ ] Implement `get-tiles-for-position` function
  - Takes champion Position component
  - Returns 3x3 tile grid (loaded tile + 6 adjacent)
- [ ] Implement `tick-manage-tiles!` function
  - Called at start of each tick
  - Compares current loaded tiles vs champion position
  - Unloads tiles outside 3x3 area
  - Loads tiles within 3x3 area not yet loaded
  - Handles diagonal transitions smoothly
- [ ] Update `tick/tick-once` to include tile management
  - Run `tick-manage-tiles!` before system execution
  - Only run systems on loaded tile entities
  - Simulate aggregated tiles abstractly (simple counters, no agent logic)
- [ ] Add champion-based tile loading trigger
  - Load tiles on initial world creation
  - Update loaded tiles when champion Position changes
  - Handle champion death (load all tiles, no focal point)

#### 5. Implement LOD-Aware Systems
- [ ] Update MovementSystem to respect tile boundaries
  - Prevent movement into unloaded tiles
  - Handle tile load on movement attempt
  - Show "fog of war" for unloaded areas
- [ ] Update VisionSystem for LOD
  - Champion vision only in loaded tiles
  - Aligned LOS requires tile data
  - Aggregate tiles show reduced vision
- [ ] Update JobAssignmentSystem for LOD
  - Only assign jobs in loaded tiles
  - Queue jobs in aggregated tiles (pending assignment)
  - Handle job migration on tile load
- [ ] Update PacketBroadcast/Receive for LOD
  - Packets don't cross tile boundaries
  - Aggregate agents don't broadcast
  - Messages queue for next load
- [ ] Update EventGenerationSystem for LOD
  - Events only spawn in loaded tiles
  - Probability scaled by loaded tile count
  - Aggregate tiles: reduced event frequency

### Deliverables
- [ ] Tile partitioning system (entity-to-tile mapping)
- [ ] Tile loading/unloading functions
- [ ] LOD aggregation logic (aggregate ↔ full detail)
- [ ] Tile-aware tick loop
- [ ] LOD-aware system updates
- [ ] Tile cache and serialization
- [ ] Integration tests for tile transitions

### Definition of Done
- [ ] Can load/unload 3x3 tile area in < 100ms
- [ ] Aggregated state preserves key metrics (population, resources)
- [ ] Champion movement triggers seamless tile loads
- [ ] LOD transitions don't break myth ledger
- [ ] All systems respect tile boundaries
- [ ] Tick performance scales with loaded entity count (not total world)
- [ ] Save/load includes tile cache state
- [ ] Code follows AGENTS.md style guidelines

### Story Points
**6 SP** (4-5 days estimated)

- Complexity: High - Tile management, aggregation, state migration
- Risk: Medium - Changes core assumptions about world state
- Effort: High - ~25 functions across 5 major areas
- Testing: High - Tile load/unload cycles, LOD transitions

### Performance Targets
- Tile load: < 50ms (deserialize 100 entities avg)
- Tile unload: < 50ms (serialize + aggregate)
- Tick with 3x3 loaded tiles: < 100ms (systems only on loaded)
- Memory with 1000 entities (3x3 loaded): < 100MB total (including cache)
- Champion movement triggers tile load in same frame

### LOD State Machine
```
Full Detail (loaded)
  ↓ (champion leaves tile area)
Aggregating (computing aggregates)
  ↓ (complete)
Aggregated (replaced with aggregate entities)
  ↓ (champion enters tile area)
Expanding (generating entities from aggregate)
  ↓ (complete)
Full Detail (loaded)
```

### Migration Notes
- This phase requires Phase 4 (world state migration) to be complete
- Tile boundaries defined by champion Position component
- LOD transitions must preserve global state (ledger, institutions, levers)
- Aggregation loses individual agent detail but preserves totals
- Champion can always be loaded (never aggregated)

### Related Issues
- #1 - ECS Phase 1: Foundation (must complete first)
- #2 - ECS Phase 2: Component Extraction (must complete first)
- #3 - ECS Phase 3: System Implementation (must complete first)
- #4 - ECS Phase 4: World State Migration (must complete first)
- #5 - ECS Phase 5: Advanced Features (must complete first)

### References
- [[spec/ecs-migration-plan.md]]
- [[spec/2026-01-15-core-loop.md]] (LOD requirements)
- [[backend/src/fantasia/sim/ecs.clj]]
- [[backend/src/fantasia/sim/tick/core.clj]]
- [[AGENTS.md]]

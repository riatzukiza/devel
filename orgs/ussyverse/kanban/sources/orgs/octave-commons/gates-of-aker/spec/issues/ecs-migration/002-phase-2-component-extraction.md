---
title: "[ECS Phase 2] Extract Agent Data to Components"
labels: enhancement, ecs, phase-2, story-points:5
assignees: []
---

## Summary
Extract all agent fields from monolithic maps to ECS components using Brute's component system. This migrates Position, Needs, Role, Inventory, Frontier, Recall, and JobTarget data to individual components.

## Background
Currently agents are represented as maps with embedded fields:
- `:pos`, `:needs`, `:role`, `:frontier`, `:recall`, `:inventory`, `:current-job`

This creates tight coupling between different aspects of agent state and makes it difficult to query or modify specific concerns. ECS components separate these concerns into independent, reusable data structures.

## Specification
See [[spec/ecs-migration-plan.md#phase-2-component-extraction-agent-data](spec/ecs-migration-plan.md#phase-2-component-extraction-agent-data) for full details.

### Tasks

#### 1. Extract Position Component
- [ ] Replace agent `:pos` field with Position component in all agent creation
- [ ] Update `tick.initial/->agent` to add Position component
- [ ] Update all position references:
  - `agents.clj:22` - neighbor checks
  - `jobs.clj:38` - job targets
  - `spatial.clj:28` - tile lookups
  - `tick.movement` - pathfinding
- [ ] Add Position component to entities that need it (structures, resources)
- [ ] Update `spatial/in-bounds?`, `spatial/passable?` to query Position components
- [ ] Update `spatial/at-trees?`, `spatial/near-shrine?` for Position queries

#### 2. Extract Needs Component
- [ ] Replace agent `:needs` map with Needs component
- [ ] Update `agents/update-needs` to work with component access
- [ ] Preserve threshold data (move to separate component or nested field)
- [ ] Update all needs access: `agents.clj:11`, `jobs.clj:267`

#### 3. Extract Role Component
- [ ] Replace agent `:role` keyword with Role component
- [ ] Add `:title` field for display (e.g., "Villager")
- [ ] Add `:rank` field for prestige system
- [ ] Update speaker/role checks:
  - `agents.clj:25` - priest judgment
  - `agents.clj:62` - speaker bonus
  - `institutions.clj:24` - institution speaker
- [ ] Update `jobs.clj:77` - role-based job priorities

#### 4. Extract Inventory Component
- [ ] Replace agent `:inventory` map with Inventory component
- [ ] Update `jobs.clj` item handling:
  - `consume-items!` (line 55)
  - `add-item!` (line 49)
  - `pickup-items!` (line 234)
  - `drop-items!` (line 240)
  - `complete-haul!` (line 147)
  - `complete-deliver-food!` (line 170)
- [ ] Add Inventory to structures for storage

#### 5. Extract Frontier Component
- [ ] Replace agent `:frontier` map with Frontier component
- [ ] Update all Frontier access:
  - `agents.clj:27` - frontier bump
  - `agents.clj:32` - frontier decay
  - `agents/apply-packet-to-listener` (line 128) - frontier spread
  - `agents/recall-and-mentions` (line 77) - frontier query
  - `events.runtime/apply-to-witness` (line 56) - frontier update
  - `world/snapshot` (line 25) - frontier snapshot
- [ ] Preserve existing facet semantics (a, strength, valence fields)

#### 6. Extract Recall Component
- [ ] Replace agent `:recall` map with Recall component
- [ ] Update all Recall access:
  - `agents/recall-and-mentions` (line 79) - recall computation
  - `agents/apply-packet-to-listener` (line 139) - recall update
  - `events.runtime/apply-to-witness` (line 76) - recall update
  - `world/snapshot` (line 22) - recall snapshot
- [ ] Preserve existing recall semantics (event-type → score mapping)

#### 7. Extract JobTarget Component
- [ ] Replace agent `:current-job` reference with JobTarget component
- [ ] Update `jobs.clj` job assignment/progress:
  - `assign-job!` (line 23)
  - `claim-next-job!` (line 29)
  - `auto-assign-jobs!` (line 41)
  - `get-agent-job` (line 220)
  - `advance-job!` (line 205)
  - `adjacent-to-job?` (line 227)
- [ ] Link to job entity instead of job ID (defer to Phase 4)
- [ ] Update job completion to remove JobTarget component

### Deliverables
- [ ] Refactored `agents.clj` using component accessors
- [ ] Refactored `jobs.clj` using component accessors
- [ ] Refactored `spatial.clj` using Position queries
- [ ] Refactored `tick.initial/->agent` to add components
- [ ] Refactored `tick.movement/move-agent-with-job` for Position
- [ ] Refactored `institutions/apply-broadcast` for Role queries
- [ ] Updated `world/snapshot` for component queries
- [ ] Component extraction tests covering all data access paths

### Definition of Done
- [ ] All agent fields moved to separate components
- [ ] Agent maps eliminated or replaced with entity IDs only
- [ ] Existing tick loop produces identical output to baseline
- [ ] No regression in agent behavior (movement, needs, communication)
- [ ] All component access tests pass
- [ ] Code follows AGENTS.md style guidelines

### Story Points
**5 SP** (3-4 days estimated)

- Complexity: High - Requires careful refactoring of all agent data access
- Risk: Medium - Potential for data access bugs during transition
- Effort: High - ~12 agent fields to extract across 6+ files
- Testing: Medium - Comprehensive regression tests needed

### Migration Notes
- This phase maintains the existing tick loop structure (agents still in world vector)
- Agents are accessed by index initially, will transition to entity IDs in Phase 4
- Component access is added alongside existing map access, then map access removed
- This approach allows incremental verification and rollback if issues arise

### Related Issues
- #1 - ECS Phase 1: Foundation (must complete first)
- #3 - ECS Phase 3: System Implementation (next phase)

### References
- [[spec/ecs-migration-plan.md]]
- [[backend/src/fantasia/sim/agents.clj]]
- [[backend/src/fantasia/sim/jobs.clj]]
- [[backend/src/fantasia/sim/spatial.clj]]
- [[backend/src/fantasia/sim/tick/initial.clj]]
- [[backend/src/fantasia/sim/tick/movement.clj]]
- [[AGENTS.md]]

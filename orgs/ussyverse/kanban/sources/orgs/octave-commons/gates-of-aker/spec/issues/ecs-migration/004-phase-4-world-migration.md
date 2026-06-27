---
title: "[ECS Phase 4] Migrate World State to Entities"
labels: enhancement, ecs, phase-4, story-points:4
assignees: []
---

## Summary
Migrate all world state collections (tiles, jobs, items, stockpiles) to unified ECS entities. This eliminates disparate data structures and makes all game objects queryable via the same component system.

## Background
Currently world state contains multiple top-level collections:
- `:agents` - Vector of agent maps
- `:tiles` - Map of string keys `"q,r"` to tile structs
- `:jobs` - Vector of job maps
- `:items` - Nested map `"q,r" -> resource -> qty`
- `:stockpiles` - Map of position keys to stockpile data

These separate structures create:
- Inconsistent access patterns (maps vs vectors)
- Difficulty querying across object types (e.g., find all passable objects at position)
- Challenges for LOD (can't easily serialize/deserialize mixed collections)

ECS entities provide:
- Unified query interface for all objects
- Consistent access patterns (component lookups)
- Straightforward serialization (entity ID + component data)

## Specification
See [[spec/ecs-migration-plan.md#phase-4-world-state-migration](spec/ecs-migration-plan.md#phase-4-world-state-migration) for full details.

### Tasks

#### 1. Migrate Tiles to Entities
- [ ] Create entities for each tile during world initialization
- [ ] Add Structure component: `{:type :wall|:wall-ghost|:warehouse|nil}`
- [ ] Add Resource component: `{:type :tree|:fruit|nil :yield :wood|:food}`
- [ ] Add Passable component: `{:value true|false}` (walls: false)
- [ ] Replace `:tiles` map with Position-indexed query
- [ ] Update `spatial/` functions:
  - `in-bounds?` → query Position components in bounds
  - `passable?` → query Passable component at position
  - `at-trees?` → query Resource component with `:type :tree`
  - `near-shrine?` → query shrine entity Position
- [ ] Remove `:tiles` from world map
- [ ] Update `tick.initial/initial-world` to create tile entities

#### 2. Migrate Jobs to Entities
- [ ] Convert job maps to entities during creation
- [ ] Add JobTarget component: `{:job-id uuid :priority number :state :pending|:claimed|:in-progress}`
- [ ] Add Position component for job target location
- [ ] Add Progress component: `{:value 0.0 :required 1.0}`
- [ ] Add Type component: `{:job-type :job/eat|:job/sleep|:job/chop-tree|...}`
- [ ] Link job entity to worker entity via JobTarget component
- [ ] Update `jobs/` functions:
  - `create-job` → returns entity ID
  - `assign-job!` → adds JobTarget to worker entity
  - `claim-next-job!` → queries JobTarget-less jobs
  - `advance-job!` → updates Progress component
  - `complete-job!` → executes job type handler, removes job entity
  - `get-agent-job` → queries worker's JobTarget component
  - `adjacent-to-job?` → compares worker and job Position
- [ ] Remove `:jobs` vector from world map
- [ ] Add job completion handlers per type:
  - `:job/build-wall` → updates Structure component
  - `:job/chop-tree` → removes Resource component, adds item entities
  - `:job/haul` → moves items between entities
  - `:job/eat` → removes item entity, updates Needs
  - `:job/sleep` → updates Needs
  - `:job/deliver-food` → transfers items between Container components

#### 3. Migrate Items to Entities
- [ ] Convert item maps to entities during creation
- [ ] Add Resource component: `{:type :wood|:food :material}`
- [ ] Add Quantity component: `{:amount number}`
- [ ] Add Position component (for items on ground)
- [ ] Or add ContainerParent component (for items carried by agents)
- [ ] Update `jobs/` item functions:
  - `add-item!` → creates item entity with Position
  - `consume-items!` → queries items at Position, removes entity
  - `pickup-items!` → adds ContainerParent to item
  - `drop-items!` → removes ContainerParent, adds Position
  - `complete-haul!` → updates item Position
  - `generate-haul-jobs-for-items!` → queries item entities
- [ ] Remove `:items` nested map from world
- [ ] Update `world/snapshot` to query item entities

#### 4. Migrate Stockpiles to Entities
- [ ] Convert stockpile maps to entities during creation
- [ ] Add Container component: `{:capacity number :contents {resource-type amount}}`
- [ ] Add Resource component: `{:type :food|:wood}`
- [ ] Add Position component (stockpile location)
- [ ] Link to warehouse Structure entity via Position
- [ ] Update `jobs/` stockpile functions:
  - `create-stockpile!` → creates entity with Container
  - `add-to-stockpile!` → updates Container contents
  - `take-from-stockpile!` → reduces Container contents
  - `stockpile-has-space?` → queries Container
  - `stockpile-space-remaining` → queries Container
  - `find-nearest-stockpile-with-space` → queries by Position/Resource
- [ ] Remove `:stockpiles` map from world
- [ ] Update `jobs/complete-deliver-food!` to use Container queries

#### 5. Update Snapshot Generation
- [ ] Refactor `world/snapshot` to query all components via ECS API
- [ ] Query entities with Position + other components
- [ ] Reconstruct snapshot format:
  - `:agents` → query entities with Role component
  - `:tiles` → query entities with Structure component
  - `:jobs` → query entities with JobTarget component
  - `:items` → query entities with Resource + Quantity (no ContainerParent)
  - `:stockpiles` → query entities with Container
- [ ] Preserve existing snapshot format for UI compatibility
- [ ] Add ECS-specific debug view (optional, for development)
- [ ] Test snapshot serialization matches previous output

### Deliverables
- [ ] Unified entity store for all game objects
- [ ] Refactored `world.clj` using ECS queries only
- [ ] Refactored `jobs.clj` using ECS entities
- [ ] Refactored `spatial.clj` using component queries
- [ ] Refactored `tick.initial/initial-world` creating entities
- [ ] Updated `world/snapshot` for ECS queries
- [ ] Integration tests for snapshot format

### Definition of Done
- [ ] No world-state maps (agents, tiles, jobs, items, stockpiles)
- [ ] All objects accessed via entity/component system
- [ ] Snapshot API unchanged (same format, different implementation)
- [ ] UI integration verified (debugger displays correctly)
- [ ] All CRUD operations work for each object type
- [ ] Code follows AGENTS.md style guidelines

### Story Points
**4 SP** (2-3 days estimated)

- Complexity: Medium - Data structure changes across multiple collections
- Risk: Low - Isolated changes, existing logic still works
- Effort: Medium - ~25 functions to refactor across 4 namespaces
- Testing: Medium - Integration tests for snapshot + CRUD operations

### Migration Notes
- This phase completes ECS adoption for all game objects
- After this, world state contains only ECS structure + global config (levers, ledger, institutions)
- Job completion handlers become more complex (must query multiple entity types)
- Spatial queries become component-based instead of map-based

### Related Issues
- #1 - ECS Phase 1: Foundation (must complete first)
- #2 - ECS Phase 2: Component Extraction (must complete first)
- #3 - ECS Phase 3: System Implementation (must complete first)
- #5 - ECS Phase 5: Advanced Features (next phase)

### References
- [[spec/ecs-migration-plan.md]]
- [[backend/src/fantasia/sim/world.clj]]
- [[backend/src/fantasia/sim/jobs.clj]]
- [[backend/src/fantasia/sim/spatial.clj]]
- [[backend/src/fantasia/sim/tick/initial.clj]]
- [[AGENTS.md]]

# ECS Migration Specification #architecture #ecs #refactoring #performance #entity-component-system #backend #clojure

## Related Documentation
- [[backend/src/fantasia/sim/core.clj]] - Current simulation entry points #backend #simulation
- [[backend/src/fantasia/sim/world.clj]] - World state management #world #state
- [[backend/src/fantasia/sim/agents.clj]] - Agent logic and interactions #agents #ai
- [[backend/src/fantasia/sim/jobs.clj]] - Job system #jobs #tasks
- [[backend/src/fantasia/sim/events]] - Event archetype system #events #myth-engine
- [[backend/src/fantasia/sim/tick/core.clj]] - Tick loop orchestration #game-loop #tick
- [[spec/2026-01-15-core-loop.md]] - Day/night cycle mechanics #day-night #aker
- [[spec/2026-01-15-myth-engine.md]] - Myth engine and miracles #myth-engine #miracles #narrative

## Executive Summary
Migrate the backend simulation from monolithic agent/map structures to an Entity-Component-System (ECS) architecture. This will improve:
- **Composability**: Mix and match agent/structure/behavior patterns
- **Performance**: Enable component-based queries and filtering
- **Extensibility**: Add new entity types without modifying core loops
- **LOD Support**: Better support for tile-based level-of-detail loading

## Current Architecture Analysis

### World Structure
The current `world` map contains:
- `:agents` - Vector of agent maps with `:id`, `:pos`, `:role`, `:needs`, `:frontier`, `:recall`, `:current-path`, `:inventory`
- `:tiles` - Map of string keys `"q,r"` to tile structs with `:terrain`, `:structure`, `:resource`
- `:map` - Hex grid metadata (bounds, layout)
- `:jobs` - Vector of job maps with `:id`, `:type`, `:target`, `:worker-id`, `:progress`
- `:items` - Nested map `"q,r" -> resource -> qty`
- `:stockpiles` - Map of position keys to stockpile data
- `:levers`, `:shrine`, `:ledger`, `:recent-events`, `:traces`, `:institutions`

### Tick Loop Flow
`tick/tick-once` processes:
1. World events (trees, jobs)
2. Agent needs updates
3. Agent movement (job-driven or random)
4. World event generation and witness processing
5. Agent-to-agent communication (packet exchange)
6. Institution broadcasts
7. Ledger updates and snapshot generation

### Problem Areas
- **Tight coupling**: Agent maps contain simulation, rendering, and persistence data
- **Monolithic tick**: Single function handles all systems sequentially
- **Query inefficiency**: No indexed access to agents by role/position/component
- **Entity confusion**: Tiles, jobs, and agents are different data structures
- **LOD difficulty**: No clear entity ownership for tile-based aggregation

## ECS Architecture Design

### Core Concepts

#### Entities
Unique identifiers (UUIDs) representing anything in the simulation:
- Agents (villagers, champion)
- Structures (walls, warehouses, shrines)
- Resources (trees, ore deposits)
- Items (carried wood, food rations)
- Jobs (task entities for agents)
- Zones (field, forest, rocky biome)

#### Components
Pure data maps attached to entities. Each component represents one aspect:
- **Position**: `{:q 12 :r 5}` - Location in hex grid
- **Velocity**: `{:dq 0 :dr 0}` - Movement delta per tick
- **Needs**: `{:warmth 0.6 :food 0.7 :sleep 0.7}` - Vital stats
- **Inventory**: `{:wood 5 :food 2}` - Carried items
- **Role**: `{:type :peasant :title "Villager"}` - Social role
- **Frontier**: `{}` - Belief network state
- **Recall**: `{}` - Event memory
- **Structure**: `{:type :wall :health 100}` - Building data
- **Resource**: `{:type :tree :yield :wood :amount 5}` - Harvestable
- **JobTarget**: `{:job-id #uuid "..." :priority 100}` - Assignment reference
- **Container**: `{:capacity 50 :contents {[:wood 10]}}` - Storage
- **Passable**: `{:value true}` - Movement blocking
- **Vision**: `{:radius 6 :mode :day}` - Sight range
- **Alignment**: `{:loyalty 0.8 :faith 0.7 :trust 0.9}` - Faith network

#### Systems
Pure functions that query and update components:
- **MovementSystem**: Apply velocity to position, handle pathfinding
- **NeedsDecaySystem**: Decrease warmth/food/sleep each tick
- **JobAssignmentSystem**: Assign jobs to idle agents based on proximity/priority
- **JobProgressSystem**: Advance job progress when worker adjacent
- **PacketBroadcastSystem**: Generate semantic packets from agent state
- **PacketReceiveSystem**: Apply packets to agent frontiers
- **EventGenerationSystem**: Sample world events based on conditions
- **EventWitnessSystem**: Apply event effects to nearby agents
- **InstitutionBroadcastSystem**: Process institution-issued packets
- **LedgerUpdateSystem**: Update myth ledger with mentions
- **TreeSpreadSystem**: Grow/spread trees
- **InventoryTransferSystem**: Handle item pickup/drop

### Data Structure

```clojure
;; ECS World (using Brute library structure)
{:entity-components {}        ;; Nested Map of Component Types -> Entity -> Component Instance
 :entity-component-types {}   ;; Map of Entities -> Set of Component Types
 :systems []}                  ;; Ordered system functions
```

## Migration Plan

### Phase 1: Foundation (ECS Layer with Brute)
**Duration**: 2-3 days
**Risk**: Low (non-breaking, parallel development)
**Dependencies**: Brute library

#### Tasks
1. **Add Brute dependency to deps.edn**
   - Add `markmandel/brute` dependency to `backend/deps.edn`
   - Update `clojure -P` to download dependencies

2. **Create ECS namespace** (`fantasia.sim.ecs`)
   - Wrapper around Brute's entity and system APIs
   - Component CRUD operations using `brute.entity/create-entity`, `add-component`, `get-component`
   - Query helpers using `brute.entity/get-all-entities-with-component`
   - System execution using `brute.system/process-one-game-tick`

3. **Define component schemas**
   - Document all required components
   - Create validation helpers
   - Define component relationships (e.g., Position + Velocity implies Movement)

4. **Create component creation helpers**
   - `make-position`, `make-needs`, `make-role`, `make-frontier`, etc.
   - Default values for optional fields

**Deliverables**
- Updated `backend/deps.edn` with Brute dependency
- `backend/src/fantasia/sim/ecs.clj` wrapping Brute APIs
- Component schema documentation
- Basic entity/component/system CRUD tests

**Definition of Done**
- Can create entities with multiple components using Brute
- Can query entities by component types
- Can execute system functions on world state
- All tests pass
- Code follows AGENTS.md style guidelines

---

### Phase 2: Component Extraction (Agent Data)
**Duration**: 3-4 days
**Risk**: Medium (requires refactoring existing logic)

#### Tasks
1. **Extract Position component**
   - Replace agent `:pos` with Position component
   - Update all position references in `agents.clj:42`, `jobs.clj:38`, `spatial.clj:28`
   - Add Position to entities that need it (agents, structures, resources)
   - Update `spatial/in-bounds?`, `spatial/passable?` to query Position components

2. **Extract Needs component**
   - Replace agent `:needs` with Needs component
   - Update `agents/update-needs` to work with component
   - Preserve threshold data in separate component or nested field

3. **Extract Role component**
   - Replace agent `:role` with Role component
   - Update speaker/role checks throughout codebase
   - Add `:title`, `:rank` fields for future prestige system

4. **Extract Inventory component**
   - Replace agent `:inventory` with Inventory component
   - Update job/item handling in `jobs.clj`
   - Add to structures for storage

5. **Extract Frontier/Recall components**
   - Replace agent `:frontier`, `:recall` with separate components
   - Update `agents/apply-packet-to-listener`
   - Preserve existing facet/recall semantics

6. **Extract JobTarget component**
   - Replace `:current-job` reference with JobTarget component
   - Update job assignment/progress logic
   - Link to job entity instead of job ID

**Deliverables**
- Refactored `agents.clj` using component accessors
- Refactored `jobs.clj` using component accessors
- Updated spatial/pathing queries
- Component extraction tests

**Definition of Done**
- All agent fields moved to components
- Agent maps eliminated (or replaced with entity IDs)
- Existing tick loop produces identical output to baseline
- No regression in agent behavior

---

### Phase 3: System Implementation (Tick Logic)
**Duration**: 4-5 days
**Risk**: Medium (requires careful ordering and state management)

#### Tasks
1. **Implement MovementSystem**
   - Extract logic from `tick.movement/move-agent-with-job`
   - Query entities with Position + Velocity + JobTarget components
   - Apply pathfinding for job targets
   - Handle random movement for idle agents

2. **Implement NeedsDecaySystem**
   - Extract from `agents/update-needs`
   - Apply cold-snap multiplier
   - Clamp values 0-1

3. **Implement JobAssignmentSystem**
   - Extract from `jobs/claim-next-job!` and `jobs/auto-assign-jobs!`
   - Query idle agents (no JobTarget component)
   - Score jobs by priority/distance
   - Assign JobTarget component

4. **Implement JobProgressSystem**
   - Extract from `tick.core/process-jobs!`
   - Query entities with JobTarget + Position components
   - Check adjacency to job target
   - Advance progress, trigger completion

5. **Implement PacketBroadcastSystem**
   - Extract from `agents/choose-packet`
   - Query agents with Frontier + Role + Position components
   - Generate packet based on needs/role/location
   - Emit broadcast event

6. **Implement PacketReceiveSystem**
   - Extract from `agents/apply-packet-to-listener`
   - Query adjacent agent pairs
   - Apply packet to Frontier component
   - Generate mentions/traces

7. **Implement EventGenerationSystem**
   - Extract from `events.runtime/generate`
   - Query world state (cold-snap, agent fear levels)
   - Sample event based on probability
   - Emit event entity with position/type/impact

8. **Implement EventWitnessSystem**
   - Extract from `events.runtime/apply-to-witness`
   - Query agents near event position
   - Update Frontier + Recall components
   - Generate witness mentions

9. **Implement InstitutionBroadcastSystem**
   - Extract from `institutions/broadcasts`
   - Query institution schedules
   - Generate canonical packets
   - Apply to aligned agents

10. **Implement LedgerUpdateSystem**
    - Extract from `world/update-ledger`
    - Process mention queue
    - Decay buzz/tradition
    - Update attribution scores

**Deliverables**
- `backend/src/fantasia/sim/systems/` directory with individual system files
- System orchestration in `ecs.clj`
- System execution ordering documentation

**Definition of Done**
- All tick logic moved to systems
- `tick/tick-once` orchestrates systems only
- Systems are pure (take world, return world)
- Tick output matches baseline behavior
- Performance benchmark within 10% of original

---

### Phase 4: World State Migration
**Duration**: 2-3 days
**Risk**: Low (isolated data structure changes)

#### Tasks
1. **Migrate tiles to entities**
   - Create entities for each tile with Structure/Resource/Passable components
   - Replace `:tiles` map with Position-indexed query
   - Update spatial queries to use component lookups

2. **Migrate jobs to entities**
   - Convert job maps to entities with JobTarget/Position/Progress components
   - Update job CRUD operations in `jobs.clj`
   - Link job entities to worker entities

3. **Migrate items to entities**
   - Convert item maps to entities with Resource/Container/Position components
   - Update inventory transfer logic
   - Support pile vs carried items

4. **Migrate stockpiles to entities**
   - Create Container entities at stockpile positions
   - Link to warehouse Structure entities
   - Update storage/withdraw logic

5. **Update snapshot generation**
   - Refactor `world/snapshot` to query components
   - Preserve existing snapshot format for UI compatibility
   - Add ECS-specific debug views

**Deliverables**
- Unified entity store for all game objects
- Refactored `world.clj` using ECS queries
- Updated snapshot function

**Definition of Done**
- No world-state maps (agents, tiles, jobs, items, stockpiles)
- All objects accessed via entity/component system
- Snapshot API unchanged
- UI integration verified

---

### Phase 5: Advanced ECS Features
**Duration**: 3-4 days
**Risk**: Low (enhancement, no regression risk)

#### Tasks
1. **Implement component indexing**
   - Add spatial index for Position components (quadtree or hash grid)
   - Add role index for Role components
   - Optimize neighbor queries (packet broadcast, event witnesses)
   - Cache index updates per tick

2. **Add system phases**
   - Split systems into: `:pre-update`, `:update`, `:post-update`
   - Support dependency injection (e.g., Movement before JobProgress)
   - Enable parallel execution where safe (systems with disjoint component sets)

3. **Implement entity templates**
   - Define `:peasant`, `:priest`, `:knight`, `:champion` templates
   - Define structure templates: `:wall`, `:warehouse`, `:shrine`, `:tree`
   - Use in `tick.initial/initial-world`
   - Support template inheritance/composition

4. **Add serialization support**
   - ECS world → JSON/durable format using Brute's structure
   - Preserve entity IDs across saves
   - Support incremental LOD loading
   - Add save/load endpoints to server

5. **Add query DSL**
   - Macro-based queries: `(with-all-of [Position Velocity Role] ...)`
   - Support filtering: `(where #(> (:warmth %) 0.5))`
   - Improve readability over manual component lookups

**Deliverables**
- Indexed component access
- Phase-based system execution
- Entity template system
- Save/load support
- Query DSL

**Definition of Done**
- Neighbor queries < 1ms for 1000 entities
- Systems execute in parallel where possible
- World save/load produces identical state
- Template-based entity creation

---

### Phase 6: LOD and Tile Loading
**Duration**: 4-5 days
**Risk**: Medium (changes core assumptions)

#### Tasks
1. **Design tile entity partitioning**
   - Define tile boundaries as entity sets
   - Implement entity-to-tile mapping
   - Support entity migration between tiles
   - Design serialization format for off-tile entities

2. **Implement tile loading/unloading**
   - Serialize entity state on unload
   - Apply persisted deltas on reload
   - Trigger LOD aggregation for off-tile entities
   - Handle entity references crossing tile boundaries

3. **Implement LOD aggregation**
   - Create aggregate entities for off-tile populations
   - Reduce state: counts, averages, not individual agents
   - Restore detail on reload
   - Preserve myth ledger across LOD transitions

4. **Update tick loop for tile management**
   - Load/unload based on champion position (Position component)
   - Run tick only on loaded tiles
   - Simulate aggregated tiles abstractly
   - Handle tile transition events

**Deliverables**
- Tile partitioning system
- LOD aggregation logic
- Tile-aware tick loop

**Definition of Done**
- Can load/unload 3x3 tile area in < 100ms
- Aggregated state preserves key metrics (population, resources)
- Champion movement triggers seamless tile loads
- LOD transitions don't break myth ledger

---

## Implementation Details

### Library Choice: Brute

**Decision**: Use Brute library for all ECS primitives
- Brute (185 stars, EPL-1.0 license, Clojure + ClojureScript)
- Provides: entity creation, component CRUD, system management
- Custom extensions for: spatial indexing, templates, query DSL

**Brute API Usage**:
```clojure
(ns fantasia.sim.ecs
  (:require [brute.entity :as entity]
            [brute.system :as system]))

(defn create-system []
  (entity/create-system))

(defn add-agent [system id pos role]
  (-> system
      (entity/add-entity id)
      (entity/add-component id (make-position pos))
      (entity/add-component id (make-role role))
      (entity/add-component id (make-needs))))

(defn get-all-agents [system]
  (entity/get-all-entities-with-component system Role))
```

### Component Validation
```clojure
(def component-schemas
  {:position [:q :r]
   :needs [:warmth :food :sleep]
   :role [:type]
   :inventory [:wood :food]})

(defn validate-component [type data]
  (let [required (get component-schemas type)]
    (every? #(contains? data %) required)))
```

### System Ordering
Systems must execute in dependency order:
1. EventGeneration (creates event entities)
2. EventWitness (updates agents from events)
3. NeedsDecay (updates agent stats)
4. JobAssignment (assigns jobs)
5. Movement (moves agents)
6. JobProgress (advances jobs after movement)
7. PacketBroadcast (creates packets)
8. PacketReceive (applies packets to listeners)
9. InstitutionBroadcast (institution packets)
10. LedgerUpdate (processes mentions)
11. TreeSpread (environment changes)

### Query Optimization
- Pre-compute neighbor lists each tick
- Cache component access patterns (Position + Velocity + JobTarget)
- Use Brute's component maps: `component-type -> entity-id -> data`
- Add spatial index: `position -> #{entity-ids}`

### Backward Compatibility
- Preserve `world/snapshot` API during migration
- Keep existing WebSocket message formats
- Add `ecs/snapshot` with richer ECS data
- Deprecate old API after 2 versions

### Champion as Entity
- Champion entity with Alignment/Role/Vision components
- Same system interactions as other agents
- Unique champion abilities implemented as specialized systems
- Day/night mode toggles which systems affect champion

## Testing Strategy

### Unit Tests
- Component CRUD operations using Brute
- Query correctness (filtering, sorting)
- System purity (same input → same output)
- Serialization/deserialization

### Integration Tests
- Full tick produces expected world state
- Agent interactions (movement, communication)
- Job lifecycle (assign → progress → complete)
- Event generation and witness effects

### Regression Tests
- Compare ECS tick output to baseline tick output
- Validate snapshot format unchanged
- Performance benchmarks (memory, time)

### Load Tests
- 1000 entities, 100 ticks
- Tile load/unload cycles
- LOD aggregation accuracy

## Risks and Mitigations

### Performance Risk
**Risk**: Component queries slower than direct map access
**Mitigation**: Index components, cache hot queries, benchmark each phase, use Brute's optimized lookups

### Complexity Risk
**Risk**: ECS harder to understand than current structure
**Mitigation**: Document query patterns, provide helper macros, add examples, leverage Brute's simplicity

### Integration Risk
**Risk**: Breaking UI WebSocket contract
**Mitigation**: Preserve snapshot API, version messages, gradual rollout

### Dependency Risk
**Risk**: Brute library adds external dependency
**Mitigation**: Brute is battle-tested (185 stars), EPL license compatible, minimal API surface

## Open Questions

1. **Day/Night Transitions**: How to handle different system sets?
   - Option A: Swap system lists at phase transition
   - Option B: Add `:phase` filter to systems
   - **Recommendation**: Phase filters, allows shared systems

2. **Miracle System**: Where to integrate miracle effects?
   - Option A: MiracleSystem applies effects to entities
   - Option B: Miracles modify components directly
   - **Recommendation**: MiracleSystem for consistency with other effects

## Timeline
- **Phase 1**: 2-3 days
- **Phase 2**: 3-4 days
- **Phase 3**: 4-5 days
- **Phase 4**: 2-3 days
- **Phase 5**: 3-4 days
- **Phase 6**: 4-5 days
- **Total**: 18-24 days

## Success Criteria
- All entities accessed via ECS API (Brute-based)
- All tick logic in systems (no monolithic functions)
- Performance within 10% of baseline
- LOD support for 1000+ entities
- Full test coverage
- Documentation updated in AGENTS.md
- Brute dependency successfully integrated

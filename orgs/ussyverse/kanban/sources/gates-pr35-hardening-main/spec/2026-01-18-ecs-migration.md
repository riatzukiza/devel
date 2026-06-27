# ECS Migration Design

---
Type: spec
Component: ecs
Priority: high
Status: proposed
Related-Issues: []
Milestone: 3.5
Estimated-Effort: 80 hours
---

## Context
Current architecture uses nested maps for entities (agents, tiles, jobs) scattered across world state. This approach is becoming unmanageable as complexity increases. Migration to ECS (Entity-Component-System) will provide:
- Clear separation of data (components) and behavior (systems)
- Better query performance for large entity counts
- Easier extension for new entity types
- Improved testability

## Library Choice
**Selected: [markmandel/brute](https://github.com/markmandel/brute)**

**Rationale:**
- 185 stars, actively maintained (2014-2024)
- Clojure + ClojureScript compatible (supports both backend and future frontend use)
- Lightweight, functional approach that fits existing codebase style
- Entities as UUIDs, components as maps/records (idiomatic Clojure)
- Systems are just functions, easy to reason about
- No mutable state in library itself (persistence is application responsibility)

**Installation:**
```clojure
[brute "0.5.1"]
```

## Architecture Design

### Current State
Entities are stored as nested maps in `*state`:
```clojure
{:agents [{:id 1 :pos [0 0] :role :priest :needs {...} ...]
 :jobs [...]
 :tiles {"0,0" {:terrain :ground :structure :wall}}}
```

### Target ECS State
```clojure
{:world (brute.entity/create-system)  ;; ECS system containing entities
 :global {...}                        ;; Global world state (tick, shrine, etc.)
 :components {:position {...} :needs {...} :role {...}}}
```

Where `brute.entity/create-system` returns:
```clojure
{:entity-components {}      ;; Map of component-type -> entity-id -> component
 :entity-component-types {} ;; Map of entity-id -> set of component-types}
```

## Component Definitions

### Position Component
```clojure
(defrecord Position [q r])
```
- Used by: Agents, Tiles
- Storage: `:position` component type

### Needs Component
```clojure
(defrecord Needs [warmth food sleep])
```
- Used by: Agents
- Storage: `:needs` component type

### Inventory Component
```clojure
(defrecord Inventory [wood food])
```
- Used by: Agents, Stockpiles
- Storage: `:inventory` component type

### Role Component
```clojure
(defrecord Role [type])
```
- Values: `:priest`, `:knight`, `:peasant`
- Used by: Agents
- Storage: `:role` component type

### Frontier Component
```clojure
(defrecord Frontier [facets])
```
- Map of facet keywords to activation values
- Used by: Agents
- Storage: `:frontier` component type

### Recall Component
```clojure
(defrecord Recall [events])
```
- Map of event-type IDs to recall scores
- Used by: Agents
- Storage: `:recall` component type

### JobAssignment Component
```clojure
(defrecord JobAssignment [job-id progress])
```
- Used by: Agents with active jobs
- Storage: `:job-assignment` component type

### Path Component
```clojure
(defrecord Path [waypoints current-index])
```
- Used by: Agents moving to targets
- Storage: `:path` component type

### Tile Component
```clojure
(defrecord Tile [terrain biome structure resource])
```
- Used by: Tile entities
- Storage: `:tile` component type

### Stockpile Component
```clojure
(defrecord Stockpile [contents])
```
- Used by: Stockpile tiles
- Storage: `:stockpile` component type

### WallGhost Component
```clojure
(defrecord WallGhost [owner-id])
```
- Used by: Temporary build markers
- Storage: `:wall-ghost` component type

## System Definitions

### 1. Needs Decay System
**Input:** Entities with `Needs` component
**Output:** Updated `Needs` components
**Logic:** Decay warmth/food/sleep based on cold-snap global
**File:** `backend/src/fantasia/sim/ecs/systems/needs_decay.clj`

### 2. Job Assignment System
**Input:** Entities with `Needs` + `Position`, job queue
**Output:** Entities with `JobAssignment` component added
**Logic:** Assign jobs based on needs and proximity
**File:** `backend/src/fantasia/sim/ecs/systems/job_assignment.clj`

### 3. Movement System
**Input:** Entities with `Position` + `Path` or `JobAssignment`
**Output:** Updated `Position` components
**Logic:** Move entities along paths, update progress
**File:** `backend/src/fantasia/sim/ecs/systems/movement.clj`

### 4. Job Processing System
**Input:** Entities with `JobAssignment` + `Position`
**Output:** Updated job state, modified tiles/inventory
**Logic:** Execute job (chop tree, haul, build, eat, sleep)
**File:** `backend/src/fantasia/sim/ecs/systems/job_processing.clj`

### 5. Agent Interaction System
**Input:** Entities with `Position` + `Frontier` + `Recall`
**Output:** Updated `Frontier` + `Recall`, trace events
**Logic:** Conversations between adjacent agents
**File:** `backend/src/fantasia/sim/ecs/systems/agent_interaction.clj`

### 6. Event Application System
**Input:** Entities with `Frontier` + `Recall`
**Output:** Updated `Frontier` + `Recall`, mention events
**Logic:** Apply world events to witnesses
**File:** `backend/src/fantasia/sim/ecs/systems/event_application.clj`

### 7. Facet Decay System
**Input:** Entities with `Frontier` component
**Output:** Updated `Frontier` components
**Logic:** Decay facet activations
**File:** `backend/src/fantasia/sim/ecs/systems/facet_decay.clj`

### 8. Spatial Queries System
**Helper:** No state changes
**Logic:** Query entities by position hex, find neighbors
**File:** `backend/src/fantasia/sim/ecs/systems/spatial.clj`

## Migration Strategy

### Phase 1: ECS Foundation (5-8 story points)
- [ ] Add `brute` dependency to `deps.edn`
- [ ] Create component record definitions in `backend/src/fantasia/sim/ecs/components.clj`
- [ ] Create ECS system initialization in `backend/src/fantasia/sim/ecs/core.clj`
- [ ] Implement `create-entity` helpers that auto-assign components
- [ ] Create entity query helpers (`get-agents-at-pos`, `get-nearest-stockpile`, etc.)

**Backend code locations:**
- `backend/src/fantasia/sim/ecs/components.clj` - All component record definitions
- `backend/src/fantasia/sim/ecs/core.clj` - ECS world wrapper, entity creation, queries

### Phase 2: Adapter Layer (8-12 story points)
- [ ] Create adapter to convert ECS world ↔ snapshot format for WebSocket
- [ ] Maintain backward compatibility with existing WebSocket API
- [ ] Add `ecs->snapshot` function for `broadcast!`
- [ ] Add `snapshot->ecs` function for WS message handling
- [ ] Update tick loop to use ECS internally but expose old snapshot format

**Backend code locations:**
- `backend/src/fantasia/sim/ecs/adapter.clj` - Conversion functions
- `backend/src/fantasia/sim/tick/core.clj` - Modify tick to use ECS

### Phase 3: Migrate Agent Systems (12-16 story points)
- [ ] Migrate `needs_decay` system (from `agents.clj:7`)
- [ ] Migrate `job_assignment` system (from `jobs.clj`)
- [ ] Migrate `movement` system (from `movement.clj`)
- [ ] Migrate `job_processing` system (from `jobs.clj`)
- [ ] Migrate `agent_interaction` system (from `agents.clj`)
- [ ] Run integration tests to verify agent behavior unchanged

**Backend code locations:**
- `backend/src/fantasia/sim/ecs/systems/needs_decay.clj`
- `backend/src/fantasia/sim/ecs/systems/job_assignment.clj`
- `backend/src/fantasia/sim/ecs/systems/movement.clj`
- `backend/src/fantasia/sim/ecs/systems/job_processing.clj`
- `backend/src/fantasia/sim/ecs/systems/agent_interaction.clj`

### Phase 4: Migrate Tile/World Systems (8-12 story points)
- [ ] Migrate tile entities to ECS (create tile entities for each hex)
- [ ] Migrate `tree_spread` system (from `trees.clj`)
- [ ] Migrate `stockpile` system to ECS queries
- [ ] Update spatial queries to work with ECS entities
- [ ] Verify map rendering unchanged

**Backend code locations:**
- `backend/src/fantasia/sim/ecs/systems/tree_spread.clj`
- `backend/src/fantasia/sim/ecs/systems/spatial.clj` - Update for tile entities

### Phase 5: Frontend Compatibility (5-8 story points)
- [ ] Update TypeScript types for ECS-friendly snapshot format
- [ ] Test WebSocket message flow end-to-end
- [ ] Verify UI rendering unchanged
- [ ] No frontend ECS needed yet - adapter maintains compatibility

**Frontend code locations:**
- `web/src/ws.ts` - May need type updates
- `web/src/components/*.tsx` - No changes if adapter works correctly

## Data Flow

### Current Flow
```
Tick → Functions modify nested maps → broadcast! sends snapshot → Frontend renders
```

### ECS Flow
```
Tick → Systems modify ECS components → ecs->snapshot → broadcast! → Frontend renders (unchanged)
```

### Example: Agent Move
**Current:**
```clojure
(defn move-agent [world agent-id [q r]]
  (update-in world [:agents agent-id :pos] (constantly [q r])))
```

**ECS:**
```clojure
(defn move-entity [ecs-world entity-id [q r]]
  (brute.entity/add-component ecs-world entity-id
                               (->Position q r)))
```

## Backward Compatibility

The adapter layer will maintain the existing WebSocket message format. Frontend changes are minimized:

```clojure
;; In adapter.clj
(defn ecs->snapshot [ecs-world global-state]
  {:agents (brute.entity/get-all-entities-with-component ecs-world Role)
   :jobs (:jobs global-state)  ;; Jobs may stay in global state initially
   :tiles (...)})

;; Frontend sees same format as before
{:op "tick" :data {:snapshot {...} :tick 42}}
```

## Performance Considerations

### Brute Performance Characteristics
- Entity lookup: O(1) (UUID keys)
- Component lookup: O(1) (nested map access)
- Query by component: O(n) where n = entity count (can be optimized with spatial index)

### Spatial Indexing
For world with 1000+ tiles, add spatial index:
- Use hex-coordinate → entity-id map for tile lookups
- Cache neighbor queries
- Consider spatial hash grid for agent lookups

## Testing Strategy

### Unit Tests
- Test component creation and validation
- Test entity queries (get-all-entities-with-component, get-component)
- Test each system in isolation with mocked ECS state

### Integration Tests
- Run full tick with ECS and compare output to non-ECS version
- Verify agent counts, positions, needs match
- Verify job assignments match
- Verify frontier/recall state matches

### Regression Tests
- Before migration: capture snapshot from 100 ticks
- After migration: capture snapshot from 100 ticks with same seed
- Compare outputs byte-for-byte

## Risks and Mitigations

### Risk 1: Performance Regression
- **Mitigation:** Benchmark before/after, optimize queries, add spatial index

### Risk 2: WebSocket API Breakage
- **Mitigation:** Adapter layer guarantees snapshot format, thorough integration testing

### Risk 3: State Loss During Migration
- **Mitigation:** Branch migration, parallel non-ECS and ECS implementations, A/B test

### Risk 4: Increased Complexity
- **Mitigation:** Clear documentation,循序渐进 migration, each phase fully tested

## Definition of Done

### Phase 1 Complete
- [ ] Brute dependency installed
- [ ] All component records defined
- [ ] ECS core initialized with helper functions
- [ ] Tests pass for entity creation and queries

### Phase 2 Complete
- [ ] Adapter layer converts ECS ↔ snapshot bidirectionally
- [ ] Tick loop uses ECS internally
- [ ] WebSocket broadcasts unchanged format
- [ ] Frontend renders without changes

### Phase 3 Complete
- [ ] All agent systems migrated to ECS
- [ ] Old agent code removed or deprecated
- [ ] Integration tests show identical behavior
- [ ] Performance within 10% of original

### Phase 4 Complete
- [ ] All tile/world systems migrated to ECS
- [ ] Jobs system fully integrated
- [ ] No remaining map-based entity storage
- [ ] All systems use ECS queries

### Phase 5 Complete
- [ ] Frontend works without modification
- [ ] All WebSocket messages flow correctly
- [ ] End-to-end test passes (start → 100 ticks → shutdown)
- [ ] No console errors

## Progress Update (2026-01-18)

### Completed
- ✅ Brute 0.4.0 installed and working
- ✅ Brute source copied to `backend/src/brute/` (resolves JAR issues)
- ✅ All component records defined in `ecs/components.clj`
  - Position, Needs, Inventory, Role, Frontier, Recall
  - JobAssignment, Path, Tile, Stockpile, WallGhost, Agent
- ✅ ECS core functions working in `ecs/core.clj`
  - `create-ecs-world`, `create-agent`, `create-tile`, `create-stockpile`
  - `get-all-agents`, `get-all-tiles`, `get-tile-at-pos`
  - Helper functions for nearest agents, job assignment, path setting
- ✅ Systems created
  - `ecs/systems/needs-decay.clj` - Agent needs decay
  - `ecs/systems/movement.clj` - Agent movement along paths
- ✅ Test file created at `src/fantasia/sim/ecs/test.clj`

### Current Issue: Adapter Layer
❌ **Adapter compilation failing** - `ecs/adapter.clj` has namespace resolution issues

**Root Cause**: Clojure can't resolve `fantasia.sim.ecs.components` as an alias (e.g., `c/Position`)

**Attempts Made**:
1. Used `:as c` alias - fails with "No such var: c"
2. Used fully qualified names - still fails
3. Tested namespace loading separately - works fine
4. Created test file using fully qualified names - **WORKS**

**Test Results**:
```bash
cd backend && clojure -M -e "(require '[fantasia.sim.ecs.test])"
# Output:
# ECS test loaded!
# Created agent: #uuid "..."
# Total agents: 1
# ECS test passed!
```

**Working Pattern** (from test.clj):
```clojure
(ns fantasia.sim.ecs.test
  (:require [brute.entity :as be]
            [fantasia.sim.ecs.core]))

(def world (be/create-system))
(def result (fantasia.sim.ecs.core/create-agent world 1 0 0 :priest))
(def eid (first result))
(def world' (second result))
(println "Created agent:" eid)
(def agents (fantasia.sim.ecs.core/get-all-agents world'))
(println "Total agents:" (count agents))
(println "ECS test passed!")
```

### Next Steps
1. **Create adapter** using working pattern from test file
2. **Write unit tests** in `test/fantasia/sim/ecs/` directory
3. **Integrate** ECS into tick loop with adapter
4. **Migrate remaining** systems (Jobs, Events, Agent Interactions)
- [ ] All code migrated to ECS
- [ ] Documentation updated
- [ ] Deprecation warnings removed
- [ ] Performance benchmarked
- [ ] Ready to ship

## References
- Brute docs: https://markmandel.github.io/brute/codox/
- Brute repo: https://github.com/markmandel/brute
- Entity Systems Wiki: http://entity-systems.wikidot.com/
- Current code: `backend/src/fantasia/sim/`

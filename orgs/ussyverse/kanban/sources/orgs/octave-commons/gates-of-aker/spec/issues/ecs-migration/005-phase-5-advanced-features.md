---
title: "[ECS Phase 5] Advanced ECS Features"
labels: enhancement, ecs, phase-5, story-points:5
assignees: []
---

## Summary
Implement advanced ECS features including component indexing, system phases, entity templates, serialization, and query DSL. This provides performance optimizations and developer ergonomics for the ECS system.

## Background
Phases 1-4 provide a working ECS system, but lack:
- **Performance optimizations** for large entity counts (no indexing)
- **Developer ergonomics** for common patterns (no templates, no query DSL)
- **System orchestration** flexibility (no phase-based execution)
- **Save/load support** for persistent state

These features are essential for:
- Scaling to 1000+ entities (Phase 6 LOD requirements)
- Faster development iteration (templates reduce boilerplate)
- Player save/load functionality
- Parallel system execution where safe

## Specification
See [[spec/ecs-migration-plan.md#phase-5-advanced-ecs-features](spec/ecs-migration-plan.md#phase-5-advanced-ecs-features) for full details.

### Tasks

#### 1. Implement Component Indexing
- [ ] Add spatial index for Position components
  - Use hash grid or simple quadtree
  - Map position key `"q,r"` to entity ID set
  - Update index when Position components added/removed
- [ ] Add role index for Role components
  - Map `:role-type` keyword to entity ID set
  - Update index when Role components added/removed
- [ ] Add job index for JobTarget components
  - Map state keywords (`:pending`, `:claimed`, `:in-progress`) to entity ID set
  - Update index when JobTarget components added/removed
- [ ] Optimize neighbor queries (packet broadcast, event witnesses)
  - Replace linear scan with index lookup
  - Cache neighbor lists each tick
- [ ] Create index update hooks in `ecs.clj`
  - Call after `add-component!` and `remove-component!`
  - Support incremental updates

#### 2. Add System Phases
- [ ] Add phase metadata to system registration
  - `:phase` keyword: `:pre-update`, `:update`, `:post-update`
  - Default to `:update` for backward compatibility
- [ ] Update system execution to support phases
  - Execute all `:pre-update` systems
  - Execute all `:update` systems (current behavior)
  - Execute all `:post-update` systems
- [ ] Add dependency metadata to systems
  - `:after` vector of system names that must run first
  - `:requires` vector of component types that must exist
  - Validate no circular dependencies
- [ ] Enable parallel execution where safe
  - Identify systems with disjoint component sets
  - Use `pmap` or `future` for independent systems
  - Ensure pure systems (no shared mutable state)
- [ ] Update system ordering documentation

#### 3. Implement Entity Templates
- [ ] Define agent templates in `ecs.clj`:
  - `:peasant` - Basic villager (Role:peasant, Needs:default, Inventory:empty)
  - `:priest` - Religious leader (Role:priest, higher Alignment)
  - `:knight` - Warrior (Role:knight, combat stats)
  - `:champion` - Player character (all components + Vision:player)
- [ ] Define structure templates:
  - `:wall` - Structure:w:wall, Passable:false, Health:100
  - `:warehouse` - Structure:w:warehouse, Container:large
  - `:shrine` - Structure:w:shrine, Passable:true
  - `:tree` - Resource:tree, Yield:wood
- [ ] Implement `create-entity-from-template!` function
  - Takes template keyword and optional overrides
  - Adds all required components
  - Returns entity ID
- [ ] Update `tick.initial/initial-world` to use templates
  - Replace direct agent creation with `create-entity-from-template!`
  - Replace manual tile creation with templates
- [ ] Support template inheritance (extending base templates)

#### 4. Add Serialization Support
- [ ] Implement `serialize-world` function
  - Converts ECS world to durable format (JSON via Cheshire)
  - Preserves entity IDs (UUIDs)
  - Includes all component data
  - Includes global state (levers, ledger, institutions)
- [ ] Implement `deserialize-world` function
  - Parses JSON to ECS world structure
  - Reconstructs Brute system structure
  - Validates entity/component integrity
- [ ] Add save/load endpoints to server
  - `POST /sim/save` - serializes current world
  - `POST /sim/load` - deserializes world, resets state
- [ ] Support incremental LOD serialization
  - Per-tile entity sets
  - Deltas for off-tile entities
  - Merge on load without ID conflicts
- [ ] Add save/load tests
  - Serialize world, deserialize, verify identical state
  - Test with various entity counts and component combinations

#### 5. Add Query DSL
- [ ] Implement macro `with-all-of [component-types] bindings body`
  - Expands to loop over entities with all specified components
  - Destructures components into bindings
  - Optimized using component type checks
- [ ] Implement macro `with-any-of [component-types] bindings body`
  - Expands to loop over entities with any specified component
  - Returns union of entity sets
- [ ] Implement filter function `where pred`
  - Chains after query macros for additional filtering
  - Example: `(where #(> (:warmth %) 0.5))`
- [ ] Implement aggregation helpers
  - `count-entities-with` - returns count matching query
  - `find-entity` - returns first matching entity
  - `reduce-entities` - folds over matching entities
- [ ] Add query performance tests
  - Benchmark macro expansion vs manual queries
  - Ensure no performance regression

### Deliverables
- [ ] Indexed component access (spatial, role, job indexes)
- [ ] Phase-based system execution
- [ ] Entity template system (agents and structures)
- [ ] Save/load support for world state
- [ ] Query DSL macros and helpers
- [ ] Performance benchmarks for indexes and queries
- [ ] Integration tests for serialization

### Definition of Done
- [ ] Neighbor queries < 1ms for 1000 entities
- [ ] Systems execute in parallel where possible
- [ ] World save/load produces identical state
- [ ] Template-based entity creation used in `initial-world`
- [ ] Query DSL used in 50%+ of system implementations
- [ ] All query/macro tests pass
- [ ] Code follows AGENTS.md style guidelines

### Story Points
**5 SP** (3-4 days estimated)

- Complexity: High - Spatial indexing, macros, serialization
- Risk: Low - Enhancement features, no regression risk
- Effort: High - ~20 features to implement across 5 areas
- Testing: Medium - Performance benchmarks + serialization tests

### Performance Targets
- Spatial index lookup: O(1) average case
- Neighbor query (radius 6): < 1ms for 1000 entities
- Parallel system execution: 30-40% faster for independent systems
- Query DSL: No performance penalty vs manual queries

### Migration Notes
- This phase adds optional optimizations and ergonomics
- Systems from Phase 3 continue to work without these features
- Gradual adoption possible (use templates as convenient, migrate queries over time)
- Indexes update incrementally to avoid full rebuilds

### Related Issues
- #1 - ECS Phase 1: Foundation (must complete first)
- #2 - ECS Phase 2: Component Extraction (must complete first)
- #3 - ECS Phase 3: System Implementation (must complete first)
- #4 - ECS Phase 4: World State Migration (must complete first)
- #6 - ECS Phase 6: LOD Support (next phase)

### References
- [[spec/ecs-migration-plan.md]]
- [[backend/src/fantasia/sim/ecs.clj]]
- [[backend/src/fantasia/sim/tick/initial.clj]]
- [[backend/src/fantasia/sim/server.clj]]
- [[AGENTS.md]]

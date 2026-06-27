---
title: "[ECS Phase 1] Foundation ECS Layer with Brute"
labels: enhancement, ecs, phase-1, story-points:3
assignees: []
---

## Summary
Add Brute library and create foundational ECS infrastructure including entity/component CRUD operations and query helpers.

## Background
The current simulation uses monolithic data structures (agent maps, tile maps, job vectors) that are tightly coupled and difficult to extend. Migrating to an Entity-Component-System architecture will improve composability, performance, and enable LOD support.

This phase creates the foundation ECS layer using the [Brute library](https://github.com/markmandel/brute) (185 stars, EPL-1.0 license), which provides battle-tested ECS primitives for Clojure/ClojureScript.

## Specification
See [[spec/ecs-migration-plan.md#phase-1-foundation-ecs-layer-with-brute](spec/ecs-migration-plan.md#phase-1-foundation-ecs-layer-with-brute) for full details.

### Tasks

#### 1. Add Brute Dependency
- [ ] Add `markmandel/brute` to `backend/deps.edn`
- [ ] Update version number (latest stable release)
- [ ] Run `clojure -P` in `/backend` to download dependencies
- [ ] Verify Brute loads correctly in REPL

#### 2. Create ECS Namespace
- [ ] Create `backend/src/fantasia/sim/ecs.clj`
- [ ] Wrap Brute's `create-system` function
- [ ] Implement entity creation: `create-entity!` returns UUID
- [ ] Implement entity deletion: `delete-entity!` removes all components
- [ ] Implement component CRUD: `add-component!`, `get-component`, `remove-component!`
- [ ] Implement query helpers:
  - `get-entities-with-component` (wraps Brute's API)
  - `get-entities-with-all-of` (filter by multiple component types)
  - `get-entities-with-any-of` (union of component sets)
- [ ] Implement system execution: `run-systems!` with ordering

#### 3. Define Component Schemas
- [ ] Document all required components in `ecs.clj` docstring:
  - Position, Velocity, Needs, Inventory, Role, Frontier, Recall
  - Structure, Resource, JobTarget, Container, Passable
  - Vision, Alignment
- [ ] Create validation helper: `valid-component?` checks required fields
- [ ] Define component relationships (e.g., Position + Velocity implies Movement)

#### 4. Create Component Creation Helpers
- [ ] Implement `make-position [q r]`
- [ ] Implement `make-needs [:warmth :food :sleep]`
- [ ] Implement `make-role [:type :title]`
- [ ] Implement `make-frontier {}`
- [ ] Implement `make-recall {}`
- [ ] Implement `make-inventory {}`
- [ ] Implement `make-job-target [job-id priority]`
- [ ] Implement `make-structure [:type :health]`
- [ ] Implement `make-resource [:type :yield :amount]`
- [ ] Implement `make-container [:capacity :contents]`
- [ ] Implement `make-vision [:radius :mode]`
- [ ] Implement `make-alignment [:loyalty :faith :trust]`

### Deliverables
- [ ] Updated `backend/deps.edn` with Brute dependency
- [ ] `backend/src/fantasia/sim/ecs.clj` with full ECS API
- [ ] Component schema documentation in docstrings
- [ ] Unit tests for CRUD operations (create, read, update, delete)
- [ ] Unit tests for query helpers

### Definition of Done
- [ ] Can create entities with multiple components using Brute API
- [ ] Can query entities by single or multiple component types
- [ ] Can execute system functions on world state
- [ ] All unit tests pass
- [ ] Code follows AGENTS.md style guidelines (two-space indentation, pure functions)
- [ ] No existing simulation logic broken (parallel development)

### Story Points
**3 SP** (2-3 days estimated)

- Complexity: Medium - Learning Brute API, designing ECS wrappers
- Risk: Low - Non-breaking, parallel development possible
- Effort: Medium - ~15 helper functions to implement
- Testing: Medium - Comprehensive CRUD and query tests needed

### Related Issues
- #2 - ECS Phase 2: Component Extraction
- #3 - ECS Phase 3: System Implementation

### References
- [Brute Library README](https://github.com/markmandel/brute)
- [ECS Architecture](https://github.com/SanderMertens/flecs/wiki/Quickstart)
- [[spec/ecs-migration-plan.md]]
- [[AGENTS.md]]

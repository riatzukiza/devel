# ECS Migration Issues

---
Type: roadmap
Component: ecs
Priority: high
Status: approved
Related-Issues: [4]
Milestone: 3.5
Estimated-Effort: 18-24 days (30 SP)
---

This directory contains GitHub issues for the Entity-Component-System migration from monolithic data structures to ECS using by Brute library.

## Issues

### Phase 1: Foundation ECS Layer with Brute
**Story Points**: 3 SP
**File**: [001-phase-1-foundation.md](001-phase-1-foundation.md)
**Description**: Add Brute library and create foundational ECS infrastructure including entity/component CRUD operations and query helpers.

**Key Tasks**:
- Add Brute dependency to deps.edn
- Create ECS namespace wrapping Brute APIs
- Define component schemas
- Create component creation helpers (Position, Needs, Role, etc.)

---

### Phase 2: Extract Agent Data to Components
**Story Points**: 5 SP
**File**: [002-phase-2-component-extraction.md](002-phase-2-component-extraction.md)
**Description**: Extract all agent fields from monolithic maps to ECS components using Brute's component system.

**Key Tasks**:
- Extract Position component (replace agent `:pos`)
- Extract Needs component (replace agent `:needs`)
- Extract Role component (replace agent `:role`)
- Extract Inventory component (replace agent `:inventory`)
- Extract Frontier/Recall components
- Extract JobTarget component

---

### Phase 3: Extract Tick Logic to Systems
**Story Points**: 7 SP
**File**: [003-phase-3-systems.md](003-phase-3-systems.md)
**Description**: Extract all tick loop logic into individual, pure ECS systems.

**Key Tasks**:
- Implement MovementSystem
- Implement NeedsDecaySystem
- Implement JobAssignmentSystem
- Implement JobProgressSystem
- Implement PacketBroadcastSystem
- Implement PacketReceiveSystem
- Implement EventGenerationSystem
- Implement EventWitnessSystem
- Implement InstitutionBroadcastSystem
- Implement LedgerUpdateSystem
- Implement TreeSpreadSystem

**System Order**: EventGeneration → EventWitness → NeedsDecay → JobAssignment → Movement → JobProgress → PacketBroadcast → PacketReceive → InstitutionBroadcast → LedgerUpdate → TreeSpread

---

### Phase 4: Migrate World State to Entities
**Story Points**: 4 SP
**File**: [004-phase-4-world-migration.md](004-phase-4-world-migration.md)
**Description**: Migrate all world state collections (tiles, jobs, items, stockpiles) to unified ECS entities.

**Key Tasks**:
- Migrate tiles to entities (Structure, Resource, Passable components)
- Migrate jobs to entities (JobTarget, Position, Progress components)
- Migrate items to entities (Resource, Quantity, ContainerParent components)
- Migrate stockpiles to entities (Container, Resource, Position components)
- Update snapshot generation for component queries

---

### Phase 5: Advanced ECS Features
**Story Points**: 5 SP
**File**: [005-phase-5-advanced-features.md](005-phase-5-advanced-features.md)
**Description**: Implement advanced ECS features including component indexing, system phases, entity templates, serialization, and query DSL.

**Key Tasks**:
- Implement component indexing (spatial, role, job indexes)
- Add system phases (`:pre-update`, `:update`, `:post-update`)
- Implement entity templates (agent templates, structure templates)
- Add serialization support (save/load world state)
- Add query DSL macros (`with-all-of`, `with-any-of`, `where`)

---

### Phase 6: LOD and Tile Loading
**Story Points**: 6 SP
**File**: [006-phase-6-lod.md](006-phase-6-lod.md)
**Description**: Implement tile-based partitioning, loading/unloading, and LOD aggregation to support large worlds with 1000+ entities.

**Key Tasks**:
- Design tile entity partitioning
- Implement tile loading/unloading
- Implement LOD aggregation (full detail ↔ aggregated)
- Update tick loop for tile management
- Implement LOD-aware systems

---

## Summary

### Total Story Points: **30 SP**
- Phase 1: 3 SP (2-3 days)
- Phase 2: 5 SP (3-4 days)
- Phase 3: 7 SP (4-5 days)
- Phase 4: 4 SP (2-3 days)
- Phase 5: 5 SP (3-4 days)
- Phase 6: 6 SP (4-5 days)

**Total Estimated Time**: 18-24 days

### Dependencies
```
Phase 1
  ↓
Phase 2 → Phase 3
  ↓              ↓
Phase 4 ← ← ← ← ← ← ← ←
  ↓
Phase 5 ← ← ← ← ← ← ← ← ← ←
  ↓
Phase 6 ← ← ← ← ← ← ← ← ← ← ← ←
```

### Success Criteria
- All entities accessed via ECS API (Brute-based)
- All tick logic in systems (no monolithic functions)
- Performance within 10% of baseline
- LOD support for 1000+ entities
- Full test coverage
- Documentation updated in AGENTS.md
- Brute dependency successfully integrated

### Related Documentation
- [[spec/ecs-migration-plan.md]] - Full migration specification
- [[AGENTS.md]] - Updated with story point estimation guidelines
- [[backend/src/fantasia/sim/]] - Target codebase
- [[spec/2026-01-15-core-loop.md]] - LOD requirements

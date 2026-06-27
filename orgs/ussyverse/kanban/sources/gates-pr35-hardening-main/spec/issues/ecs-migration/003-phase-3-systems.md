---
title: "[ECS Phase 3] Extract Tick Logic to Systems"
labels: enhancement, ecs, phase-3, story-points:7
assignees: []
---

## Summary
Extract all tick loop logic into individual, pure ECS systems. This separates concerns (movement, needs, jobs, communication, events, etc.) into independent systems that operate on components.

## Background
Currently `tick/tick-once` is a monolithic 80+ line function that handles all simulation updates sequentially. This makes:
- Testing difficult (need to test entire tick or mock heavily)
- Debugging hard (state changes scattered across function)
- Extension slow (must modify core tick function for new behavior)

ECS systems provide:
- Clear separation of concerns
- Testable units (each system is pure)
- Easy extension (add new systems without modifying existing ones)
- Parallel execution potential (independent systems can run concurrently)

## Specification
See [[spec/ecs-migration-plan.md#phase-3-system-implementation-tick-logic](spec/ecs-migration-plan.md#phase-3-system-implementation-tick-logic) for full details.

### Tasks

#### 1. Implement MovementSystem
- [ ] Extract logic from `tick.movement/move-agent-with-job` (line 38)
- [ ] Query entities with Position + Velocity + JobTarget components
- [ ] Apply pathfinding for job targets (reuse existing BFS fallback)
- [ ] Handle random movement for idle agents (no JobTarget)
- [ ] Create `backend/src/fantasia/sim/systems/movement.clj`
- [ ] System is pure (takes world, returns world)
- [ ] Add system to system execution order

#### 2. Implement NeedsDecaySystem
- [ ] Extract from `agents/update-needs` (agents.clj:7)
- [ ] Query entities with Needs component (all agents)
- [ ] Apply cold-snap multiplier from world levers
- [ ] Clamp values 0-1 (reuse `facets/clamp01`)
- [ ] Create `backend/src/fantasia/sim/systems/needs-decay.clj`
- [ ] System is pure

#### 3. Implement JobAssignmentSystem
- [ ] Extract from `jobs/claim-next-job!` (jobs.clj:29)
- [ ] Extract from `jobs/auto-assign-jobs!` (jobs.clj:41)
- [ ] Query idle agents (no JobTarget component)
- [ ] Query pending jobs (no worker-id)
- [ ] Score jobs by priority/distance
- [ ] Assign JobTarget component to selected agent
- [ ] Create `backend/src/fantasia/sim/systems/job-assignment.clj`
- [ ] System is pure

#### 4. Implement JobProgressSystem
- [ ] Extract from `tick.core/process-jobs!` (tick.core:31)
- [ ] Query entities with JobTarget + Position components
- [ ] Check adjacency to job target (Position distance ≤ 1)
- [ ] Calculate progress delta (0.2 if adjacent, 0.0 otherwise)
- [ ] Advance progress, trigger completion if threshold reached
- [ ] Remove JobTarget component on completion
- [ ] Create `backend/src/fantasia/sim/systems/job-progress.clj`
- [ ] System is pure

#### 5. Implement PacketBroadcastSystem
- [ ] Extract from `agents/choose-packet` (agents.clj:17)
- [ ] Query agents with Frontier + Role + Position components
- [ ] Generate packet based on needs/role/location:
  - Low warmth → :warn intent, add :fear facet
  - At trees → add :trees facet
  - Near shrine → add :fire facet
  - Priest → add :judgment facet
- [ ] Include tone data (awe, urgency)
- [ ] Emit broadcast event to packet processing queue
- [ ] Create `backend/src/fantasia/sim/systems/packet-broadcast.clj`
- [ ] System is pure

#### 6. Implement PacketReceiveSystem
- [ ] Extract from `agents/apply-packet-to-listener` (agents.clj:128)
- [ ] Extract interaction pairs from `agents/interactions` (agents.clj:36)
- [ ] Query adjacent agent pairs (Position distance ≤ 1)
- [ ] Apply packet to listener's Frontier component:
  - Decay frontier (0.93 multiplier)
  - Bump fire facet if near shrine
  - Seed facets from packet (0.30 strength)
  - Spread along scaled edges (max 2 hops)
- [ ] Generate mentions/traces via `agents/recall-and-mentions` (agents.clj:77)
- [ ] Create `backend/src/fantasia/sim/systems/packet-receive.clj`
- [ ] System is pure

#### 7. Implement EventGenerationSystem
- [ ] Extract from `events.runtime/generate` (events/runtime.clj:6)
- [ ] Query world state (cold-snap, agent fear levels, tick)
- [ ] Sample event based on probability:
  - 0.015 + (0.015 * cold) + (0.01 * fear) → winter-pyre
  - 0.004 + (0.01 * cold) → lightning-commander
- [ ] Create event entity with Position/Event components
- [ ] Create `backend/src/fantasia/sim/systems/event-generation.clj`
- [ ] System is pure

#### 8. Implement EventWitnessSystem
- [ ] Extract from `events.runtime/apply-to-witness` (events/runtime.clj:52)
- [ ] Query event entities
- [ ] Query agents near event position (Position distance ≤ 4)
- [ ] Update witness Frontier + Recall components:
  - Decay frontier (0.96 multiplier)
  - Seed facets from event signature
  - Spread along scaled edges
- [ ] Generate witness mentions/traces
- [ ] Create `backend/src/fantasia/sim/systems/event-witness.clj`
- [ ] System is pure

#### 9. Implement InstitutionBroadcastSystem
- [ ] Extract from `institutions/broadcasts` (institutions.clj:4)
- [ ] Query institution schedules (broadcast-every tick)
- [ ] Query mouthpiece agent (if set in levers)
- [ ] Generate canonical packets from institutions
- [ ] Apply to all agents (or aligned agents)
- [ ] Create `backend/src/fantasia/sim/systems/institution-broadcast.clj`
- [ ] System is pure

#### 10. Implement LedgerUpdateSystem
- [ ] Extract from `world/update-ledger` (world.clj:38)
- [ ] Process mention queue from all systems
- [ ] Decay buzz (0.90) and tradition (0.995)
- [ ] Add new mentions (weight, log-growth for tradition)
- [ ] Update attribution scores per event type
- [ ] Create `backend/src/fantasia/sim/systems/ledger-update.clj`
- [ ] System is pure

#### 11. Implement TreeSpreadSystem
- [ ] Extract from `trees/spread-trees!` (tick.trees)
- [ ] Extract from `trees/drop-tree-fruits!` (tick.trees)
- [ ] Query Resource components with `:type :tree`
- [ ] Apply spread logic based on tree density
- [ ] Generate fruit at intervals
- [ ] Create `backend/src/fantasia/sim/systems/tree-spread.clj`
- [ ] System is pure

#### 12. Refactor tick/tick-once
- [ ] Replace monolithic tick logic with system orchestration
- [ ] Create system execution order vector
- [ ] Execute systems in dependency order
- [ ] Capture mentions/traces from all systems
- [ ] Update world ledger once at end
- [ ] Generate snapshot after all systems run
- [ ] Preserve existing output format for backward compatibility

### Deliverables
- [ ] `backend/src/fantasia/sim/systems/` directory with 12 system files
- [ ] `systems.clj` or orchestration in `ecs.clj`
- [ ] System execution ordering documentation
- [ ] Refactored `tick/tick-once` (minimal orchestration)
- [ ] System purity tests (same input → same output)
- [ ] Integration tests for full tick

### Definition of Done
- [ ] All tick logic moved to systems
- [ ] `tick/tick-once` orchestrates systems only (no direct world manipulation)
- [ ] Each system is pure (takes world, returns world)
- [ ] Systems execute in correct dependency order
- [ ] Tick output matches baseline behavior (same agent states, ledger, traces)
- [ ] Performance within 10% of original tick time
- [ ] All system tests pass
- [ ] Code follows AGENTS.md style guidelines

### Story Points
**7 SP** (4-5 days estimated)

- Complexity: High - Requires careful state management and ordering
- Risk: Medium - Potential for order dependencies or state bugs
- Effort: High - ~12 systems to implement, plus orchestration
- Testing: Medium - Purity tests + integration tests for full tick

### System Execution Order
Systems must execute in this dependency order:
1. EventGeneration (creates event entities)
2. EventWitness (updates agents from events)
3. NeedsDecay (updates agent stats)
4. JobAssignment (assigns jobs to idle agents)
5. Movement (moves agents toward jobs)
6. JobProgress (advances jobs after movement)
7. PacketBroadcast (creates packets from agents)
8. PacketReceive (applies packets to listeners)
9. InstitutionBroadcast (institution packets to agents)
10. LedgerUpdate (processes all mentions)
11. TreeSpread (environment changes)

### Migration Notes
- This phase maintains the existing tick loop shell
- Systems are added incrementally and tested
- Output format preserved for UI compatibility
- Performance benchmarked at each step to catch regressions

### Related Issues
- #1 - ECS Phase 1: Foundation (must complete first)
- #2 - ECS Phase 2: Component Extraction (must complete first)
- #4 - ECS Phase 4: World State Migration (next phase)

### References
- [[spec/ecs-migration-plan.md]]
- [[backend/src/fantasia/sim/tick/core.clj]]
- [[backend/src/fantasia/sim/agents.clj]]
- [[backend/src/fantasia/sim/jobs.clj]]
- [[backend/src/fantasia/sim/institutions.clj]]
- [[backend/src/fantasia/sim/world.clj]]
- [[backend/src/fantasia/sim/tick/trees.clj]]
- [[backend/src/fantasia/sim/events/runtime.clj]]
- [[AGENTS.md]]

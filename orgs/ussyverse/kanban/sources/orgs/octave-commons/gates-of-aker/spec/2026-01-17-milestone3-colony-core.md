# Milestone 3 — Colony Core (Jobs, Needs, Stockpiles)

---
Type: spec
Component: backend
Priority: high
Status: implemented
Related-Issues: [4]
Milestone: 3
Estimated-Effort: 40 hours
---

## Context
- Roadmap: docs/notes/planning/2026-01-15-roadmap.md (Sprint 3)
- Depends on: Milestone 2 (Walls, Pathing, and Build Ghosts) ✅ Complete
- Issue: TBD

## Problem Statement
Agents can currently be assigned build jobs manually, but there's no:
- Job queue system for automatic assignment
- Item hauling between resources and job sites
- Stockpile zones for storing items
- Need-based behavior (hunger drives eating, sleep drives resting)
- Agent inspection UI showing status

## Proposed Addition

### Phase 1: Backend - Job Queue System

#### 1.1 Job Queue Namespace

Extend `fantasia.sim.jobs`:
- Job states: `:pending`, `:claimed`, `:in-progress`, `:completed`, `:failed`
- Job types: `:build-wall`, `:chop-tree`, `:haul`, `:sleep`, `:eat`
- Job reservation: each job has `:worker-id` or `nil` (unclaimed)
- `(add-job! world job)` - Add to job queue
- `(claim-next-job! world agent-id role)` - Agent claims highest-priority job matching role
- `(auto-assign-jobs! world)` - Assign all available jobs to idle agents

#### 1.2 Job Priority System

Job priorities (higher = more urgent):
- `:eat` - 100 (survival)
- `:sleep` - 90 (survival)
- `:chop-tree` - 60 (resource gathering)
- `:haul` - 50 (logistics)
- `:build-wall` - 40 (construction)

Jobs sort by priority, then distance to agent.

#### 1.3 Tree Chopping Job

New job type `:chop-tree`:
- Requires tree at target position
- Progress 0.0-1.0 (5 ticks to complete)
- On completion: remove `:tree` from tile, add `:wood` item (qty 5) at position
- Agent must be adjacent to work on tree

Files: `backend/src/fantasia/sim/jobs.clj`, `backend/src/fantasia/sim/tick.clj`

### Phase 2: Backend - Stockpile System

#### 2.1 Stockpile Schema

Add to world state:
```clojure
:stockpiles {pos {:resource :wood :max-qty 100 :current-qty 0}}
```

Helpers:
- `(create-stockpile! world pos resource max-qty)` - Create stockpile zone
- `(add-to-stockpile! world pos resource qty)` - Add items to stockpile
- `(take-from-stockpile! world pos resource qty)` - Remove items from stockpile

#### 2.2 Stockpile Zone Visualization

Tiles with stockpiles show in snapshot:
```clojure
{:type "stockpile" :resource :wood :current 5 :max 100}
```

#### 2.3 Stockpile Placement

Add WS op `place_stockpile`:
- Creates stockpile at selected position
- Validates: position has no structure, no stockpile exists

Files: `backend/src/fantasia/sim/jobs.clj`, `backend/src/fantasia/sim/world.clj`, `backend/src/fantasia/server.clj`

### Phase 3: Backend - Hauling System

#### 3.1 Haul Job Logic

New job type `:haul`:
- Job fields: `:from-pos`, `:to-pos`, `:resource`, `:qty`
- Behavior:
  1. Move to `:from-pos`
  2. Pick up items (remove from world, store in agent inventory temporarily)
  3. Move to `:to-pos`
  4. Drop items (add to world/stockpile)

#### 3.2 Agent Inventory

Add to agent schema:
```clojure
{:inventory {:wood 0 :food 0}}
```

Helpers:
- `(pickup-items! world agent-id pos resource qty)`
- `(drop-items! world agent-id pos)`

#### 3.3 Auto-Haul Logic

When items exist on ground and stockpiles have capacity:
- Generate haul jobs automatically
- Target: nearest stockpile with space
- Source: items on ground

Files: `backend/src/fantasia/sim/jobs.clj`, `backend/src/fantasia/sim/agents.clj`

### Phase 4: Backend - Needs-Driven Behavior

#### 4.1 Agent Needs System

Extend agent needs with thresholds:
```clojure
{:needs {:food 0.5 :sleep 0.3 :warmth 0.8}
:need-thresholds {:food-starve 0.0 :food-hungry 0.3 :food-satisfied 0.8
                 :sleep-exhausted 0.0 :sleep-tired 0.3 :sleep-rested 0.8}
```

#### 4.2 Need-Based Job Creation

On each tick, agents check needs:
- If `:food < :food-hungry` → generate `:eat` job (move to food, consume)
- If `:sleep < :sleep-tired` → generate `:sleep` job (move to bed, rest)
- Needs update needs by -0.01 per tick (decay)

#### 4.3 Eat Job

New job type `:eat`:
- Move to position with `:food` item or stockpile
- Consume 1 food
- Update agent `:food` need to 1.0

#### 4.4 Sleep Job

New job type `:sleep`:
- Move to "bed" zone (designated by structure or stockpile)
- Set `:asleep? true` on agent
- No movement while asleep
- Wake after 10 ticks or when need met

Files: `backend/src/fantasia/sim/agents.clj`, `backend/src/fantasia/sim/tick.clj`

### Phase 5: Frontend - Job Queue UI

#### 5.1 Job Queue Panel

Create `JobQueuePanel.tsx`:
- Show list of pending/in-progress jobs
- Each job shows: type, target pos, worker (if claimed), progress
- Color coding by job type

#### 5.2 Stockpile Controls

Update existing controls:
- Add "Place Stockpile" button to BuildControls
- Select resource type for stockpile (wood, food)
- Set max capacity (default 100)

#### 5.3 Agent Inspection UI

Update `AgentCard.tsx`:
- Show current job
- Show inventory (wood, food)
- Show needs (food, sleep, warmth) as progress bars
- Show role (peasant, hauler, builder)

Files: `web/src/components/JobQueuePanel.tsx`, `web/src/components/BuildControls.tsx`, `web/src/components/AgentCard.tsx`

### Phase 6: Frontend - Job Assignment UI

#### 6.1 Manual Job Assignment

Add to cell selection panel:
- When wall-ghost selected: "Assign Build Job" button
- When tree selected: "Assign Chop Job" button
- Shows list of available workers (idle agents)

#### 6.2 Job Assignment WS Ops

Add to backend server:
- `assign_job` op with `:job-type`, `:target-pos`, `:agent-id`
- Creates job and assigns to specific agent

Files: `web/src/App.tsx`, `backend/src/fantasia/server.clj`

### Phase 7: Integration - Needs and Jobs Loop

#### 7.1 Auto-Assign Integration

In `tick.clj`:
- Before moving agents, run `auto-assign-jobs!`
- Idle agents claim jobs based on role/needs
- Need-based jobs (eat, sleep) get priority

#### 7.2 Agent Behavior Update

Update `move-agent-with-job`:
- Agents with needs check if job addresses need
- If no job but need critical → generate need job immediately
- Sleep agents skip movement (stay in place)

#### 7.3 Stockpile Hauling Trigger

After tree chopping or item production:
- Check if items on ground > threshold (e.g., 5)
- If stockpile exists with capacity → generate haul jobs
- Multiple items → multiple haul jobs

Files: `backend/src/fantasia/sim/tick.clj`

## Implementation Order

1. **Phase 1**: Job queue extension (pending, claimed states)
2. **Phase 3**: Hauling system (inventory, haul jobs)
3. **Phase 2**: Stockpile system (creation, storage)
4. **Phase 4**: Needs-driven behavior (eat, sleep jobs)
5. **Phase 1**: Tree chopping job completion
6. **Phase 7**: Auto-assign integration
7. **Phase 5**: Frontend job queue panel
8. **Phase 6**: Frontend job assignment UI
9. **Phase 7**: Complete needs-jobs integration

## Existing Issues / PRs

- Issue TBD: Milestone 3 — Colony Core
- No related PRs exist

## Definition of Done

- Job queue supports multiple job types with priorities
- Auto-assign matches idle workers to available jobs
- Stockpiles can be placed and store items
- Haul jobs move items between sources and stockpiles
- Tree chopping converts trees to wood items
- Agents eat when hungry and sleep when tired
- Frontend shows job queue and agent status
- Manual job assignment via UI works

## Requirements

1. Preserve existing wall/build-ghost behavior from M2
2. Keep performance in check (don't auto-assign every tick for all agents)
3. Agent inventory should persist across job changes
4. Needs decay should be gradual (not starve too fast)
5. Stockpiles should be visualizable (color-coded by resource type)

## Notes

- Role-based assignment (e.g., only builders claim build jobs) can be added later
- For now, any idle agent can claim any job (simple matching)
- Sleep behavior is simplified: agents rest at a designated zone, not individual beds
- Food items need to be added manually or via seed (hunting/farming for later)
- Job queue should be persistent (survives tick boundaries)

## Related Specs

- `2026-01-15-gates-of-aker-roadmap.md` - Sprint 3 overview
- `2026-01-17-milestone2-walls-pathing-build-ghosts.md` - Job system foundation
- `2026-01-15-core-loop.md` - Core simulation loop (for autopilot integration)

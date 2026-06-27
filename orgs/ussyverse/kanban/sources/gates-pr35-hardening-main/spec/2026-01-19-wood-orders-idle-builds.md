---
title: Wood Orders and Idle Builds
type: task
component: backend, frontend
priority: medium
status: in-progress
workflow-state: in-progress
related-issues: []
estimated-effort: TBD
updated_at: 2026-02-10
---

# Wood Orders + Idle Builds

## Context
- Chop jobs should only exist to satisfy wood orders.
- Wood orders exist while stockpiles accept wood (logs) and have space.
- Idle agents can build stockpiles or random structures if no other jobs exist.

## Requirements
- Generate chop-tree jobs only when there is demand for wood/logs.
- Demand is driven by stockpiles that accept wood/logs.
- Idle behavior: when no jobs exist, agents may queue a low-priority build job.
- New job types remain compatible with existing job execution flow.

## Plan
### Phase 1
- Add demand calculation and limit chop job creation.
- Ensure log resources can be hauled to stockpiles.

### Phase 2
- Add idle structure job generation + completion.
- Render/update UI mappings for new job types.

### Phase 3
- Tests and docs notes updates.

## Definition of done
- Chop jobs only spawn while wood/log stockpiles have open capacity.
- Logs can be hauled to stockpiles with threshold 1.
- Idle agents can create a low-priority build job for structures.

## Iteration Evidence (2026-02-10)

- ECS job queue runtime path is now active in `backend/src/fantasia/sim/ecs/tick.clj` via implemented `queue-build-job!` and job processing/assignment system integration.
- Server contract now forwards structured `queue_build` payloads in `backend/src/fantasia/server.clj`, enabling demand-driven job creation inputs.
- Movement completion/path cleanup and job lifecycle behavior were stabilized in:
  - `backend/src/fantasia/sim/ecs/systems/movement.clj`
  - `backend/src/fantasia/sim/ecs/systems/job_processing.clj`
- Validation checkpoint: `cd backend && clojure -X:test` passes (116 tests, 0 failures).

## Iteration Evidence (2026-02-10, continued)

- Added demand-driven chop generation in `backend/src/fantasia/sim/ecs/systems/job_creation.clj`:
  - Computes open wood/log stockpile capacity from `Stockpile` components.
  - Creates `:job/chop-tree` only while capacity demand exists and avoids duplicate tree targets.
- Added idle-build fallback in `backend/src/fantasia/sim/ecs/systems/job_creation.clj`:
  - When there are no active jobs, idle unassigned agents can enqueue a low-priority `:job/build-structure` job.
- Added regression coverage in `backend/test/fantasia/sim/ecs/systems/job_creation_test.clj`:
  - Creates chop jobs for open wood capacity.
  - Suppresses chop jobs when stockpiles are full.
  - Queues low-priority idle build jobs when no active work exists.
- Validation checkpoints:
  - `cd backend && clojure -X:test` passes (119 tests, 430 assertions, 0 failures).
  - `lsp_diagnostics` reports clean for modified files.
  - `cd backend && clojure -X:lint` still reports pre-existing lint errors in unrelated files (for example `src/fantasia/dev/autofix.clj`, `src/fantasia/sim/events.clj`, and `test/fantasia/sim/ecs/comprehensive_test.clj`).

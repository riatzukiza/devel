---
title: Harvest Buildings
type: task
component: backend, frontend
priority: medium
status: review
workflow-state: in_review
related-issues: []
estimated-effort: TBD
updated_at: 2026-02-10
---

# Harvest Buildings

## Context
- Resource harvest buildings (wood, fruit, grain, stone) act as both worker and stockpile.
- Jobs are specific to each building type.
- Deliver-food jobs should be bounded (one per stockpile).

## Requirements
- Add four harvest buildings: lumberyard, orchard, granary, quarry.
- Each building creates/owns jobs to gather its matching resource.
- Buildings act as stockpiles for their resource (raw only).
- Auto-build harvest buildings near campfire when demand exists.
- Deliver-food jobs capped to one per stockpile.

## Plan
### Phase 1
- Add building definitions + stockpile/resource handling for harvest buildings.
- Add job generation bound to building targets.
- Limit deliver-food jobs to stockpile demand (per stockpile).

### Phase 2
- Auto-build harvest buildings when demand exists.
- Update UI render/labels/colors for new structures/jobs.

### Phase 3
- Tests + docs notes.

## Definition of done
- Harvest buildings present and acting as stockpiles.
- Jobs per building target only when demand exists.
- Deliver-food jobs stay bounded to stockpile count.

## Iteration Evidence (2026-02-10)

- Harvest building job wiring added in `backend/src/fantasia/sim/ecs/systems/job_creation.clj`:
  - `:lumberyard -> :job/harvest-wood`
  - `:orchard -> :job/harvest-fruit`
  - `:granary -> :job/harvest-grain`
  - `:quarry -> :job/harvest-stone`
- Build completion effects extended in `backend/src/fantasia/sim/ecs/systems/job_processing.clj`:
  - Completing `:job/build-structure` now sets tile structure at target and attaches a matching stockpile component for harvest structures.
- Added tests in `backend/test/fantasia/sim/ecs/systems/job_processing_test.clj`:
  - Orchard build creates fruit stockpile.
  - Lumberyard/granary/quarry builds create log/grain/stone stockpiles.
- Verification:
  - `cd backend && clojure -X:test` passes (`126 tests`, `448 assertions`, `0 failures`).
  - Sub-agent verification completed (session `ses_3b5362f0cffeI0BYD16kKcGl0m`) confirming auto-build and deliver-food cap behavior.

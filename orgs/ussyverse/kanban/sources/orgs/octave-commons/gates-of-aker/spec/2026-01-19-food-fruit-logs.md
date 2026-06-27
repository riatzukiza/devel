---
title: Food, Fruit, Logs
type: task
component: backend, frontend
priority: medium
status: review
workflow-state: in_review
related-issues: []
estimated-effort: TBD
updated_at: 2026-02-10
---

# Food, Fruit, Logs

## Context
- User report: agents not eating; fruit should be visible and near trees.
- Scope: fruit/log resource updates and initialization scatter. Building/EDN DSL work deferred.

## Requirements
- Fruit exists as its own ground resource and is visible on tiles.
- New worlds guarantee some ground fruit at start, plus existing stockpile.
- Tree fruit drops onto nearby tiles (not only the tree tile).
- Chop-tree jobs replace trees with log drops on nearby tiles.
- Eat jobs target fruit items first, then fruit stockpiles.

## Plan
### Phase 1
- Adjust backend job generation and eat consumption to use fruit items/stockpiles.
- Update tree fruit drop and chop-tree completion to place nearby fruit/log items.
- Scatter initial fruit in `initial-world`.

### Phase 2
- Render fruit/log items in the canvas and add colors.
- Allow fruit stockpile selection in build UI.

### Phase 3
- Update tests and docs notes for the new resource behaviors.

## Definition of done
- Fruit/logs appear on the canvas in the simulation snapshot.
- Agents can eat fruit from the ground or fruit stockpiles.
- New worlds spawn with scattered fruit items and an initial fruit stockpile.
- Chop-tree jobs produce log items instead of wood.
- Tests and docs notes updated for the new resource names.

## Iteration Evidence (2026-02-10)

- Backend food/fruit/log mechanics implemented:
  - `backend/src/fantasia/sim/ecs/systems/job_creation.clj`
    - Adds fruit-targeted `:job/eat` selection (fruit tiles first, then fruit stockpiles).
    - Adds periodic tree-adjacent fruit drops (`generate-tree-fruit-drops`).
  - `backend/src/fantasia/sim/ecs/systems/job_processing.clj`
    - Completes `:job/chop-tree` by clearing tree and scattering `:log` drops on nearby tiles.
    - Completes `:job/eat` by consuming fruit from ground first, then stockpiles.
  - `backend/src/fantasia/sim/ecs/tick.clj`
    - Initial stockpile now configured for fruit.
    - New worlds scatter initial fruit near trees.
    - ECS tile projections now merge into world tiles for visibility in snapshots.
- Tests added/updated:
  - `backend/test/fantasia/sim/ecs/systems/job_processing_test.clj`
    - Validates chop-tree completion log drops.
    - Validates eat from fruit tile.
    - Validates eat fallback to fruit stockpile.
  - `backend/test/fantasia/sim/ecs/systems/job_creation_test.clj`
    - Covers demand-driven chop behavior and idle build generation.
- Verification commands:
  - `cd backend && clojure -X:test` -> pass (`122 tests`, `436 assertions`, `0 failures`, `0 errors`).
  - `lsp_diagnostics` on all modified files -> no errors.
  - Sub-agent verification completed (session `ses_3b53f03d0ffeZ1KBHUmEZqTWbp`) confirming requirement alignment and test evidence.

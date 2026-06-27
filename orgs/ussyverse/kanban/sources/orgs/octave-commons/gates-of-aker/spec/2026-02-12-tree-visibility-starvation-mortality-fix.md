---
title: "Tree Visibility + Starvation Mortality Fix"
status: approved
owner: riatzukiza
created_at: 2026-02-12
updated_at: 2026-02-12
tags: [simulation, starvation, mortality, rendering, ecs]
related_pr:
  repo: octave-commons/gates-of-aker
  branch: feature/tree-visibility-starvation-mortality
  number: 36
  url: https://github.com/octave-commons/gates-of-aker/pull/36
process_ref: docs/reference/process.md
---

## Goal
Fix two player-facing simulation issues in a single reviewable slice:
1) trees should remain visibly recognizable in the map renderer,
2) starving agents should transition to death state instead of stalling at zero food forever.

## Scope
- Seed `DeathState` for all created agents.
- Ensure mortality processing evaluates living agents reliably and updates `AgentStatus` when death occurs.
- Pass simulation `tick` into mortality processing so `DeathState :death-tick` and death memory timestamps are populated.
- Prevent mortality cleanup from returning nil world when no job assignment exists.
- Normalize tile resource payload values (`:tree`, `":tree"`) to plain strings (`"tree"`) before snapshot broadcast.

## Acceptance Criteria
- New agents include `DeathState` with `alive? = true`.
- Agent with `food <= 0.15` is marked dead by mortality process and receives `cause-of-death :starvation`.
- Mortality processing returns non-nil world even for starved agents without job assignment.
- Tile resources in snapshots are normalized to plain strings consumed by renderer checks.
- Backend tests pass, targeted frontend tests pass, and frontend build succeeds.

## Verification Evidence
- Backend tests: `cd backend && clojure -X:test`
- Frontend tests: `cd web && npm test -- src/__tests__/ws.test.ts src/components/__tests__/SimulationCanvas.test.tsx`
- Frontend build: `cd web && npm run build`

## Review Evidence
- CodeRabbit explicit closure (no remaining issues):
  - `https://github.com/octave-commons/gates-of-aker/pull/36#issuecomment-3888339811`
  - `https://github.com/octave-commons/gates-of-aker/pull/36#issuecomment-3888340871`
- Follow-up patch applied from review:
  - `backend/src/fantasia/sim/ecs/systems/mortality.clj`
  - `backend/src/fantasia/sim/ecs/tick.clj`
  - `backend/test/fantasia/sim/ecs/systems/mortality_test.clj`

## FSM Note (`docs/reference/process.md`)
- This slice is bounded at LoE <= 5 and moved through implementation with explicit verification evidence.
- State progression completed for this slice: `In Review -> Testing -> Document` with review/test evidence captured.
- User requested review closure requirement met via explicit CodeRabbit confirmation on PR #36.

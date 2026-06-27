# Simulation stalls after first tick

## Context
The simulation advances to the first tick but does not progress beyond it. We need to identify whether the stall is in the backend tick loop, WebSocket delivery, or the UI state handling, and fix the underlying cause.

## Relevant files
- `backend/src/fantasia/sim/tick/core.clj`:40-207 (tick loop and state update)
- `backend/src/fantasia/sim/tick/initial.clj`:188-295 (initial world state and seed reset)
- `backend/src/fantasia/server.clj`:88-137, 216-238 (runner loop and WS tick handling)
- `web/src/App.tsx`:303-407, 411-468 (WS message handling and initialization)

## Existing issues / PRs
- Issues checked: #26, #25, #24, #22, #21, #20, #19, #18, #16, #14 (none mention tick stalling)
- PRs checked: none listed

## Requirements
- Reproduce with `/sim/tick` and/or WS tick controls; capture any backend exception/log output.
- Identify the code path halting tick progression (runner loop, tick-once, or UI state resets).
- Implement a targeted fix; avoid broader refactors.
- Add or update tests for any backend defect fix.
- Document behavior change in `/docs/notes` if logic changes.

## Definition of done
- Ticks advance beyond 1 via WS and `/sim/tick` without errors.
- Runner (`start_run`) continues to emit tick updates over time.
- Any new tests pass and cover the regression.

## Plan
### Phase 1: Repro and diagnostics
- Capture backend logs for the first tick and subsequent attempts.
- Validate `/sim/tick` responses for increasing tick values.
- Confirm WebSocket messages (`tick`, `runner_state`) arrive without errors.

### Phase 2: Fix
- Patch the failing backend or UI logic identified in phase 1.
- Ensure state updates are persisted and broadcasts continue.

### Phase 3: Verification
- Run targeted backend tests (or add a new one) if server logic changes.
- Manually verify multi-tick progression in the UI.

## Notes
- Root cause: `update-needs` called `rand-nth` with two args, throwing on tick 1 and halting the runner.
- Fix: use `rand-nth` with a single collection argument.

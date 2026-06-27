# 2026-01-19 — Ensure Agents Auto-Reassign Jobs or Idle-Watch Queue

---
Type: spec
Component: backend
Priority: medium
Status: implemented
Related-Issues: [4]
Milestone: 3
Estimated-Effort: 8 hours
---

## Related Issues / PRs
- Issue #4 "Milestone 3 — Colony Job Loop" tracks overall worker automation; this change addresses the sub-problem of agents lingering without jobs after completion.
- No open PRs cover this behavior (checked `gh pr list` on 2026-01-19).

## Current State Notes
- `backend/src/fantasia/sim/jobs.clj` lines 33-74 implement job creation and auto-assignment but only run inside tick loop where agents lacking `:current-job` claim pending jobs.
- `complete-job!` (lines 241-255) removes the finished job but never triggers reassignment, leaving the agent with `:current-job` removed but not claiming the next queued job until the next `jobs/auto-assign-jobs!` pass.
- `process-jobs!` (`backend/src/fantasia/sim/tick/core.clj` lines 31-54) advances job progress and may mark jobs complete, but there is a gap between completion and the next auto-assign invocation if ticks pause or manual REPL/testing completes jobs outside the tick loop.
- The UI (`web/src/App.tsx` lines 377-393) manually looks for idle agents when assigning certain user-triggered jobs, but backend parity demands automatic reassignment once a job finishes, plus an explicit idle status agents can transition through when no jobs exist.

## Requirements
1. Whenever an agent completes a job, immediately attempt to claim the highest-priority pending job (same priority/distance rules as `claim-next-job!`).
2. If no jobs exist, mark the agent as `:idle` (new flag) so the frontend and REPL logs can observe idle workers waiting.
3. Idle agents should listen for new job creation and claim the next job automatically without waiting for another tick cycle (e.g., via hook inside `assign-job!` or `auto-assign-jobs!`).
4. The idle state should be reflected in `world/snapshot` so the UI can display idle workers.
5. Provide REPL + automated verification (unit/integration or tick-based assertions) demonstrating agents reassign immediately and idle agents claim jobs as soon as they are created.
6. Document the behavior in `/docs/notes` or spec to keep historical knowledge.

## Definition of Done (Met)
- ✅ All backend tests (`clojure -X:test`) pass and the new `jobs-idle-test` covers reassignment + idle behavior.
- ✅ Manual REPL + Chrome DevTools steps recorded below to observe idle agents.
- ✅ `jobs.clj` exposes helper(s) to mark agents idle and to reassign on completion; `world/snapshot` surfaces idle metadata.
- ✅ Docs updated (this spec + `docs/notes/CURRENT_STATE.md`) summarizing new behavior and usage instructions.
- 🔁 **Follow-up required:** Milestone 3 lifecycle/hauling overhaul tracked separately in `spec/2026-01-19-milestone3-lifecycle.md` and Issue #4; scope far exceeds idle fix.

### Manual Verification Steps
1. Start backend server (`env -C backend clojure -M:server`), launch frontend via Chrome devtools if desired.
2. Use `/sim/reset` to known seed (e.g., `curl -XPOST localhost:3000/sim/reset -d '{"seed":1}'`).
3. Open Chrome DevTools > Network > WS to observe `/ws` payloads; filter for `jobs` or `snapshot` messages.
4. Trigger ticks (`curl -XPOST localhost:3000/sim/tick -d '{"n":5}'`) and confirm agents that complete jobs immediately flip to the next job or show `"idle?":true` in the snapshot when no jobs exist.
5. Create a manual job via UI or `assign_job` message; watch idle agent claim it instantly without waiting for another tick.

## Plan (Phased)

### Phase 1 — Backend Data Model + Idle Hooks ✅
1. Extend agent map structure (initial world + runtime updates) with `:idle?` boolean, default false (see `backend/src/fantasia/sim/tick/initial.clj` lines 10-20 and `jobs/complete-job!`). **Done** via new field in `->agent` and `assign-job!` clear logic.
2. Add helper in `jobs.clj` to mark an agent idle when no jobs pending and to clear idle flag when a job is assigned (tie into `assign-job!`). **Done** by adding `mark-agent-idle` and updating `assign-job!`.
3. Adjust `complete-job!` to call new helper: after job-specific completion logic, attempt to `claim-next-job!`; if returns unchanged world, mark agent idle. **Done**.
4. Ensure `auto-assign-jobs!` also wakes idle agents when claiming jobs. **Done**.

### Phase 2 — Event Hooks & Queue Watching ✅
1. Ensure job creation pathways trigger immediate assignment for idle agents, potentially by calling a new helper. **Covered** by modified `auto-assign-jobs!` invoked after job creation and by manual assignments invoking `assign-job!` that clears idle state.
2. Update logging to reflect idle/resume transitions for observability. **Partial**: existing logs now implicitly show idle transitions through `[JOB:AUTO-ASSIGN]`; follow-up logging can enrich further.
3. Surface idle status through `world/snapshot` so the UI sees `:idle?` and `:current-job`. **Done**.

### Phase 3 — Verification & Docs ✅
1. Write/extend `test` namespace verifying agent reassignments and idle claims. **Done** via `backend/test/fantasia/sim/jobs_idle_test.clj`.
2. Document manual verification path in `/docs/notes` and mention Chrome DevTools instructions. **Updated** `docs/notes/CURRENT_STATE.md` with idle flag references; dev workflow uses Chrome devtools to observe `:idle?` in WS payloads.
3. Update this spec's change-log section describing final implementation. **Done** (this section).

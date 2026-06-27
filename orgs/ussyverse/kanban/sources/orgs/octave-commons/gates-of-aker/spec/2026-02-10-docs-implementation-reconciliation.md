---
title: Docs vs Implementation Reconciliation
type: review
component: docs, backend, testing
priority: high
status: document
workflow-state: document
related-issues: []
owner: opencode-agent
created-at: 2026-02-10
updated-at: 2026-02-10
updated_at: 2026-02-10
tags: [docs, reconciliation, backend, tests]
---

# 2026-02-10 Docs/Implementation Reconciliation

## Scope and evidence method

- Scope: reconcile migrated canonical docs (`docs/design/**`, selected `docs/planning/**`, `docs/decisions/**`) against current backend implementation and tests under `backend/src/fantasia/**` and `backend/test/fantasia/**`.
- Out of scope: implementing fixes, renaming runtime namespaces, and changing backend/frontend behavior in this phase.
- Method:
  - Read canonical design and planning specs for concrete behavioral claims.
  - Read current implementation anchors: `backend/src/fantasia/sim/ecs/tick.clj`, `backend/src/fantasia/server.clj`, `backend/src/fantasia/sim/hex.clj`.
  - Read current test anchors: `backend/test/fantasia/sim/ecs/tick_test.clj`, `backend/test/fantasia/server/network_test.clj`, `backend/test/fantasia/network_test.clj`.
  - Use conservative reconciliation: only mark a mismatch when both doc claim and implementation/test evidence are explicit.

## Verified facts

- `fantasia.sim.ecs.tick/create-ecs-initial-world` initializes ECS/global state with keys like `:seed`, `:tree-density`, `:map`, `:jobs`, `:items`, `:stockpiles`, `:ledger`, `:recent-events`, `:traces`, `:calendar`, and `:institutions` (`backend/src/fantasia/sim/ecs/tick.clj:124`).
- `fantasia.sim.ecs.tick` still contains explicit stubs/no-op placeholders for several world mutation APIs (for example `place-wall-ghost!`, `queue-build-job!`, `place-stockpile!`, `place-warehouse!`) (`backend/src/fantasia/sim/ecs/tick.clj:261`, `backend/src/fantasia/sim/ecs/tick.clj:297`).
- WebSocket `"queue_build"` handling calls `sim/queue-build-job!` with only `structure`, while validating `(and structure (:pos msg))` and parsing optional stockpile payload (`backend/src/fantasia/server.clj:308`).
- HTTP `POST /sim/reset` parses `seed`/`tree_density` but calls `sim/reset-world!` without forwarding parsed options (`backend/src/fantasia/server.clj:73`).
- Test coverage currently includes existence checks for stub APIs rather than behavior checks (for example `is (fn? tick/place-wall-ghost!)`) (`backend/test/fantasia/sim/ecs/tick_test.clj:77`).
- Only `fantasia.sim.hex` exists among the explicitly named design modules; no `fantasia.sim.cards`, `fantasia.sim.aker`, `fantasia.sim.factions`, or `fantasia.sim.drama` namespace was found in `backend/src/fantasia/sim/**`.

## Assumptions and hypotheses (inferred, not verified)

- Some documents under `docs/design/**` appear to include pseudocode/proposal content; placement in canonical design means they are authoritative for intent, but not necessarily "already implemented".
- Some planning specs may have stale status metadata relative to current code state; mismatches below treat code as current truth and docs as expectation.
- Workspace-level build/test failures reported in inherited notes are treated as environment context and were not used to assert implementation mismatches in this document.

## Mismatch table (evidence-backed)

| ID | Mismatch | Doc reference | Implementation/test reference | Priority | Next action |
|---|---|---|---|---|---|
| M1 | World schema keys for day/night champion + faction/card/event pipeline are documented but not present in current ECS world initialization shape. | `docs/design/2026-01-15-world-schema.md:44`, `docs/design/2026-01-15-world-schema.md:77`, `docs/design/2026-01-15-world-schema.md:93` | `backend/src/fantasia/sim/ecs/tick.clj:124`, `backend/src/fantasia/sim/ecs/tick.clj:142` | High | Define a canonical world-state contract (required keys, optional keys, migration notes), then add schema-level assertions/tests for it. |
| M2 | Night boundary card/event pipeline is specified with dedicated modules, but those modules are absent and tick orchestration does not invoke that flow. | `docs/design/2026-01-15-sim-modules.md:253`, `docs/design/2026-01-15-aker-boundry-control-flow.md:446`, `docs/planning/spec/2026-01-15-core-loop.md:84` | `backend/src/fantasia/sim/ecs/tick.clj:25`, `backend/src/fantasia/sim/ecs/tick.clj:39`, `backend/src/fantasia/sim/hex.clj:1` (only one of the named modules exists), `backend/test` search has no `run-night-cards`/`night-boundary` coverage | High | Create a scoped implementation plan for the night boundary slice (modules, entrypoint wiring, minimal acceptance tests) and mark docs as planned until delivered. |
| M3 | Build/placement ops are documented as working milestone behavior, but key backend APIs remain stubs and tests only assert function existence. | `docs/planning/spec/2026-01-17-milestone2-walls-pathing-build-ghosts.md:199`, `docs/planning/spec/2026-01-17-milestone2-walls-pathing-build-ghosts.md:200`, `docs/planning/backend-issues/SECURITY-001-input-validation.md:182` | `backend/src/fantasia/sim/ecs/tick.clj:261`, `backend/src/fantasia/sim/ecs/tick.clj:265`, `backend/src/fantasia/sim/ecs/tick.clj:297`, `backend/test/fantasia/sim/ecs/tick_test.clj:77` | High | Reconcile status first: either implement minimum behavior for advertised ops or downgrade docs/spec status to planned/partial with explicit gaps. |
| M4 | `queue_build` payload contract includes `pos` and optional stockpile details, but server currently forwards only structure to simulation API. | `docs/planning/backend-issues/SECURITY-001-input-validation.md:182` | `backend/src/fantasia/server.clj:308`, `backend/src/fantasia/server.clj:312`, `backend/src/fantasia/sim/ecs/tick.clj:297` | Medium | Align contract and call-site: define `queue-build-job!` argument shape, update server forwarding, and add regression test for payload propagation. |
| M5 | HTTP integration contract expects `/sim/reset` payload propagation into `reset-world!`, but route currently ignores parsed opts at call-site. | `docs/planning/spec/2026-01-15-backend-integration-tests.md:20` | `backend/src/fantasia/server.clj:75`, `backend/src/fantasia/server.clj:78`, `backend/test/fantasia/server/network_test.clj:1` | Medium | Decide desired `/sim/reset` contract and either pass parsed opts into `sim/reset-world!` or update docs to reflect current behavior; then add server route integration test. |

## Prioritized follow-up backlog

### P0 (high impact, unblock design/implementation truth)

1. World contract reconciliation
   - Scope: backend sim contract only.
   - Deliverable: one canonical world-shape doc + executable contract test against `create-ecs-initial-world` snapshot keys.
   - Resolves: M1.

2. Night boundary vertical slice (minimal)
   - Scope: backend-only thin slice from tick boundary to event candidate queue.
   - Deliverable: initial module set + one integration path + tests for deterministic card/event progression.
   - Resolves: M2.

3. Build ops truth alignment
   - Scope: `place_wall_ghost`, `queue_build`, and related stockpile/build hooks.
   - Deliverable: either real implementation parity with spec claims or doc status downgrade with explicit TODO ledger.
   - Resolves: M3, M4.

### P1 (contract hardening)

4. Reset endpoint contract test
   - Scope: `POST /sim/reset` only.
   - Deliverable: integration tests asserting payload passthrough semantics and response invariants.
   - Resolves: M5.

5. Server/ws contract matrix
   - Scope: ops currently exposed by server handler.
   - Deliverable: table-driven tests for op payload validation and state mutation side effects.
   - Resolves: M3, M4, M5.

### P2 (documentation hygiene and anti-drift)

6. Canonical-vs-proposal tagging pass
   - Scope: `docs/design/**` and `docs/planning/spec/**` files touching simulation contracts.
   - Deliverable: normalized status labels (`implemented`, `planned`, `proposed`) and a single backlog index linking to code/test evidence.
   - Purpose: reduce recurrence of status drift identified in M1-M5.

## Guardrail reminders (this phase)

- No backend/frontend source or test fixes were performed in this task.
- No namespace/path rename from `fantasia` to `gates-of-aker` was performed; this remains deferred per ADR (`docs/decisions/0003-terminology-policy-and-deferred-code-rename.md:13`).
- This document records evidence and follow-up scope only; implementation changes must be tracked in separate tasks.

## Risk notes and regression-prevention notes

- Risk: docs continue to assert implemented behavior where only stubs exist, causing false confidence for future tasks.
  - Prevention: require each implementation-status claim to link one doc path and one code/test path.
- Risk: API drift between server routes/ws ops and simulation call signatures.
  - Prevention: add route/op integration tests that assert argument propagation and payload shape.
- Risk: accidental namespace migration during reconciliation follow-ups.
  - Prevention: keep ADR-0003 guardrail checks in each follow-up task acceptance criteria.

## 2026-02-10 iteration update (ECS runtime follow-up)

- Updated backend ECS/runtime to replace previously documented stubs for key world mutation ops in `backend/src/fantasia/sim/ecs/tick.clj`.
- Updated WS/HTTP contract wiring in `backend/src/fantasia/server.clj` so `queue_build` forwards structured payload and `/sim/reset` forwards parsed options.
- Fixed movement path completion behavior in `backend/src/fantasia/sim/ecs/systems/movement.clj` and aligned job system namespaces/usages in:
  - `backend/src/fantasia/sim/ecs/systems/job_creation.clj`
  - `backend/src/fantasia/sim/ecs/systems/job_processing.clj`
  - `backend/src/fantasia/sim/ecs/tick.clj`
  - `backend/test/fantasia/sim/ecs/systems/job_creation_test.clj`
  - `backend/test/fantasia/sim/ecs/systems/job_processing_test.clj`
- Verification checkpoint: `cd backend && clojure -X:test` passes (116 tests, 0 failures, 0 errors).

### Reconciliation delta against M3-M5

- M3 (build/placement stubs): partially resolved by implementing previously stubbed ECS runtime ops.
- M4 (`queue_build` payload propagation): resolved at server call-site by forwarding structured payload to simulation.
- M5 (`/sim/reset` payload passthrough): resolved at route call-site by forwarding parsed request values into `sim/reset-world!`.

### Remaining follow-up

- Add explicit integration assertions for `assign_job` validation/error-path behavior and contract-level WS response payloads.
- Re-run and reconcile lint findings once pre-existing repo-wide lint debt is triaged.

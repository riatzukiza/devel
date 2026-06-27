# Spec: Backend Baseline Tests

## Prompt
User asked to add tests covering currently extant behavior so the core prototype gains regression protection.

## Key Code References
- `backend/src/fantasia/sim/core.clj:18-111` — initial world builder plus packet generation logic.
- `backend/src/fantasia/sim/core.clj:120-215` — lever-driven edge scaling, recall scoring, and application pipelines.
- `backend/src/fantasia/sim/core.clj:217-241` — institution broadcast scheduling and packet application.
- `backend/src/fantasia/sim/myth.clj:3-41` — ledger decay, mention accumulation, and attribution math.

## Existing Issues / PRs
- None referenced.

## Definition of Done
1. Backend test harness exists (deps alias + runner command) and executes via `clojure -X:test` or documented equivalent.
2. Unit tests cover deterministic behaviors already implemented: world seeding invariants, lever-dependent edge scaling, packet intent/facet selection, institution broadcast cadence/mouthpiece routing, and ledger math.
3. Tests run cleanly in CI/local (document command in summary) and exercise at least one path for mentions/ledger updates.
4. No behavior changes unless directly required to make code testable; any helper functions introduced remain pure/deterministic.

## Requirements & Notes
- Keep tests under `backend/test/` mirroring namespace structure.
- Prefer `clojure.test`; favor data-focused assertions over brittle floating-point equality (use `is (<= (Math/abs (- x y)) eps)` when needed).
- Use controlled worlds (fixed seeds, explicit trees/shrines) to guarantee deterministic outcomes.
- Cover `myth/add-mention` + `myth/attribution` interplay so prestige/ledger math remains stable.
- Treat packet + broadcast tests as verifying shape, not exhaustive randomness; focus on extant deterministic rules (priest intent, claim hints, mouthpiece selection).

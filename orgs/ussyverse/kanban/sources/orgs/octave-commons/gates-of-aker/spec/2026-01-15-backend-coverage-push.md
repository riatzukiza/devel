# Backend Coverage Push — 2026-01-15

## Objective
Increase backend regression coverage by adding focused unit tests for `fantasia.server` utility helpers and `fantasia.sim.tick` state mutators. These additions should lift coverage for key HTTP helpers and mutable world controls, ensuring that serialization, parsing, and atom updates are protected against regressions.

## Existing Issues / PRs
- `gh issue list -L 20` — no open issues reported on 2026-01-15.
- `gh pr list -L 20` — no open PRs reported on 2026-01-15.

## Code References
- `backend/src/fantasia/server.clj:10` — `json-resp`, `read-json-body`, websocket helpers, runner orchestration, and the Ring router that delegates to sim tick functions.
- `backend/src/fantasia/sim/tick.clj:35` — global `*state` atom plus helpers `reset-world!`, `set-levers!`, `place-shrine!`, `appoint-mouthpiece!`, and `tick!`.
- Existing tests: `backend/test/fantasia/server_test.clj`, `backend/test/fantasia/sim/core_test.clj`, etc.

## Requirements
1. Add unit tests covering `json-resp` and `read-json-body`, including blank-body and malformed JSON scenarios, to lock header structure and keywordization.
2. Add tests for `set-levers!`, `place-shrine!`, and `appoint-mouthpiece!` (via `fantasia.sim.tick`), ensuring they merge or set state correctly without mutating unrelated keys. Use `with-redefs` to isolate `*state`.
3. Add a regression test for `tick!/tick-once` ensuring snapshots reflect ledger/levers updates (e.g., `tick!` returns `n` outputs, advances tick counter, and keeps `recent-events` bounded) or at minimum verifying `tick!` resets after `reset-world!`.
4. Ensure all tests run via `env -C backend clojure -X:test` and update coverage numbers via `env -C backend clojure -M:coverage`.

## Definition of Done
- New test namespaces exercising `fantasia.server` helpers and `fantasia.sim.tick` mutators exist under `backend/test`.
- `json-resp` and `read-json-body` behavior locked via tests (happy path + error/blank cases).
- Tests for `set-levers!`, `place-shrine!`, `appoint-mouthpiece!`, and `tick!` verifying state transitions succeed deterministically.
- `clojure -X:test` and `clojure -M:coverage` both succeed, with qualitative coverage increase on the touched namespaces.
- This spec documents scope, plan, and commands for future reference.

## Plan
### Phase 1 — Server Helper Tests
- Create `backend/test/fantasia/server_helpers_test.clj` (or augment existing server suite) to cover `json-resp` and `read-json-body` (including blank/malformed payloads). Use `java.io.ByteArrayInputStream` for request bodies.
- Validation: `clojure -X:test` to confirm new tests pass.

### Phase 2 — Tick State Tests
- Add `backend/test/fantasia/sim/tick_test.clj` covering `set-levers!`, `place-shrine!`, `appoint-mouthpiece!`, and `tick!` behaviors using a temporary atom for `*state` via `with-redefs`.
- Validation: `clojure -X:test` again, ensuring deterministic mutations.

### Phase 3 — Coverage Verification
- Re-run `clojure -M:coverage` to capture updated metrics and confirm instrumentation handles new namespaces.
- Validation artifact: `backend/target/coverage/index.html`.

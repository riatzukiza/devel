# Backend Integration Tests — 2026-01-15

## Objective
Add HTTP-level integration coverage for `fantasia.server/app` so REST endpoints stay stable. Focus on ensuring JSON parsing, parameter coercion, and responses (including headers) match contract and that server routes correctly invoke `fantasia.sim.tick` APIs.

## Existing Issues / PRs
- `gh issue list -L 20` — no entries returned on 2026-01-15.
- `gh pr list -L 20` — no entries returned on 2026-01-15.

## Code References
- `backend/src/fantasia/server.clj:10` — `json-resp`, `read-json-body`, websocket handler, runner controls, and ring router.
- `backend/src/fantasia/sim/tick.clj:35` — global world atom and mutating helpers used by server endpoints.
- Existing tests live under `backend/test/fantasia/sim/*.clj`; there is currently no coverage for `fantasia.server`.

## Requirements
1. Add Ring mock tooling (e.g., `ring/ring-mock`) scoped to tests so integration specs can call `app` with crafted HTTP requests.
2. Write new tests verifying:
   - `GET /healthz` returns 200 and baseline JSON headers/body.
   - `GET /sim/state` proxies `sim/get-state`.
   - `POST /sim/reset` parses JSON, calls `sim/reset-world!` with keywordized payloads, and returns `{:ok true :seed ...}`.
   - `POST /sim/tick` forwards `:n` to `sim/tick!` and returns a serialized `:last` payload.
   - `POST /sim/run` and `/sim/pause` flip runner flags (through server fns) and respond with the documented `:running` booleans.
3. Keep tests deterministic by redefining sim functions (`with-redefs`) to use atoms/fakes rather than mutating the real world state.
4. Ensure the suite still passes via `env -C backend clojure -X:test` after the new tests and dependency tweaks.

## Definition of Done
- `ring-mock` (or equivalent) dependency available in test context without bloating production build.
- New `backend/test/fantasia/server_test.clj` exercises the endpoints listed above, covering both success bodies and argument propagation.
- `clojure -X:test` passes cleanly, proving the integration spec works alongside existing suites.
- Spec updated (this file) and referenced in future PR/commit notes.

## Plan
### Phase 1 — Research & Planning
- Inspect `fantasia.server` and `fantasia.sim.tick` to understand API surface and mutating behaviors.
- Capture requirements here, including how to stub stateful helpers safely.
- Validation: no code executed; repository must remain buildable/testable.

### Phase 2 — Tooling Setup
- Add `ring/ring-mock` to the `:test` alias’ `:extra-deps` inside `backend/deps.edn` so test namespaces can build mock requests.
- Validate by re-resolving deps (implicit when running tests) or running `clojure -P -M:test` if needed.
- After this phase, the project should still compile and existing tests should pass.

### Phase 3 — Implement Integration Tests
- Create `backend/test/fantasia/server_test.clj` covering the endpoints listed above, using `ring.mock.request` and `with-redefs` to observe interactions.
- Ensure tests assert headers/body structure plus correct invocation counts via atoms.
- Run `env -C backend clojure -X:test` to verify everything passes.

### Phase 4 — Review & Documentation
- Summarize results (test counts, notable behaviors) back to user and ensure spec reflects final state (done inline here).
- No code changes beyond tests/deps; repo remains green.

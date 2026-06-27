# Spec: Compose-backed E2E Tests (2026-01-16)

---
Type: spec
Component: testing
Priority: medium
Status: proposed
Estimated-Effort: 24 hours
---

## Code References
- `compose.yaml` defines `backend` + `web` services (clojure + node) sharing source mounts.
- `backend/src/fantasia/server.clj:141-159` exposes HTTP + WS endpoints on port 3000.
- `web/src/ws.ts` + `App.tsx` document the UI’s WebSocket contract (ops: `tick`, `trace`, etc.).
- `web/package.json` already contains Vitest scripts; we can add a new `test:e2e` entry or a dedicated runner.
- `README.md` "Docker Compose" section explains how to bring the stack up; e2e automation should reuse those commands.

## Existing Issues / PRs
- No open issues tagged "docker" or "e2e" per `gh issue list --search "docker"` (2026-01-16) and `gh issue list --search "e2e"` (empty).
- No PRs in-flight targeting Compose or integration testing flows.

## Requirements
1. Provide automation (script or npm task) that builds + starts the Compose stack. Prefer `docker compose up --build` with `--wait` once supported; otherwise, implement a simple readiness poll.
2. Add an e2e test suite (likely Node/TypeScript) that:
   - Waits for backend HTTP readiness (poll `http://localhost:3000/health` or `/sim/reset` once endpoints exist) and Vite hosting `http://localhost:5173`.
   - Exercises a meaningful user flow: e.g., connect via WebSocket, issue `tick` and `reset`, ensure responses arrive.
   - Optionally uses Playwright to drive the UI if necessary; start smaller with API-level tests if UI automation is heavy.
3. Document how to run the e2e tests (commands, prerequisites) in README and `docs/notes`.
4. Ensure cleanup: bring down Compose services after tests (`docker compose down -v`).
5. Keep runtime deterministic; pass a `SEED` env var or use fixed lever adjustments so assertions remain stable.

## Definition of Done
- New script/command `npm run test:e2e` (or similar) that:
  1. Starts Compose stack (in background or separate terminal).
  2. Runs the e2e test suite.
  3. Tears down Compose services.
- E2E tests connect to the running backend (WebSocket `ws://localhost:3000/ws`) and verify at least one tick cycle + UI behavior (if feasible).
- README updated with the new command; `docs/notes` captures verification steps.
- Compose + e2e toolchain documented in the spec for future agents.

## Plan
### Phase 1 – Readiness & Tooling
- Decide on test harness: Playwright for UI, or Node+WS for backend-level flow.
- Add helper `scripts/compose-up.sh` or npm scripts to run `docker compose up -d` and `docker compose down`.
- Possibly add `backend` health endpoint for readiness; otherwise rely on `/sim/reset` success.

### Phase 2 – Test Implementation
- Implement e2e tests (TypeScript or JS) using Playwright or plain WS clients (via `ws` npm package):
  - Connect to `ws://localhost:3000/ws`.
  - Send `tick` and verify `tick` op response increments.
  - Optionally call HTTP endpoints for `reset` or `tick` to confirm JSON API works.
- Include simple HTTP poller to wait until Compose services respond.

### Phase 3 – Automation Wrappers
- Add npm scripts: `"compose:up": "docker compose up --build -d"`, `"compose:down": "docker compose down"`, `"test:e2e": "npm run compose:up && node e2e/run-tests && npm run compose:down"` (with `finally` semantics via `npm-run-all` or a Node wrapper).
- Ensure tests fail fast if Docker not available (clear error).

### Phase 4 – Documentation & Notes
- README: add "E2E Tests" section referencing Compose commands + test runner.
- `docs/notes/YYYY...` entry logging verification steps (ports, sample output).

## Notes
- Keep e2e dependencies minimal; avoid Playwright unless UI automation becomes necessary.
- Leverage the existing WebSocket protocol to avoid pulling in heavy browser automation initially.
- For long-running Compose stacks, consider `docker compose up -d` + `npm run test:e2e` + `docker compose down` to keep test CLI responsive.

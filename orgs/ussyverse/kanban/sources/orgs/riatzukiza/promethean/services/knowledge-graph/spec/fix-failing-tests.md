# Fix failing knowledge-graph test suite

## Code references

- src/cli.ts:126-308 — CLI command handling (export, mermaid, database init).
- tests/cli-export.test.ts:15-53 — export CLI mock setup missing Database stub and output path creation.
- tests/cli-mermaid.test.ts:12-55 — mermaid CLI mock hoisting issues around generateMermaid reference.
- packages/knowledge-graph-storage/src/index.ts:1-22 and database/database.ts:1-341 — top-level export pulls in node:sqlite causing Vitest load error for MemoryDatabase test.
- packages/knowledge-graph-storage/src/database/memory-database.ts:21-304 — in-memory adapter used by tests.
- packages/knowledge-graph-simulation/src/session-manager.ts:44-221 — resolveRunnerCommand currently anchored to package dir instead of cwd, breaking temp runner expectations.
- tests/simulation-session-manager.test.ts:48-121 — expects dist/src runner resolution under temp cwd and specific spawn args/env.
- src/graphql-server.ts:71-430 — Graph/graphDelta resolvers wire repository and AgentEntityStore mocks.
- tests/graphql-server.test.ts:29-163 — repo and delta mocks not wired to current imports; frame expected 1, nodes array accessed.
- src/http-server.ts:25-289 — HTTP graph/simulation endpoints rely on AgentEntityStore and simulationManager.
- tests/http-server.test.ts:7-179 — mocks expect AgentEntityStore to supply graph snapshot/delta and simulationManager CRUD to be used.

## Existing issues/PRs

- Not reviewed in this session.

## Definition of done

- All Vitest suites under services/knowledge-graph/tests pass locally (`pnpm --filter @promethean-os/knowledge-graph test`).
- CLI tests create/migrate mock Database without process.exit or ENOENT errors.
- MemoryDatabase test runs without sqlite module resolution errors.
- SimulationSessionManager uses cwd-based dist/src runner paths matching tests and real usage.
- GraphQL and HTTP server tests receive populated nodes/frames from mocks (graph nodes present, frame increments to 1) and simulation endpoints return expected statuses.

## Requirements

- Adjust mocks/stubs so CLI export/mermaid tests load Database/Graph modules safely and create output files.
- Ensure node:sqlite is stubbed for MemoryDatabase test or refactor export surface to avoid Vitest loader failure.
- Update session-manager runner resolution to prioritize cwd dist/src entries before packaged path.
- Align server tests (GraphQL/HTTP) with repository/store mocks to surface expected data and frame values.
- Maintain ASCII; keep production behavior intact while satisfying test expectations.
- Run knowledge-graph test suite to confirm fixes.

## Notes

- Node version warning (wanted 22.20.0, current 22.18.0) observed but not blocker for tests.
- Avoid touching unrelated code; focus on test failures reported in last run.

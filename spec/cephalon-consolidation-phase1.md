# Spec: Cephalon Phase 1 Consolidation (CLJS)

## Summary
Consolidate all CLJS/TS functionality into `services/cephalon-cljs/` using TDD, remove the legacy CLJS package, and define a Redis RPC envelope schema (no Redis IO). This phase focuses strictly on migration + tests, not refactors or feature changes.

## Scope
- Migrate modules from the legacy CLJS package into `services/cephalon-cljs/`.
- Remove `packages/cephalon-cljs/` after the merge.
- Define Redis RPC envelope schema (CLJS only) for future microservices.
- Add unit, integration, and E2E workflow tests for migrated modules.

## Non-Goals
- No Redis implementation or network IO.
- No refactors, optimizations, or feature changes.

## Requirements
- Canonical package remains `services/cephalon-cljs/`.
- TDD for every migrated module (tests written before migration).
- Preserve existing behavior, even if imperfect.
- Zero LSP/compile errors in migrated code.

## Known Code References (line numbers from current state)
- Entry point (services): `services/cephalon-cljs/src/promethean/main.cljs` (systems wiring + adapters + TS bridge).
- Event types: `services/cephalon-cljs/src/promethean/event/types.cljs` lines 8-37.
- Memory store (services): `services/cephalon-cljs/src/promethean/memory/store.cljs` lines 3-42.
- LLM OpenAI client (services): `services/cephalon-cljs/src/promethean/llm/openai.cljs` lines 3-20.
- Discord adapter (services): `services/cephalon-cljs/src/promethean/adapters/discord.cljs` lines 5-55.
- FS adapter (services): `services/cephalon-cljs/src/promethean/adapters/fs.cljs` lines 6-43.
- Tests (services):
  - `services/cephalon-cljs/test/promethean/test_runner.cljs` lines 1-11.
  - `services/cephalon-cljs/test/promethean/main_test.cljs` lines 11-47.
  - `services/cephalon-cljs/test/promethean/init_world_test.cljs` lines 6-22.
  - `services/cephalon-cljs/test/promethean/bridge/cephalon_ts_test.cljs` lines 8-239.

## Known Issues
- None tracked for the consolidated `services/cephalon-cljs` baseline.

## Acceptance Criteria
- All modules listed in the plan migrate into `services/cephalon-cljs/` with tests.
- `npx shadow-cljs compile :cephalon` passes with zero errors.
- `npx shadow-cljs compile :test` passes with zero errors.
- `bun run test` passes (unit + integration + E2E).
- Redis RPC envelope schema exists and is tested (no Redis IO).

## Existing Issues / PRs
- No existing GitHub issues or PRs referenced for this effort.

## Definition of Done
- All Phase 1 tasks in `.sisyphus/plans/cephalon-consolidation-phase1.md` are checked.
- All tests pass with clean compile.
- Legacy CLJS package removed after merge.

## Test Plan
- Unit tests for each migrated module.
- Integration tests for sys modules and adapters.
- E2E tests for workflows: Discord event → memory → eidolon; FS watcher → event → tags; memory dedupe path.

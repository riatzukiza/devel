# Kanban Barrel Refactor Spec

## Context
- `src/lib/kanban.ts` currently aggregates all public exports (~45 lines) in a single barrel.
- Goal: split the barrel into smaller focused modules without changing the public API surface for consumers (`import {...} from './lib/kanban.js'`).

## Target Files & Lines
- `src/lib/kanban.ts:1-45` — existing monolithic barrel to be refactored.
- New barrels to introduce:
  - `src/lib/kanban-board.ts` — board-centric exports (`Task` type passthrough, board-service helpers, serialize/write board utilities, search).
  - `src/lib/kanban-tasks.ts` — task lifecycle and task-file helpers.
  - `src/lib/kanban-sync.ts` — sync/pull/push/regenerate/index helpers.
  - `src/lib/kanban-ai.ts` — AI helpers.
  - `src/lib/kanban-utilities.ts` — utility exports (`columnKey`, `applyTemplateReplacements`).
- Update `src/index.ts` if needed to pull from new barrels while preserving API.

## Definition of Done
- Public API from `lib/kanban.js` remains unchanged (all existing named exports still resolve).
- New barrel files introduced, `kanban.ts` becomes a thin aggregator delegating to them.
- Imports remain type-safe and buildable (tsc -b tsconfig.build.json succeeds).
- Tests/coverage run still passes.

## Requirements
1. Create focused barrel files grouping related exports as outlined above.
2. Update `src/lib/kanban.ts` to re-export from those barrels only; no behavioral changes.
3. Ensure `src/index.ts` continues exporting the same symbols (may continue to import from `./lib/kanban.js`).
4. Run at least `pnpm --dir ./ test:coverage` or a quicker build to ensure types compile; summarize outcomes.

## Change Log
- 2026-02-27: Spec drafted for splitting `lib/kanban.ts` into domain barrels while preserving API.

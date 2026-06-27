# Coverage Report Regression Fix

## Context
- `pnpm test:coverage` fails at TypeScript build because `columnKey` and `writeBoard` are missing from the public `lib/kanban` barrel that consumers import (`src/cli/handlers/audit.ts`, `board.ts`, `wip.ts`, `src/lib/directory-adapter/adapter.ts`, `src/lib/pantheon/column-normalizer.ts`, `src/lib/wip-enforcement.ts`).
- The functions exist at `src/lib/kanban-utils.ts` (lines 52-58) and `src/lib/board-serialization.ts` (lines 226-237) but were not re-exported after the package reorg that added `packages/*`.
- Builds now fail before tests/coverage execute; coverage summary is 0% due to the aborted run.

## Files & Line References
- `src/lib/kanban-utils.ts:52-58` — `columnKey` helper used by CLI handlers and WIP enforcement.
- `src/lib/board-serialization.ts:226-237` — `writeBoard` serializer used across actions and CLI.
- `src/lib/kanban.ts:1-45` — barrel file missing the above re-exports.
- `src/index.ts:1-25` — package entrypoint mirroring `lib/kanban` exports.
- Failing imports surfaced in `src/cli/handlers/audit.ts:5`, `board.ts:25`, `wip.ts:1-2`, `src/lib/directory-adapter/adapter.ts:11`, `src/lib/pantheon/column-normalizer.ts:1`, `src/lib/wip-enforcement.ts:3`.

## Existing Issues / PRs
- None discovered locally regarding this regression.

## Requirements
1. Re-export `columnKey` and `writeBoard` via `src/lib/kanban.ts` so downstream imports compile.
2. Mirror the exports in `src/index.ts` to keep the package API aligned.
3. Rebuild and run `pnpm test:coverage`; ensure the TypeScript build succeeds and coverage completes.

## Definition of Done
- `pnpm test:coverage` finishes successfully (no TypeScript export errors) and produces coverage output.
- `columnKey` and `writeBoard` are available from `lib/kanban.js` and the root index exports.
- No new lint/build regressions introduced.

## Change Log
- 2026-02-27: Drafted spec for restoring coverage command after barrel export regression.

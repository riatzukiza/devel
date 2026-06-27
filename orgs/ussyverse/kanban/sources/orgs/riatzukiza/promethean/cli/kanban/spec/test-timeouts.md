# Test timeouts and normalization failure (2025-03-10)

## Context

- Command: `pnpm --filter @promethean-os/kanban test:coverage`
- Outcome: timeouts in three suites plus a deterministic failure in `underscore-bug-demo.test.ts`.

## Skipped suites (temporarily)

- Resolved: the bulk import, sync, and duplication suites now run with explicit per-test timeouts and `test.serial` to avoid AVA worker contention.

## Failure analysis (non-timeout)

- `src/tests/underscore-bug-demo.test.ts` fails: `normalizeColumnName(' follow-up-tests ')` → `_follow_up_tests_` while `columnKey(' follow-up-tests ')` → `follow_up_tests`.
- Root cause: `normalizeColumnName` in `src/lib/transition-rules-functional.ts:486-493` lowercases and replaces whitespace/hyphens but never trims or removes trailing counts. `columnKey` (in `src/lib/kanban.ts:62-68`) first passes through `normalizeColumnDisplayName` which trims and strips trailing counts before normalization. Missing trim causes leading/trailing underscores and mismatch for inputs with surrounding spaces/annotations.
- Likely fix: apply the same pre-normalization as `columnKey` (trim + `stripTrailingCount`) inside `normalizeColumnName`, or reuse `columnKey` directly to keep a single source of truth.

## Definition of done

- The previously skipped suites are re-enabled with explicit timeouts.
- Documented reason for prior skips and the normalization mismatch root cause.
- Next engineers have clear pointers to the functions/lines involved and suggested remediation paths.

## Follow-ups

- Align `normalizeColumnName` with `columnKey` (trim + `stripTrailingCount`) to eliminate underscore drift.
- Profile `createTask` and `syncBoardAndTasks` under coverage for further runtime reductions.

## Related issues/PRs

- None found in repo at time of writing.

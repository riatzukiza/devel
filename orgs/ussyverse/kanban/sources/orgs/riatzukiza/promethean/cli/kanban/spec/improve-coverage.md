# Improve Test Coverage

## Scope
- Improve coverage for jsonl output, epic helpers, and task git tracker.

## Requirements
- Use AVA test patterns and helpers.
- Avoid real git dependency (respect KANBAN_DISABLE_GIT).

## Plan
1. Add jsonl output tests capturing stdout.
2. Add epic/subtask helper tests.
3. Add TaskGitTracker validation and orphaning tests.
4. Run `pnpm test` and `pnpm coverage`.

## Definition of Done
- Targeted modules show increased coverage.
- Tests and coverage commands pass.

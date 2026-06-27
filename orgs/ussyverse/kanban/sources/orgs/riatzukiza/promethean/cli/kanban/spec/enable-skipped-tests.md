# Enable Skipped Tests

## Scope
- Run all tests previously skipped in CLI, bulk import, sync, task-duplication, and git analysis suites.

## Requirements
- No `process.chdir` in tests.
- Add targeted per-test timeouts if needed.
- Preserve CLI behavior; only add test hooks/options.

## Plan
1. Add test-friendly `cwd`/`env` overrides for CLI configuration execution.
2. Unskip and stabilize I/O-heavy suites with explicit timeouts.
3. Unskip git analysis test and ensure it passes under `KANBAN_DISABLE_GIT`.
4. Run `pnpm test` and verify.

## Definition of Done
- All previously skipped tests run and pass.
- `pnpm test` succeeds.

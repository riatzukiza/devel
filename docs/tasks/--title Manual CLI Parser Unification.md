# Manual CLI Parser Unification

## Objective
Replace ad-hoc `process.argv` parsing across tooling with a consistent, well-tested CLI framework so every entry point shares validation, help output, and option handling semantics.

## Acceptance Criteria
- Documented CLI entry points migrate from manual token walking to the agreed parsing helper (commander.js wrapper or equivalent) with shared error/reporting utilities.
- Each updated CLI preserves current commands/flags and adds `--help` coverage with examples.
- Regression tests (unit or smoke) exercise at least the default path plus one flag for every migrated CLI.
- Security validation (path/filename sanitation) remains enforced where present in `shadow-conf` scripts.

## Affected Entry Points
- `src/hack.ts`
- `orgs/riatzukiza/promethean/packages/shadow-conf/src/bin/shadow-conf.ts`
- `orgs/riatzukiza/promethean/packages/shadow-conf/src/bin/shadow-conf-secure.ts`
- `orgs/riatzukiza/promethean/packages/report-forge/bin/report-forge.mjs`
- `orgs/riatzukiza/promethean/packages/trello/src/cli/sync-kanban-to-trello.ts`
- `orgs/riatzukiza/promethean/packages/opencode-repo-runner/src/cli.ts`
- `orgs/riatzukiza/promethean/packages/cli/src/lisp.ts`
- `orgs/riatzukiza/promethean/packages/pipelines/pipeline-automation/src/cli.ts`

## Suggested Steps
1. Inventory shared requirements (global options, environment variables, security checks) and design the common CLI helper.
2. Port each CLI to the helper module, maintaining flag parity and revalidating side effects (e.g., file writes, network calls).
3. Add or update tests covering success, invalid-flag, and help scenarios; include fixtures where needed for repo-runner and pipeline automation flows.
4. Refresh developer docs to reflect the unified interface and migration rationale.

## Dependencies
- Coordinate with Task 3 (CLI UX and Input Validation) to align error messaging and validation helpers.
- Coordinate with security review owners for `shadow-conf` to ensure sanitization remains intact after refactor.

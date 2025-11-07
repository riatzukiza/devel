# NSS Task 3 — CLI UX and Input Validation

## Objective
Improve the `nss` CLI experience with precise error handling, input validation, and discoverable help messaging.

## Acceptance Criteria
- `nss manifest init` verifies root path existence, git availability, and write permissions before execution.
- CLI errors return actionable messages with exit codes aligned to failure modes.
- Help text documents all flags, environment overrides, and example workflows.
- Argument parsing uses typed guards to eliminate ambiguous string/boolean states.

## Suggested Steps
1. Introduce validation helpers for filesystem and git pre-checks.
2. Replace generic `Error` surfaces with typed error classes mapped to exit codes.
3. Expand help/usage output and add `--help` flag coverage in tests.
4. Review docs to ensure CLI examples match final behavior.

## Dependencies
- Coordinates with Task 2 for shared error vocabulary.
- Testing support from Task 1 for CLI assertions.

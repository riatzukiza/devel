# NSS Task 2 — Gitmodules Validation Hardening

## Objective
Strengthen `.gitmodules` parsing and discovery to guard against malformed input, cycles, and path traversal attacks.

## Acceptance Criteria
- Parser rejects sections missing `path` or `url`, duplicate names, and malformed headers with descriptive errors.
- Discovery halts on circular dependencies and enforces a configurable max depth.
- Relative paths are normalized and validated to prevent escaping the workspace root.
- New validations are covered by unit tests and documented under troubleshooting.

## Suggested Steps
1. Extend `parseGitmodules` to validate fields and emit granular errors.
2. Detect and break cycles during discovery; surface actionable diagnostics.
3. Add path normalization utilities ensuring `../` traversal is blocked.
4. Update docs referencing security expectations and failure modes.

## Dependencies
- Coordinates with Task 1 test scaffolding for regression protection.
- Requires consensus on error message formats shared with CLI UX work.

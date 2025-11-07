# NSS Task 1 — Comprehensive Test Suite

## Objective
Establish automated coverage for nested submodule tooling to prevent regressions in parsing, manifest generation, and CLI flows.

## Acceptance Criteria
- Unit tests cover schema validation, gitmodules parsing, manifest generation, and CLI argument handling.
- Edge cases include malformed `.gitmodules`, duplicate entries, and circular dependencies.
- Test suite runs via `pnpm test:nss` (or equivalent) and integrates with CI.

## Suggested Steps
1. Introduce Vitest or Jest configuration dedicated to `src/nss`.
2. Add fixtures representing real workspace layouts (valid and malformed).
3. Validate CLI behaviors with snapshot or integration-style tests through Node test runner.
4. Document how to run the test suite locally and in CI.

## Dependencies
- Requires stable manifest schema (`src/nss/schema.ts`).
- Depends on finalized gitmodules discovery utilities (`src/nss/gitmodules.ts`).

## Notes
Prioritize fast feedback; ensure fixtures remain lightweight and easy to update.

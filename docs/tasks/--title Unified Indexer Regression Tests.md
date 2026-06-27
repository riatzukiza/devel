# Unified Indexer Regression Tests

## Objective
Expand automated coverage to validate unified indexer service behavior across lifecycle, CRUD, and cross-domain search flows.

## Acceptance Criteria
- Unit and integration tests cover interval sync guarding, CRUD success and failure modes, and stats updates.
- Cross-domain search tests validate option merging, context compilation, analytics generation, and error propagation.
- Regression suite runs in CI (e.g., `pnpm test` or `pnpm test:unified-indexer`) and fails on unhandled promise rejections or console errors.
- Mocked persistence layer (or lightweight in-memory implementation) ensures deterministic results without external services.

## Suggested Steps
1. Create dedicated test helpers for seeding `DualStoreManager` and simulating persistence responses.
2. Add concurrency tests that ensure `syncAllIndexers` respects the new mutex and surfaces slow-sync warnings.
3. Cover search option combinations, including semantic-only, hybrid searches, and context-disabled runs.
4. Document new test commands in the package README and ensure developers can run them locally.

## Dependencies
- Depends on completion of sync guard and CRUD contract tasks for stable APIs.
- Requires Ava (or alternative) configuration updates if additional test commands are introduced.

## Notes
Track test coverage thresholds to prevent regressions as new sources or analytics features are added.

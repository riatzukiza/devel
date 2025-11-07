# Unified Indexer Client CRUD Contract

## Objective
Deliver a reliable CRUD surface for the unified indexing client so downstream services receive actionable feedback instead of silent no-ops.

## Acceptance Criteria
- `getByType`, `getBySource`, `update`, `delete`, and `deleteBatch` either perform the expected persistence operation or throw a descriptive error declaring the capability unsupported.
- Return values from the CRUD helpers accurately reflect success or failure and surface partial failures where applicable.
- Documentation in `API_REFERENCE.md` and `README.md` clarifies the behavior of each method, including any temporary limitations.
- Tests cover successful CRUD flows, unsupported operations, and failure propagation.

## Suggested Steps
1. Audit available adapters in `@promethean-os/persistence` to determine which CRUD calls can be implemented immediately.
2. For unimplemented operations, throw structured errors (e.g., `NotImplementedError`) and log telemetry for follow-up.
3. Add integration-style tests that exercise the implemented CRUD workflows against an in-memory or mocked persistence layer.
4. Update public docs and type definitions to match the finalized contract.

## Dependencies
- Requires coordination with the persistence package to confirm available abstractions.
- May depend on upcoming work around unified stats collection for consistent reporting.

## Notes
Document interim limitations clearly to avoid regressions when consumers adopt the updated API.

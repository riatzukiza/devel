# Spec: Fix open defects (#1-#7)

## Context

- Scope: Address current open issues in `octave-commons/knowledge-graph` related to correctness and data integrity.
- Reference issues: #1 Connected nodes CTE, #2 Memory DB parity, #3 Edges FKs, #4 CLI migration errors, #5 License mismatch, #6 package.json dependency extraction, #7 optional dependency typing.
- Related docs: `spec/code-review.md`, `spec/github-issues-detailed.md`, `README.md` (license/script refs).

## File References

- `src/database/repository.ts:231-279` — `getConnectedNodes` CTE reused without redefinition (issue #1).
- `src/database/memory-database.ts:23-64` — in-memory adapter only supports SELECT \* and basic INSERT (issue #2).
- `src/database/database.ts:51-75` — edges table lacks foreign keys (issue #3).
- `src/cli.ts:145-150` — migrate errors swallowed as "already exists" (issue #4).
- `package.json:27-28` and `README.md:103-106` — license inconsistency (issue #5).
- `src/processors/content.ts:59-189` — `.json` allowed but routed to unsupported branch (issue #6).
- `src/processors/dependency.ts:45-47` — `optionalDependencies` typed as `devDependencies` (issue #7).

## Requirements

- Fix each defect with minimal surface-area changes and adequate tests (unit/integration/CLI as appropriate).
- Keep in-memory adapter behavior aligned with repository query shapes or document/guard limitations.
- Ensure dependency processing for package manifests runs and correctly types optional deps.
- Enforce referential integrity for edges → nodes; decide ON DELETE policy and migration strategy for existing DBs.
- CLI should surface migration errors; only suppress benign "already exists" cases.
- Align license declarations across package.json/README (and LICENSE if present).

## Definition of Done

- All fixes implemented with passing targeted tests (and existing suite where feasible).
- New/updated tests cover: connected nodes query, in-memory adapter parity, dependency extraction (deps/dev/peer/optional), FK enforcement behavior, CLI migration error handling.
- Documentation/metadata aligned (license).
- No regression to current interfaces; CLI usage unchanged except for clearer error handling.

## Proposed Order (phases)

1. Query correctness: fix `getConnectedNodes` CTE (issue #1) + tests.
2. Dependency processing: route `.json` to DependencyProcessor and fix optional dep typing (issues #6, #7) + tests.
3. In-memory adapter parity adjustments (issue #2) + tests; document limits if any.
4. Schema integrity: add FKs/migration handling (issue #3) + tests.
5. CLI migrate error handling (issue #4) + tests.
6. License alignment (issue #5).

## Test Plan

- Unit: repository `getConnectedNodes`, content/dependency processors, in-memory DB CRUD/find parity.
- Integration/CLI: migration failure path, dependency extraction via builder/CLI build.
- Schema: enforce FK behavior with orphan insert and node delete cases.

## Risks/Notes

- Adding FKs may require migration strategy; ensure backward compatibility or provide migration script.
- In-memory adapter may not feasibly support recursive CTE; cover that path with SQLite-backed tests instead.

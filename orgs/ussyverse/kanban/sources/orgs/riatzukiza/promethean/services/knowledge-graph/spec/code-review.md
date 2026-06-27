# Code Review Spec

## Context
- Request: "review the code" for @promethean-os/knowledge-graph.

## Key Code References
- src/database/database.ts:52-75 — edges table lacks declared foreign keys despite `PRAGMA foreign_keys = ON`.
- src/database/repository.ts:243-250 — `getConnectedNodes` references a CTE (`connected_nodes`) that is not defined in the second query, causing a runtime SQL error.
- src/database/memory-database.ts:23-63 — in-memory adapter pattern-matches on SQL strings and only recognizes `SELECT *`/`INSERT` shapes, so lookups used by repository (`SELECT id, ...`) return null; deletions and filtered queries are unsupported.
- package.json:27-28 vs README.md:72 — license mismatch (MIT vs GPL-3.0-only).
- src/cli.ts:80-89 — migration errors are treated as "already exists", masking real failures before proceeding.
- src/processors/content.ts:148-189 — `.json` (including `package.json`) is treated as unsupported, so `DependencyProcessor` is never invoked and dependency edges are missing.
- src/processors/dependency.ts:45-47 — `optionalDependencies` are mislabeled as `devDependencies`, skewing dependency typing.

## Existing Issues
- Not reviewed in this pass.

## Existing PRs
- Not reviewed in this pass.

## Requirements
- Surface correctness/security problems and testing gaps with file/line references.

## Definition of Done
- Deliver prioritized findings (bugs/risks/tests) with actionable notes and references.

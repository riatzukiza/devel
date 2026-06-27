# Detailed GitHub Issue Specs — knowledge-graph defects

## Context

- Task: capture detailed specs and file GitHub issues for the key defects in `@promethean-os/knowledge-graph` (repo: `octave-commons/knowledge-graph`).
- Source findings: `spec/code-review.md`, prior CLI and repository review.
- Related docs: `spec/issues-plan.md` (initial issue targets), `spec/code-review.md` (findings), README license note.

## Existing Issues (GH)

- #6 Package.json dependencies never extracted
- #7 Optional dependencies mislabeled as devDependencies
- #3 Edges table lacks foreign key constraints
- #2 In-memory database diverges from repository SQL usage
- #4 CLI masks migration errors as "already exists"

## Requirements

- Each issue must include: title, problem statement, impact, reproduction/observed behavior, acceptance criteria, and references (file:line).
- Avoid duplicates—link to existing issues when they cover the same defect.
- Specify expected tests (unit/integration) to prove the fix.

## Definition of Done

- Issues filed (or updated) in `octave-commons/knowledge-graph` with acceptance criteria and references.
- Spec links back to existing issues; gaps called out if any issue needs creation.
- Test expectations recorded for each defect.

## Issue Specs

### 1) Package.json dependencies never extracted

- Reference: `src/processors/content.ts:59-99` — `.json` is allowed in the extension whitelist but falls through to the default branch and is marked "Unsupported", so `DependencyProcessor` is never called.
- Impact: No `depends_on` edges for `package.json` files; dependency graph is incomplete, affecting downstream visualization/related edges.
- Repro: Run `pnpm --filter @promethean-os/knowledge-graph run cli -- build .` against a repo with `package.json`; resulting graph lacks package nodes/edges.
- Acceptance Criteria:
  - `.json` (including `package.json`) is routed through `DependencyProcessor`.
  - Graph includes dependency nodes/edges for packages in `package.json` when present.
  - Unit test exercising `ContentProcessor.processContent` for `.json` verifies `DependencyProcessor` invoked and dependencies emitted.
  - Integration/CLI test that builds a small repo and asserts dependency edges exist.
- Coverage Suggestions: add vitest for `ContentProcessor` JSON path; CLI/graph export snapshot including dependencies.

### 2) Optional dependencies mislabeled as dev deps

- Reference: `src/processors/dependency.ts:45-47` — `optionalDependencies` are pushed as `devDependencies`.
- Impact: Mis-typed edges (`depends_on` data) skew analytics; optional dependencies indistinguishable from dev deps.
- Acceptance Criteria:
  - `optionalDependencies` are tagged as `optional` (or a distinct type) in emitted dependency records.
  - Tests cover all dependency categories (dependencies, devDependencies, peerDependencies, optionalDependencies) with distinct expectations.
  - Graph export shows optional deps with correct type metadata.

### 3) Edges table missing foreign keys

- Reference: `src/database/database.ts:51-75` — `edges.source_id`/`target_id` are TEXT without `REFERENCES nodes(id)` despite `PRAGMA foreign_keys = ON`.
- Impact: Orphan edges can be inserted; subsequent queries/visualization may include dangling relationships.
- Acceptance Criteria:
  - Schema declares foreign keys on `edges.source_id` and `edges.target_id` referencing `nodes(id)` (with appropriate `ON DELETE` policy, e.g., CASCADE/RESTRICT as chosen).
  - Migration handles existing DBs (new migration or safe re-creation) without data loss; documented steps.
  - Tests insert orphan edges and expect failure; deleting a node cascades or fails according to the chosen policy.

### 4) In-memory database diverges from real SQL usage

- Reference: `src/database/memory-database.ts:23-64` — adapter pattern-matches only `SELECT *`/`INSERT` forms; repository uses projections (`SELECT id, type, data, ...`) and filtered queries, so stub returns null/empty and ignores filters/limits.
- Impact: Tests using the memory adapter pass while real SQLite would behave differently; masks query bugs (e.g., filtering, connected queries).
- Acceptance Criteria:
  - Memory adapter implements the query shapes used by `GraphRepository` (id lookups, filtered `find` with params, delete semantics, recursive getConnectedNodes path or explicit skip with clear warning + dedicated tests using SQLite for that path).
  - Unit tests asserting memory adapter returns the same shapes as SQLite for CRUD/find operations.
  - Document limitations if any (e.g., recursion not supported) and adjust tests to cover real DB where needed.

### 5) CLI migration swallows real failures

- Reference: `src/cli.ts:145-150` — any `db.migrate()` error logs "Database already exists" and continues.
- Impact: Schema creation failures (permissions, corrupt DB, schema mismatch) are hidden; subsequent operations run on a broken DB.
- Acceptance Criteria:
  - CLI distinguishes "already exists" from real migration errors; unexpected errors surface with non-zero exit.
  - Tests simulate migration failure (e.g., read-only path or throwing migrate) and assert CLI exits with error and message.
  - Success path still logs "Database initialized"; existing DB path does not mask unrelated errors.

## Notes

- All above defects already tracked as GH issues (#2, #3, #4, #6, #7). No new issues needed if those remain open; update them with these details as needed.

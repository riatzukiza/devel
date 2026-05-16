## Signal

(己, p=0.96) Yes — that architecture is the right direction. I continued by making OpenPlanner start carrying explicit schema-version/migration metadata on new writes, so lazy migrations have something concrete to plan against.

Implemented and committed:

- New schema target constants:
  - `src/lib/schema-versions.ts`
- New lazy migration planner client helper:
  - `src/lib/lazy-migrations.ts`
- New event writes now persist:
  - `schema_version: 3`
  - `migration_state.applied`
  - `migration_state.verified_at`
  - `migration_state.strategy: "new-write"`
- New vector chunk writes now persist:
  - `schema_version: 2`
  - `migration_state`
- State validation now reports schema-version backlog:
  - `checks.schemaVersions.eventsMissingOrBehind`
  - `checks.schemaVersions.vectorsMissingOrBehind`
- Mongo indexes added for:
  - `events.schema_version`
  - flat vector `schema_version`
  - partition vector `schema_version`
- Updated lazy migration graph crawler docs to point at the TS client helper.

Commit chain:

- OpenPlanner: `8521b83 Track schema versions for lazy migrations`
- Workspace root: `2484d444 Advance OpenPlanner schema-versioned lazy migrations`

## Evidence

(己, p=0.97) Verification passed:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm test src/tests/indexing.test.ts
pnpm build
```

(己, p=0.94) Live smoke wrote a new event and confirmed schema metadata in Mongo:

```json
{
  "_id": "schema-version-smoke-20260429",
  "kind": "diag.schema",
  "schema_version": 3,
  "migration_state": {
    "applied": [
      "event/v1->v2-source-ref",
      "event/v2->v3-reference-first-text"
    ],
    "verified_at": "2026-04-29T19:25:44.867Z",
    "strategy": "new-write"
  },
  "text": ""
}
```

(己, p=0.9) Live state endpoint now exposes schema-version backlog:

```json
{
  "schemaVersions": {
    "ok": false,
    "eventTarget": 3,
    "vectorChunkTarget": 2,
    "eventsMissingOrBehind": 722398,
    "vectorsMissingOrBehind": 369014
  }
}
```

## Frames

(己, p=0.9) The system now has the basis for “migrate on touch”: new objects declare their target version, and old/versionless objects can be detected without scanning the whole lake synchronously.

(己, p=0.86) Whole-lake Migration 2 remains useful as background convergence, but it no longer has to be the only strategy.

(己, p=0.84) Next logical layer is turning validation failures into migration plans/jobs: `src/lib/lazy-migrations.ts` can call the Clojure migration graph planner when a route sees an old object fail target-schema validation.

## Countermoves

(己, p=0.92) I did not mark schema backlog as a hard failure for `/state/redaction`; it is reported separately so the existing redaction parity signal remains readable.

(己, p=0.9) I preserved the pre-existing uncommitted work:

- `packages/agents/knoxx`
- `pnpm-workspace.yaml`
- `docs/notes/2026.04.28.*`
- `packages/stores/migrations/migration_pitfalls.md`

## Next

(己, p=0.95) Wire `planLazyMigrationAfterValidationError()` into one concrete route validation path so old objects can return/apply/enqueue a lazy migration plan instead of just failing schema validation.
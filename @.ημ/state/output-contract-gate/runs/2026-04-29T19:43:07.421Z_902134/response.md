## Signal

(己, p=0.96) Continued and wired the first concrete validation-triggered lazy migration path.

Implemented:

- Added `migration_jobs` Mongo collection support:
  - type: `MigrationJobDocument`
  - indexes:
    - `{ status, priority, updatedAt }`
    - unique `{ entity, object_id, trigger }`
  - helper: `enqueueMigrationJob(...)`
- Updated `GET /v1/documents/:id`:
  - fetches raw document row
  - detects stale/invalid target schema conditions:
    - `schema_version` missing/behind target
    - source-backed document row still retaining durable `text`
  - calls `planLazyMigrationAfterValidationError(...)` when `OPENPLANNER_MIGRATION_GRAPH_URL` is configured
  - enqueues non-inline plans into `migration_jobs`
  - returns `lazyMigration` metadata alongside the hydrated document when a plan exists
- Verified the migration graph planner client against a live local Clojure graph service.

Commit chain:

- OpenPlanner: `88cedb4 Enqueue lazy migration plans for stale documents`
- Workspace root: `32f379d2 Advance OpenPlanner validation-triggered migrations`

## Evidence

(己, p=0.97) Verification passed:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm test src/tests/indexing.test.ts
pnpm build
```

(己, p=0.94) Planner integration smoke passed with local graph service:

```json
{
  "ok": true,
  "ids": [
    "v1->v2-source-ref",
    "v2->v3-reference-first-text"
  ],
  "enqueue": true
}
```

(己, p=0.9) The integration is intentionally non-blocking: if the graph service URL is not configured, document reads still work and do not fail.

## Frames

(己, p=0.9) This is the first “migrate on touch” path: old document rows discovered by API reads can now become queued migration work instead of waiting for whole-lake scans.

(己, p=0.86) The path currently plans/enqueues; it does not yet apply Migration 2 inline. That is correct for `lazy-object-with-vector-repair`, because vector repair should happen before parent text redaction and may touch multiple collections.

(己, p=0.82) Whole-lake Migration 2 remains a background convergence tool, while `migration_jobs` becomes the hot-path convergence tool.

## Countermoves

(己, p=0.92) I did not turn stale schema into a hard read failure; reads remain available and migration is queued opportunistically.

(己, p=0.9) I preserved pre-existing uncommitted work:

- `packages/agents/knoxx`
- `pnpm-workspace.yaml`
- `docs/notes/2026.04.28.*`
- `packages/stores/migrations/migration_pitfalls.md`

## Next

(己, p=0.95) Add a bounded worker/crawl tick that consumes `migration_jobs` and applies Migration 2’s chunk-first repair for queued `openplanner/event` jobs.
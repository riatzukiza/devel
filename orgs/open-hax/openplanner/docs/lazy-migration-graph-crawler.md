# Lazy migration graph crawler

OpenPlanner should not rely on whole-lake blocking migrations for every schema change. MongoDB is flexible, the lake is large, and production lakes may be much larger than the current local dataset. The migration model should therefore be **versioned, lazy, bounded, and graph-aware**.

## Principle

Every persisted object that participates in public/runtime contracts should eventually carry explicit schema identity and version metadata, for example:

```json
{
  "schema": "openplanner.event.v1",
  "schema_version": 3,
  "migration_state": {
    "applied": ["event/v1->v2-source-ref", "event/v2->v3-reference-first-text"],
    "verified_at": "2026-04-29T00:00:00.000Z"
  }
}
```

Old objects may not have those fields. For old objects, validators and crawlers infer the lowest compatible version from shape and metadata, then plan the path to the target version.

## Trigger points

Migrations should be planned or applied at these points:

1. **Schema validation error**
   - A route validates an object against the target schema.
   - If validation fails and the object is old-version-compatible, the API asks the migration graph planner for the minimal migration path.
   - The route can then apply synchronously for cheap object-local migrations, enqueue for expensive migrations, or return `409 migration_required` with a job id.

2. **Read hydration**
   - When a document/vector/search read discovers an old or redacted object, it hydrates and can enqueue missing migrations opportunistically.

3. **Write/upsert**
   - New writes should emit the current target schema version directly.
   - Updates to old objects should normalize them before write-back.

4. **Graph-memory traversal**
   - When graph memory touches a node, it can traverse adjacent objects and enqueue bounded migration work for the neighborhood.
   - This keeps hot graph regions fresh without blocking on cold historical data.

5. **Background crawl ticks**
   - A dedicated migration graph crawler walks bounded windows, not the whole lake.
   - Each tick has a strict limit and can be safely repeated.

## Migration graph service

The initial Clojure service scaffold lives in:

```text
packages/stores/migrations/openplanner-migration-tools/src/openplanner/migrations/graph.clj
packages/stores/migrations/openplanner-migration-tools/src/openplanner/migrations/graph_service.clj
```

Run it with:

```bash
cd packages/stores/migrations/openplanner-migration-tools
clj -M:graph-service
```

Default endpoint:

```text
http://127.0.0.1:7789
```

### Health

```bash
curl http://127.0.0.1:7789/health
```

### Plan after validation error

```bash
curl -sS -X POST http://127.0.0.1:7789/v1/schema/validation-error \
  -H 'content-type: application/json' \
  --data '{
    "entity": "openplanner/event",
    "target-version": 3,
    "object": {
      "kind": "docs",
      "schema_version": 1
    },
    "error": {
      "message": "text must be redacted for source-backed document rows"
    }
  }'
```

Expected response shape:

```json
{
  "ok": true,
  "action": "enqueue-or-apply-lazy-migration",
  "plan": {
    "entity": "event",
    "currentVersion": 1,
    "targetVersion": 3,
    "upToDate": false,
    "migrationIds": [
      "v1->v2-source-ref",
      "v2->v3-reference-first-text"
    ]
  }
}
```

## Migration application policy

Migrations should be classified by cost and risk:

| Mode | Behavior |
| --- | --- |
| `lazy-object` | Safe to apply inline to one object when validation fails. |
| `lazy-object-with-vector-repair` | Apply dependent vector/chunk repair first, then parent object update. Usually enqueue unless the neighborhood is tiny. |
| `crawl-batch` | Background crawler only; bounded by count/time. |
| `manual-gated` | Requires explicit operator action. |

## Reference-first redaction example

For Migration 2, the safe lazy order is:

1. Locate source ref/hash for the event.
2. Redact dependent vector/chunk rows first.
3. Mark vector/chunk redaction verified.
4. Redact parent event text.
5. Attach schema/migration metadata.

This avoids the interrupted-run failure mode where parent text is removed before vector rows can be repaired.

## Next implementation steps

1. Add `schema_version` and `migration_state` to new writes in OpenPlanner events and vector rows.
2. Wire `src/lib/lazy-migrations.ts` into route schema validation failure paths and choose inline vs enqueue behavior based on migration mode.
3. Add a durable migration job queue collection in MongoDB.
4. Extend `/v1/graph/crawl/tick` to query graph neighborhoods and enqueue bounded migration jobs.
5. Promote current Migration 2 logic into graph-node migration handlers instead of only CLI batches.

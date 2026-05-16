## Signal

(己, p=0.97) Done.

Wired the OpenPlanner runtime to run lazy migrations continuously via compose:

- Added non-root Dockerfile for migration graph/apply service:
  - `orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools/Dockerfile`
- Added compose services:
  - `openplanner-migration-graph`
  - `openplanner-migration-worker`
- Set both OpenPlanner prod/dev containers:
  - `OPENPLANNER_MIGRATION_GRAPH_URL=http://openplanner-migration-graph:7789`
- Worker periodically calls:
  - `POST /v1/jobs/apply-tick`
- Recreated runtime services through compose.

Commits:

- Migration tools: `a0c7919 Containerize lazy migration graph service`
- OpenPlanner: `b67067d Wire lazy migration service runtime`
- Workspace root: `77c83290 Run OpenPlanner lazy migration worker in compose`

## Evidence

(己, p=0.96) Compose validates:

```bash
docker compose config --quiet
```

(己, p=0.96) Migration graph image builds and runs healthy:

```text
openplanner-openplanner-migration-graph-1 ... Up ... healthy
```

(己, p=0.95) Worker can reach graph service:

```json
{"ok":true,"service":"openplanner-migration-graph"}
```

(己, p=0.95) OpenPlanner containers have the graph URL:

```bash
OPENPLANNER_MIGRATION_GRAPH_URL=http://openplanner-migration-graph:7789
```

(己, p=0.95) Live stale document read enqueued migration:

```json
{
  "lazyMigration": {
    "planned": true,
    "enqueued": true
  }
}
```

(己, p=0.95) Worker apply tick migrated it:

```json
{
  "ok": true,
  "action": "apply-tick",
  "limit": 1,
  "processed": 1,
  "results": [
    {
      "events-redacted": 1,
      "chunks-redacted": 2,
      "event-id": "kt-code",
      "status": "applied",
      "job-status": "applied"
    }
  ]
}
```

## Frames

(己, p=0.9) The lazy migration path is now operational in the running stack:

```text
GET stale document
→ plan via graph service
→ enqueue migration_jobs
→ periodic worker tick
→ chunk-first Migration 2 apply
→ job marked applied
```

(己, p=0.86) The worker is intentionally bounded and configurable:

- `OPENPLANNER_MIGRATION_APPLY_LIMIT`, default `10`
- `OPENPLANNER_MIGRATION_APPLY_INTERVAL_SECONDS`, default `60`

## Countermoves

(己, p=0.9) OpenPlanner `/v1/health` still returns `503` because the embedding provider reports missing `qwen3-embedding:0.6b`; that is the pre-existing embed-provider issue, not the migration service wiring.

(己, p=0.88) Preserved existing uncommitted workspace state:

- `packages/agents/knoxx`
- `pnpm-workspace.yaml`
- `docs/notes/2026.04.28.*`
- `packages/stores/migrations/migration_pitfalls.md`

## Next

(己, p=0.93) Fix the embedding provider model route so OpenPlanner health returns green again.
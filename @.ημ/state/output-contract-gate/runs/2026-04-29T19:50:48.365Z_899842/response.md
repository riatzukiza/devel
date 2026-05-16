## Signal

(己, p=0.96) Continued and made the lazy migration loop actually apply queued work.

Implemented:

- Clojure Migration 2 now exposes:
  - `openplanner.migrations.migration-2/apply-event-id!`
  - Applies one event migration in safe chunk-first order:
    1. repair/redact vector chunks
    2. redact/verify parent event
- Clojure graph service now exposes:
  - `POST /v1/jobs/apply-tick`
  - Consumes bounded `migration_jobs`
  - Processes only `openplanner/event` queued jobs for now
  - Marks jobs:
    - `applied`
    - `skipped`
    - `failed`
- README documents the apply tick endpoint.

Commits:

- Migration tools: `32c9d57 Apply queued lazy migration jobs`
- OpenPlanner: `8545f19 Advance lazy migration apply worker`
- Workspace root: `e17af188 Advance OpenPlanner lazy migration apply worker`

## Evidence

(己, p=0.95) Clojure compile/load smoke passed:

```bash
clj -M -e '(require (quote openplanner.migrations.graph-service) (quote openplanner.migrations.migration-2)) (println :ok)'
# :ok
```

(己, p=0.95) Live apply tick processed one queued job:

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
      "event-id": "kind-test-code",
      "status": "applied",
      "job-id": "openplanner/event:kind-test-code:schema-validation-error",
      "job-status": "applied"
    }
  ]
}
```

(己, p=0.94) Mongo inspection confirmed:

```json
{
  "status": "applied",
  "last_result": {
    "events-redacted": 1,
    "chunks-redacted": 2,
    "event-id": "kind-test-code",
    "status": "applied"
  }
}
```

And the event now has:

```json
{
  "text": "",
  "extra": {
    "migration_2": {
      "text_redacted": true,
      "chunk_redaction_verified": true
    }
  }
}
```

## Frames

(己, p=0.9) This completes the first end-to-end lazy migration loop:

```text
stale document read → migration plan → migration_jobs queue → bounded apply tick → chunk-first Migration 2 repair
```

(己, p=0.86) This avoids waiting on whole-lake migrations while still allowing whole-lake background convergence.

(己, p=0.82) The worker is intentionally bounded per tick, so it can be called by cron/systemd/PM2/graph crawl without risking an unbounded migration sweep.

## Countermoves

(己, p=0.9) I did not make the worker a daemon yet; it is an explicit bounded HTTP tick.

(己, p=0.88) I preserved pre-existing uncommitted work:

- `packages/agents/knoxx`
- `pnpm-workspace.yaml`
- `docs/notes/2026.04.28.*`
- `packages/stores/migrations/migration_pitfalls.md`

## Next

(己, p=0.95) Wire OpenPlanner runtime/container config to point `OPENPLANNER_MIGRATION_GRAPH_URL` at the Clojure graph service and add a managed process for periodic `/v1/jobs/apply-tick`.
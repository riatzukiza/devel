## Signal

(己, p=0.95) Ran the command from the vendored submodule path and it works:

```bash
cd /home/err/devel/orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools
clj -M:run --help
```

It prints the CLI usage and required env vars for running migrations.

## Evidence

(己, p=0.9) Output includes:

- `Usage: clj -M:run --migration migration-1 --dry-run`
- Options: `--dry-run`, `--apply`, `--limit`, `--since`, `--until`
- Env:
  - `OPENPLANNER_MONGODB_URI`
  - `OPENPLANNER_MONGODB_DB`
  - `OPENPLANNER_MONGO_EVENTS_COLLECTION`
  - `PROXX_DATABASE_URL`

## Frames

(己, p=0.65) This confirms the submodule wiring + deps resolution are correct from the OpenPlanner vendored location.  
(己, p=0.6) Next step is to run `migration-1` in `--dry-run` mode with real env pointing at the running Mongo+Postgres.

## Countermoves

(己, p=0.7) Don’t run `--apply` yet until we harden matching (hash+receipt) and verify sample matches against Proxx payloads are correct.

## Next

(汝, p=0.85) Run a dry-run with explicit env (copy/paste as-is, adjust hosts if needed):  
`OPENPLANNER_MONGODB_URI='mongodb://openplannerRoot:change-me-root-password@127.0.0.1:27017/openplanner?authSource=admin' PROXX_DATABASE_URL='jdbc:postgresql://127.0.0.1:15432/openai_proxy?user=openai_proxy&password=openai_proxy' clj -M:run --migration migration-1 --dry-run --limit 50`
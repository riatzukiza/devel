# openplanner devops home

Canonical source: `../../orgs/open-hax/openplanner`

This directory is the workspace-local runtime/devops home for OpenPlanner.
Use it for:

- the devel-specific Compose stack
- local runtime state under `./openplanner-lake`
- local-only overrides that should not live in the source repository

Do **not** run the devel runtime from `orgs/open-hax/openplanner/`.
The `orgs/**` copy is the source/community home; `services/openplanner` is the
local runtime home.

## Local compose

```bash
cd /home/err/devel/services/openplanner
docker compose up --build -d
curl http://127.0.0.1:8787/v1/health
curl http://127.0.0.1:7777/v1/health
```

Or from the workspace root:

```bash
pnpm docker:stack up openplanner -- --build
pnpm docker:stack status openplanner
```

## Graph runtime

The graph slice now lives here instead of `services/knoxx`.

Services under the `graph` profile:

- `graph-weaver` on `http://127.0.0.1:8796/`
- `eros-eris-field-app` as the semantic/layout worker
- `shuvcrawl` on `http://127.0.0.1:3777/`
- `myrmex` as the crawl/event ingestion worker

Start them with:

```bash
cd /home/err/devel/services/openplanner
docker compose --profile graph up --build -d graph-weaver eros-eris-field-app shuvcrawl myrmex
```

Useful checks:

```bash
curl http://127.0.0.1:8796/api/status | jq
curl http://127.0.0.1:3777/health | jq
curl -H 'Authorization: Bearer change-me' http://127.0.0.1:7777/v1/graph/stats | jq
docker compose logs -f myrmex
docker compose logs -f eros-eris-field-app
```

## Data placement

Mutable runtime state lives here, especially:

- `services/openplanner/openplanner-lake/`

The local wrapper expects `vexx`, the NPU-backed cosine service used to rerank
vector matches for Knoxx/OpenPlanner and to serve semantic edge scoring for
Eros, to be reachable on `http://host.docker.internal:8787` from containers.
OpenPlanner persists Ollama embedding cache entries under:

- `services/openplanner/openplanner-lake/cache/ollama-embeddings.jsonl`

One working local launch path is:

```bash
cd /home/err/devel/orgs/open-hax/openplanner/packages/vexx
pm2 start 'env VEXX_HOST=0.0.0.0 VEXX_PORT=8787 VEXX_DEVICE=NPU VEXX_AUTO_ORDER=NPU,GPU,CPU VEXX_REQUIRE_ACCEL=true clojure -M:run' --name vexx --cwd /home/err/devel/orgs/open-hax/openplanner/packages/vexx
```

The Compose-defined `vexx` service is kept behind the `container-vexx` profile
for later ABI/device experiments, but the currently verified path for NPU usage
in this workspace is the host-run service above.

That state should stay out of `orgs/open-hax/openplanner/` so source and local
runtime concerns remain separated.

## Semantic graph builder

The offline semantic graph builder now runs from this wrapper via the `jobs` profile.

Run the full pipeline with:

```bash
cd /home/err/devel/services/openplanner
docker compose --profile jobs run --rm semantic-graph-builder
```

Artifacts land under:

- `services/openplanner/openplanner-lake/jobs/semantic-graph/<run-id>/`

The graph helper script also lives here now:

- `services/openplanner/scripts/materialize-missing-graph-node-embeddings.py`

## MongoDB profile

### Community Search (default, local dev)

```bash
cd /home/err/devel/services/openplanner
docker compose up --build -d
```

The default stack provisions MongoDB Community Search with:

- `secrets-init` for local key/password files under `./runtime-secrets/`
- `mongodb` in replica-set mode with `mongotHost` wiring
- `mongo-init` to initiate `rs0` and create `mongotUser` + app user
- `mongot` using the local search config in `./config/mongot.yml`

**Limitation:** Community Search containers do not support `createSearchIndexes`
or `$vectorSearch`. Vector similarity falls back to vexx/JS cosine scan.
See [docs/deployment/vector-search.md](docs/deployment/vector-search.md).

### Atlas Local (production vector search)

For native `$vectorSearch` support, use the Atlas Local overlay:

```bash
cd /home/err/devel/services/openplanner
docker compose -f docker-compose.yml -f docker-compose.atlas.yml up --build -d
```

This replaces Community containers with `mongodb/mongodb-atlas-local`, enabling:
- Full `createSearchIndexes` / `$listSearchIndexes` support
- Native `$vectorSearch` with real vector index backing
- No separate mongot container needed

See [docs/deployment/production-vector-search.md](docs/deployment/production-vector-search.md)
for the full deployment runbook and data migration instructions.

## Migration testing

Run migration commands from this wrapper, but execute them inside the container so they can access the mounted runtime lake and resolve Compose service names. Host-side DuckDB access may fail against root-owned lake files produced by containers.

```bash
cd /home/err/devel/services/openplanner

docker compose run --rm --build \
  -e OPENPLANNER_STORAGE_BACKEND=mongodb \
  -e MONGODB_DB=openplanner_migration_smoke \
  openplanner \
  node dist/migrate.js legacy-to-mongo --dry-run
```

# OpenPlanner Stack Documentation

Default local development now uses the canonical `services/proxx` instance on the shared `ai-infra` network for embeddings and model proxying. The bundled `openplanner-proxx` runtime remains available only when explicitly enabled with `--profile bundled-proxx`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OpenPlanner Stack                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐ │
│  │   nginx      │────▶│   Knoxx      │     │       Atlas Local            │ │
│  │   :80        │     │   Frontend   │     │        mongodb:27017         │ │
│  │              │     │   (React)    │     │        └─ openplanner DB     │ │
│  │              │     │              │     │           ├─ events          │ │
│  │              │     │              │     │           ├─ event_chunks    │ │
│  │              │     │              │     │           ├─ graph_edges     │ │
│  │              │     │              │     │           ├─ graph_semantic  │ │
│  │              │     │              │     │           ├─ graph_layout    │ │
│  │              │     │              │     │           └─ gardens         │ │
│  │              │     │              │     │                              │ │
│  │              │     │              │     │       ┌────────────────┐     │ │
│  │              │     │              │     │       │  mongot (ATLAS) │     │ │
│  │              │     │              │     │       │  $vectorSearch  │     │ │
│  │              │     │              │     │       └────────────────┘     │ │
│  └──────┬───────┘     └──────────────┘     └──────────────────────────────┘ │
│         │                                   ▲                                │
│         │                                   │                                │
│         ▼                                   │                                │
│  ┌──────────────┐     ┌──────────────┐     │                                │
│  │ OpenPlanner  │────▶│ graph-weaver │─────┘                                │
│  │   :7777      │     │   :8796      │                                      │
│  │              │     │ (GraphQL)    │                                      │
│  │ /v1/events   │     │              │                                      │
│  │  └─ projects │     │ /graphql     │                                      │
│  │     graph.edge→graph_edges        │                                      │
│  │ /v1/search   │     │              │                                      │
│  │ /v1/graph    │     │ /graph/view  │                                      │
│  │ /v1/jobs     │     │ /graph/edges │                                      │
│  └──────────────┘     └──────────────┘                                      │
│         │                                   ▲                                │
│         │                                   │                                │
│         ▼                                   │                                │
│  ┌──────────────┐     ┌──────────────┐     │                                │
│  │    proxx     │     │  proxx-db    │     │                                │
│  │   :8789      │     │  (DuckDB)    │     │                                │
│  │ (Embeddings) │     │              │     │                                │
│  └──────────────┘     └──────────────┘     │                                │
│                                              │                                │
│  ┌──────────────────────────────────────────┴────────────────────────────┐ │
│  │                    eros-eris-field-app (Force-Directed Graph)         │ │
│  │                                                                        │ │
│  │   Single Worker (profile: graph):                                      │ │
│  │     1x eros-eris-field-app processing all nodes                        │ │
│  │                                                                        │ │
│  │   20 Shards (profile: graph-20):                                       │ │
│  │     20x eros-eris-shard-{0-19}-of-20 each processing 1/20 of nodes     │ │
│  │     CPU pinning: cores 2-21 (leaving 0-1 free)                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database: Atlas Local (MongoDB + mongot)

**Why Atlas Local?**
- Includes mongot (Atlas Search) for native `$vectorSearch` aggregation stage
- Vector search index created automatically by `atlas-init.sh`
- Data persists in Docker volume across container recreations

**Key Features:**
- MongoDB 8.0 compatible
- Native vector similarity search via `$vectorSearch`
- No external embedding service needed for search (proxx still generates embeddings)

## Service Dependencies

```
mongodb (Atlas Local - healthy)
    │
    ├──▶ mongo-init (runs once: user + collections + indexes + vector search index)
    │        │
    │        └──▶ exits with success (or skips if already initialized)
    │
    └──▶ openplanner (depends on mongo-init completed)
             │
             └──▶ graph-weaver (depends on openplanner healthy)
                      │
                      └──▶ eros-eris-field-app (depends on graph-weaver healthy)
```

## Startup Sequence

Notes:
- `POST /v1/events` is the live projection path for structural graph edges. When Knoxx ingestion emits `graph.edge` events, OpenPlanner now upserts matching `graph_edges` rows immediately; no separate graph-edge backfill is required for new ingestion.
- `graph-weaver` is read-mostly at startup now. It no longer runs `pnpm install` against the mounted workspace on boot, which avoids root-owned `node_modules` churn and restart-only permission failures.


### Full Stack (Recommended)

```bash
cd /home/err/devel/services/openplanner

# Start everything with dev profile (includes Vite frontend)
docker compose --profile dev up -d

# Verify all services healthy
docker compose ps
```

### Knoxx Voice STT on Intel NPU (optional)

This stack includes an **opt-in** Whisper STT service (`knoxx-stt-npu`) that can run on the **Intel NPU** via OpenVINO.

```bash
cd /home/err/devel/services/openplanner

# Start the STT service (requires /dev/accel/accel0 + host NPU runtime libs)
docker compose --profile npu up -d knoxx-stt-npu

# Sanity check
curl -sS http://127.0.0.1:8010/health | jq
```

Knoxx backend must be configured to use it:

```bash
export KNOXX_STT_BASE_URL=http://127.0.0.1:8010
```

Notes:
- The compose service mounts host-provided Level Zero NPU libraries + `libnpu_driver_compiler.so` into the container, and sets `LD_LIBRARY_PATH` accordingly.
- If your host has different library versions/paths, update the corresponding environment variables (see `services/openplanner/.env` for an example).

### Core Stack Only

```bash
# Start MongoDB and OpenPlanner core
docker compose up -d mongodb openplanner

# Verify OpenPlanner is healthy
curl http://localhost:7777/v1/health
```

### Graph Stack (Force-Directed Simulation)

```bash
# Single worker (default)
docker compose --profile graph up -d

# OR 20 shards (parallel processing)
docker compose --profile graph-20 up -d
```

## Teardown (Preserving Data)

```bash
# Stop all services but keep volumes
docker compose down

# Verify volumes persist
docker volume ls | grep openplanner
```

## Full Teardown (Including Data)

```bash
# Stop services and remove volumes
docker compose down -v

# This removes:
# - openplanner-atlas-data (MongoDB + Atlas data)
# - openplanner-knoxx-db (Knoxx SQLite)
# - openplanner-proxx-db (Embeddings cache)
```

## Volume Structure

```
openplanner-atlas-data/      # Atlas Local data (MongoDB + mongot)
├── WiredTiger               # Storage engine
├── WiredTiger.lock
├── mongod.lock
└── ...

openplanner-knoxx-db/        # Knoxx SQLite database
└── knoxx.db

openplanner-proxx-db/        # Embeddings cache (DuckDB)
└── proxx.duckdb
```

## Environment Variables

### MongoDB (Atlas Local)

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_ROOT_USERNAME` | `openplannerRoot` | Root user for admin database |
| `MONGODB_ROOT_PASSWORD` | `change-me-root-password` | Root password |
| `OPENPLANNER_MONGO_APP_USERNAME` | `openplanner` | Application user |
| `OPENPLANNER_MONGO_APP_PASSWORD` | `change-me-openplanner-password` | Application password |
| `MONGODB_DB` | `openplanner` | Database name |
| `EMBEDDING_DIMENSIONS` | `1024` | Vector embedding dimensions |

### OpenPlanner

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENPLANNER_PORT` | `7777` | API port |
| `OPENPLANNER_API_KEY` | `change-me` | API key for auth |
| `EMBED_PROVIDER_MODEL` | `qwen3-embedding:0.6b` | Hot embeddings model |
| `EMBED_PROVIDER_COMPACT_MODEL` | `qwen3-embedding:4b` | Compact embeddings model |

### Graph Simulation

| Variable | Default | Description |
|----------|---------|-------------|
| `SIM_MAX_NODES` | `6000` | Max nodes per fetch |
| `SIM_MAX_EDGES` | `12000` | Max edges per fetch |
| `SIM_SUBSTEPS` | `8` | Physics substeps per cycle |
| `SIM_DT` | `0.4` | Time step (larger = faster) |
| `SIM_WRITE_MS` | `5000` | Write interval (ms) |
| `GLOBAL_REPULSION` | `28` | Repulsion strength |
| `DAMPING` | `0.85` | Velocity damping |

## Common Operations

### Ingest Documents

```bash
# Priority ingest (bypasses KMS queue)
curl -X POST http://localhost:7777/api/documents/ingest/priority \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/home/err/devel/some-project/src"]}'
```

### Build Semantic Edges (uses $vectorSearch)

```bash
# Build semantic graph from embeddings via Atlas vector search
curl -X POST http://localhost:7777/v1/jobs/build-semantic-edges \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Seed Layout Positions

```bash
# Bootstrap layout for all graph nodes
curl -X POST http://localhost:7777/v1/jobs/seed-layout \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  -d '{"targetRadius": 5000}'
```

### Query Graph View

```bash
# GraphQL query for graph data
curl -X POST http://localhost:8796/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{graphView(maxNodes:100, maxEdges:200){nodes{id label x y} edges{source target} meta{totalNodes totalEdges}}}"
  }'
```

## Troubleshooting

### MongoDB Authentication Failed

**Cause**: App user not created (fresh volume)

**Fix**: The `mongo-init` container should create the user automatically. If it failed:

```bash
docker exec openplanner-mongodb-1 mongosh \
  -u openplannerRoot -p 'change-me-root-password' \
  --authenticationDatabase admin --quiet --eval '
db = db.getSiblingDB("openplanner");
db.createUser({
  user: "openplanner",
  pwd: "change-me-openplanner-password", // pragma: allowlist secret
  roles: [{role: "readWrite", db: "openplanner"}]
});'
```

### mongo-init Failing

**Cause**: MongoDB not healthy or connection issue

**Fix**: Ensure MongoDB is healthy first:

```bash
docker compose ps mongodb  # Should show "healthy"
docker compose restart mongo-init
```

### Vector Search Not Working

**Cause**: Vector search index not created

**Fix**: Check if index exists and create manually if needed:

```bash
# List search indexes
docker exec openplanner-mongodb-1 mongosh \
  -u openplannerRoot -p 'change-me-root-password' \
  --authenticationDatabase admin --quiet --eval '
db.getSiblingDB("openplanner").runCommand({listSearchIndexes: "event_chunks"})'

# Create index manually
docker exec openplanner-mongodb-1 mongosh \
  -u openplannerRoot -p 'change-me-root-password' \
  --authenticationDatabase admin --quiet --eval '
db.getSiblingDB("openplanner").runCommand({
  createSearchIndex: "event_chunks",
  name: "chunk_vector",
  definition: {
    fields: [{
      type: "vectorSearch",
      path: "embedding",
      numDimensions: 1024,
      similarity: "cosine"
    }]
  }
})'
```

### Embedding Provider 404 (model not found)

If you see errors like:

```
Embed provider failed: 404 Not Found
... model "qwen3-embedding:0.6b" not found, try pulling it first
```

that means the Proxx embedding upstream (default: Ollama) does not have the embedding model pulled.

**Fix (recommended): route embeddings through llama.cpp instead of Ollama**

1) Start the llama.cpp embedding server (joins the shared `ai-infra` network):

```bash
cd /home/err/devel/services/llamacpp-stack
docker compose up -d llamacpp-embed
```

2) Tell OpenPlanner to request embeddings via the `llamacpp-embed` provider (Proxx will normalize `:` → `-` for llama.cpp):

```bash
cd /home/err/devel/services/openplanner

# one-shot override (or put these in your env file)
EMBED_PROVIDER_MODEL='llamacpp-embed:qwen3-embedding:0.6b' \
EMBED_PROVIDER_COMPACT_MODEL='llamacpp-embed:qwen3-embedding:0.6b' \
docker compose up -d openplanner
```

3) Verify:

```bash
curl -fsS http://localhost:7777/v1/health
```

If you prefer the Ollama path, you can instead pull the missing model into the Ollama instance Proxx is pointing at.

### graph-weaver Crash Loop

**Common causes**:
- OpenPlanner is not healthy/reachable yet
- historical workspace permission drift from startup-time package-manager mutations

**Fix**:

```bash
curl http://localhost:7777/v1/health
docker compose up -d graph-weaver
```

`graph-weaver` no longer runs `pnpm install` on boot, so routine restarts should not mutate mounted `node_modules`.

### eros-eris Permission Denied

**Cause**: `corepack enable` requires root

**Fix**: Services now use `npx pnpm` instead. Rebuild:

```bash
docker compose up -d --force-recreate eros-eris-field-app
```

### No Graph Data

**Cause**: Documents not ingested or semantic edges not built

**Fix**: Run the pipeline:

```bash
# 1. Ingest documents
curl -X POST http://localhost:7777/api/documents/ingest/priority \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/path/to/code"]}'

# 2. Build semantic edges (uses $vectorSearch)
curl -X POST http://localhost:7777/v1/jobs/build-semantic-edges \
  -H "Authorization: Bearer change-me"

# 3. Seed layout
curl -X POST http://localhost:7777/v1/jobs/seed-layout \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  -d '{"targetRadius": 5000}'
```

## Compose Files and Profiles

`docker-compose.yml` is a small include/root file. Service definitions live in `compose/*.yml`; see `README.md` and `compose/README.md` for the fragment map.

| Profile | Services | Use Case |
|---------|----------|----------|
| (none) | mongodb, mongot, mongo-init, openplanner, default workers | Main API; no prod profile required |
| `dev` | openplanner-dev | Optional watch-mode backend on `${OPENPLANNER_DEV_PORT:-7778}` |
| `bundled-proxx` | openplanner-proxx, openplanner-proxx-db | Isolated local embedding proxy |
| `container-vexx` | vexx | Containerized Vexx |
| `graph` | graph-weaver, semantic/field graph workers | Force-directed simulation (1 worker) |
| `graph-2`, `graph-3`, `graph-20` | sharded graph workers | Parallel graph processing |
| `jobs` | semantic-graph-builder | Optional background graph build job |
| `legacy-translation-worker` | translation-worker | Legacy translation worker |

There is intentionally no `prod`/`production` profile for the main OpenPlanner API.

## Health Check Commands

```bash
# Check all services
docker compose ps

# MongoDB
docker exec openplanner-mongodb-1 mongosh --quiet -u openplannerRoot -p 'change-me-root-password' --authenticationDatabase admin --eval 'db.adminCommand("ping")'

# OpenPlanner
curl -s http://localhost:7777/v1/health | jq .

# Graph Weaver
curl -s http://localhost:8796/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{__typename}"}' | jq .

# Knoxx Backend
curl -s http://localhost:5200/health | jq .

# Knoxx Frontend (dev)
curl -s http://localhost:5400/ | head -5
```

## Key Scripts

| Script | Purpose |
|--------|---------|
| `scripts/atlas-init.sh` | Idempotent Atlas Local initialization (user, collections, indexes, vector search index) |

## Proven Workflow

The following workflow has been tested and verified to work:

```bash
# 1. Full teardown (optional - only if starting fresh)
cd /home/err/devel/services/openplanner
docker compose down -v

# 2. Start full stack with dev profile
docker compose --profile dev up -d

# 3. Wait for initialization
sleep 30

# 4. Verify all services healthy
docker compose ps

# 5. Check OpenPlanner
curl http://localhost:7777/v1/health

# 6. Verify vector search index exists
docker exec openplanner-mongodb-1 mongosh \
  -u openplannerRoot -p 'change-me-root-password' \
  --authenticationDatabase admin --quiet --eval '
db.getSiblingDB("openplanner").runCommand({listSearchIndexes: "event_chunks"})'

# To stop (preserving data):
docker compose down

# To verify data persisted after restart:
docker compose --profile dev up -d
docker exec openplanner-mongodb-1 mongosh \
  -u openplannerRoot -p 'change-me-root-password' \
  --authenticationDatabase admin --quiet --eval \
  'db.getSiblingDB("openplanner").getCollectionNames()'
```

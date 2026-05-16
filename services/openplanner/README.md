# OpenPlanner Docker Stack

**Split Compose stack. MongoDB Community Server. Main OpenPlanner is not profile-gated.**

## Quick Reference

| What | Value |
|------|-------|
| Compose root | `docker-compose.yml` |
| Service fragments | `compose/*.yml` |
| Main app service | `openplanner` (default profile; no `prod` profile required) |
| MongoDB image | `mongo:8.0` (Community Server) |
| Vector search | Handled by canonical `services/proxx` by default; bundled `openplanner-proxx` is opt-in via `--profile bundled-proxx` |
| Init service | `mongo-init` (runs once, `restart: "no"`) |

## Compose Layout

`docker-compose.yml` is intentionally small. It defines the project name, shared volumes/networks, and includes service fragments:

| File | Contents |
|------|----------|
| `compose/storage.yml` | MongoDB, mongot, mongo-init, secret init, Knoxx Postgres/Redis |
| `compose/openplanner.yml` | Main OpenPlanner app and migration workers |
| `compose/dev.yml` | Optional watch-mode backend on `OPENPLANNER_DEV_PORT` |
| `compose/proxx.yml` | Optional bundled Proxx/Vexx services |
| `compose/graph-core.yml` | Graph weaver and single semantic/field workers |
| `compose/graph-shards-2.yml` | 2-way graph shard profile |
| `compose/graph-shards-3.yml` | 3-way graph shard profile |
| `compose/graph-shards-20.yml` | 20-way graph shard profile |
| `compose/ingestion.yml` | Shuvcrawl, Myrmex, semantic graph builder, translation worker |

## Architecture

```
docker-compose.yml       tiny include/root file
compose/storage.yml      persistent dependencies
compose/openplanner.yml  main API on ${OPENPLANNER_PORT:-7777}
compose/dev.yml          optional dev API on ${OPENPLANNER_DEV_PORT:-7778}
compose/proxx.yml        optional bundled embedding stack
compose/graph-*.yml      graph workers and shard profiles
compose/ingestion.yml    ingestion and background workers
```

## Why MongoDB Community Server (NOT Atlas Local)

Atlas Local generates replica set names from container IDs. When containers are recreated:
1. Old replica set config in persistent volume references old container ID
2. New container has different ID
3. MongoDB fails: "node is not in primary or recovering state"
4. **Data cannot persist across container recreations**

MongoDB Community Server in standalone mode (no replica set) allows:
- Data persistence across container recreations
- Simpler configuration
- Standard MongoDB 8.0 features

**Trade-off**: No native vector search in MongoDB. Vector search is handled by Proxx; the default local path is the canonical `services/proxx` stack, with `openplanner-proxx` reserved for opt-in isolated runs.

## Startup Sequence

### Quick Start (Main API Only)

```bash
cd /home/err/devel/services/openplanner

# Starts default-profile services, including the main OpenPlanner API.
# No prod profile is required.
docker compose up -d mongodb mongo-init openplanner

curl http://localhost:${OPENPLANNER_PORT:-7777}/v1/health
```

### Optional Dev Backend

Run this only when you explicitly want a second watch-mode backend on a different port:

```bash
cd /home/err/devel/services/openplanner
docker compose up -d mongo-init        # grants app user access to the dev DB too
docker compose --profile dev up -d openplanner-dev
curl http://localhost:${OPENPLANNER_DEV_PORT:-7778}/v1/health
```

`openplanner-dev` is intentionally isolated from the main API:

| Surface | Main API | Dev API |
|---------|----------|---------|
| HTTP port | `${OPENPLANNER_PORT:-7777}` | `${OPENPLANNER_DEV_PORT:-7778}` |
| Mongo database | `${MONGODB_DB:-openplanner}` | `${OPENPLANNER_DEV_MONGODB_DB:-openplanner_dev}` |
| Data dir | `./openplanner-lake` | `./openplanner-lake-dev` |
| Migration graph | enabled by default | disabled unless `OPENPLANNER_DEV_MIGRATION_GRAPH_URL` is set |

Do not run `openplanner` and `openplanner-dev` as interchangeable endpoints. Point clients at one deliberate base URL, usually:

```bash
export OPENPLANNER_BASE_URL=http://127.0.0.1:${OPENPLANNER_PORT:-7777}
```

Default local development assumes the canonical `services/proxx` stack is already running on the shared `ai-infra` network. Only enable the bundled proxy when you explicitly want an isolated OpenPlanner-local Proxx runtime:

```bash
docker compose --profile bundled-proxx up -d openplanner-proxx
```

### Core Stack Only

```bash
# Start MongoDB and OpenPlanner core
docker compose up -d mongodb
docker compose up -d openplanner

# Verify OpenPlanner is healthy
curl http://localhost:7777/v1/health
```

### Graph Stack (Force-Directed Simulation)

```bash
# Single worker
docker compose --profile graph up -d

# 20 shards (parallel processing)
docker compose --profile graph-20 up -d
```

## MONGODB_URI Format

Community Server uses simple auth format (no replicaSet parameter):

```
mongodb://${OPENPLANNER_MONGO_APP_USERNAME:-openplanner}:${OPENPLANNER_MONGO_APP_PASSWORD:-change-me-openplanner-password}@mongodb:27017/${MONGODB_DB:-openplanner}?authSource=${MONGODB_DB:-openplanner}
```

## Environment Variables

All variables have sensible defaults. Override in `.env` or host environment.

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONGODB_ROOT_USERNAME` | `openplannerRoot` | MongoDB root user |
| `MONGODB_ROOT_PASSWORD` | `change-me-root-password` | MongoDB root password |
| `MONGODB_DB` | `openplanner` | Application database name |
| `OPENPLANNER_MONGO_APP_USERNAME` | `openplanner` | Application readWrite user |
| `OPENPLANNER_MONGO_APP_PASSWORD` | `change-me-openplanner-password` | Application user password |
| `OPENPLANNER_PORT` | `7777` | Main app port |
| `OPENPLANNER_DEV_PORT` | `7778` | Dev backend watch service host port |
| `OPENPLANNER_API_KEY` | `change-me` | API key for HTTP access |

## Common Operations

### Fresh start (wipes all data)
```bash
docker compose down -v   # -v removes volumes
docker compose up -d mongodb mongo-init openplanner
# Wait for services healthy, then verify:
docker compose ps
```

### Restart without losing data
```bash
docker compose restart openplanner
# Or to stop completely:
docker compose down
docker compose up -d mongodb mongo-init openplanner
```

### Verify MongoDB connection
```bash
docker exec openplanner-mongodb-1 mongosh \
  -u openplannerRoot -p 'change-me-root-password' \
  --authenticationDatabase admin --quiet \
  --eval 'db.getSiblingDB("openplanner").getCollectionNames()'
```

### Re-run init script (e.g., after adding new collections)
```bash
docker compose up -d mongo-init --force-recreate
```

## Service Ports

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| MongoDB | 27017 | 27017 |
| OpenPlanner | 7777 | 7777 |
| Graph Weaver | 8796 | 8796 |
| Proxx | 8789 | 8790 |
| Knoxx Frontend (dev) | 5173 | 5173 |
| Knoxx Nginx | 80 | 80 |
| Shibboleth | 8088 | 8097 |

## Profiles

| Profile | Services | Use Case |
|---------|----------|----------|
| (none) | `mongodb`, `mongo-init`, `openplanner`, and other default workers | Main stack; OpenPlanner API is available without a profile |
| `dev` | `openplanner-dev` | Optional watch-mode backend on `OPENPLANNER_DEV_PORT` |
| `bundled-proxx` | `openplanner-proxx`, `openplanner-proxx-db` | Isolated local embedding proxy |
| `container-vexx` | `vexx` | Containerized Vexx service |
| `graph` | semantic graph workers | Force-directed simulation |
| `graph-2` / `graph-3` / `graph-20` | sharded graph workers | Parallel graph processing |
| `jobs` | `semantic-graph-builder` | Optional background graph build job |
| `legacy-translation-worker` | `translation-worker` | Legacy translation worker |

There is intentionally no `prod`/`production` profile for the main OpenPlanner API.

## Troubleshooting

### MongoDB Authentication Failed

The `mongo-init` container creates the app user automatically. If it failed:

```bash
docker exec openplanner-mongodb-1 mongosh \
  -u openplannerRoot -p 'change-me-root-password' \
  --authenticationDatabase admin --quiet --eval '
db = db.getSiblingDB("openplanner");
db.createUser({
  user: "openplanner",
  pwd: process.env.OPENPLANNER_MONGO_APP_PASSWORD,  # pragma: allowlist secret
  roles: [{role: "readWrite", db: "openplanner"}]
});'
```

### Knoxx Frontend Keeps Restarting

Ensure you're using the `dev` profile:

```bash
docker compose --profile dev up -d
```

### Nginx Crash Loop

Nginx requires `knoxx-frontend-dev` to be healthy. If it's crashing:

```bash
docker compose logs knoxx-frontend-dev --tail 50
```

## Historical Context

### Why We Switched from Atlas Local (April 2026)

Atlas Local was causing persistent volume issues:
- Replica set names derived from container IDs
- Data loss on container recreation
- Manual intervention required after every restart

Community Server in standalone mode provides reliable volume persistence.

### Removed Files

The following files were removed as they are specific to Atlas Local:
- `docker-compose.atlas.yml` — atlas local overlay
- `config/mongod.conf` — community server replica set config
- `config/mongot.yml` — separate mongot container config
- `scripts/atlas-init.sh` — Atlas-specific init script

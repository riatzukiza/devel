# FutureSight KMS Service Stack

Isolated Docker Compose stack with nginx reverse proxy for multi-tenant knowledge management.

## Quick Start

```bash
# Create .env (first time)
cp .env.example .env

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f nginx

# Stop
docker compose down
```

## Service URLs

All services are proxied through a custom baked nginx image on port 80:

| Path | Service | Description |
|------|---------|-------------|
| `/` | Knoxx Frontend | Static build by default, Vite dev server in `frontend-dev` profile |
| `/api/ragussy/*` | Ragussy Backend | RAG + inference |
| `/api/chat` | Ragussy Backend | Chat endpoint |
| `/api/models` | Ragussy Backend | Model list |
| `/api/server/*` | Ragussy Backend | Server control |
| `/v1/*` | Ragussy Backend | OpenAI-compatible |
| `http://localhost:8097/` | Shibboleth UI | Promptbench control plane + labeling |
| `http://localhost:8097/api/*` | Shibboleth API | Control-plane API |
| `/api/km-labels/*` | KM Labels | Label CRUD |
| `/api/tenants/*` | KM Labels | Tenant management |
| `/api/export/*` | KM Labels | SFT/RLHF export |
| `/api/openplanner/*` | OpenPlanner API | Lake, graph, and embedding API behind nginx |
| `/ws/stream` | Ragussy | WebSocket streaming |
| `http://localhost:8796/` | Graph Weaver | Local graph workbench UI |
| `http://localhost:3777/health` | ShuvCrawl | Browser-backed extraction API |

## Isolated Networking

The stack uses an internal `kms-internal` network. Services cannot be reached from outside Docker except through nginx on port 80.

## Development

```bash
# Refresh the vendored Shibboleth UI assets before rebuilding nginx
rsync -a --delete ../../orgs/octave-commons/shibboleth/ui/dist/ ./vendor/shibboleth-ui-dist/

# Start stack
 docker compose --env-file .env up -d

# Build only nginx after UI/config changes
 docker compose build nginx

# Rebuild all
 docker compose build --no-cache
```

### Knoxx frontend dev mode

Use the Knoxx Vite dev server behind nginx when iterating on UI work:

```bash
cd services/knoxx

# Recommended helper - starts dev mode with hot reload
./start.sh --dev --detach

# Or with logs
./start.sh --dev --logs

# Raw compose equivalent
COMPOSE_PROFILES=dev \
KNOXX_FRONTEND_UPSTREAM_HOST=knoxx-frontend-dev \
KNOXX_FRONTEND_UPSTREAM_PORT=5173 \
KNOXX_BACKEND_DOCKERFILE=Dockerfile.dev \
KNOXX_BACKEND_WORKDIR=/app/workspace/devel/orgs/open-hax/knoxx/backend \
KNOXX_BACKEND_COMMAND='./scripts/dev-watch.sh' \
KNOXX_BACKEND_NODE_ENV=development \
KNOXX_BACKEND_HEALTH_START_PERIOD=300s \
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**Dev mode features:**
- Frontend accessible at `http://localhost:5173` (direct Vite) AND `http://localhost/` (via nginx)
- Hot module replacement (HMR) - changes to frontend source files auto-reload in browser
- Backend source changes trigger a fresh `shadow-cljs release app` build and backend process restart
- WebSocket support for Vite HMR through nginx
- Source code mounted from host, no image rebuild needed for normal dev edits

**How it works:**
1. `knoxx-frontend-dev` container runs Vite dev server on port 5173
2. `knoxx-backend` runs `./scripts/dev-watch.sh`, which polls backend source files, rebuilds with `shadow-cljs release app`, and restarts the Node process after each successful rebuild
3. nginx routes `/` to the Vite dev server instead of static build
4. HMR WebSocket (`/__vite_hmr`) proxied through nginx
5. File changes in `orgs/open-hax/knoxx/frontend/src/` trigger Vite HMR and backend CLJS edits trigger automatic backend restarts

Notes:
- Backend restart resilience is exercised continuously in dev mode because code changes restart the backend process automatically
- If you want to force a manual restart anyway, use `docker compose -f docker-compose.yml -f docker-compose.dev.yml restart knoxx-backend`
- Production mode uses baked static frontend container (`knoxx-frontend:80`)

## Graph runtime

The graph runtime has moved to `services/openplanner`.

Knoxx still integrates with OpenPlanner through `/api/openplanner/*`, but the graph
workbench, crawler, layout worker, and semantic graph builder are now started from
the OpenPlanner devops home.

## Adding HTTPS

1. Place SSL certificates in `config/ssl/`:
   - `fullchain.pem` - Full certificate chain
   - `privkey.pem` - Private key

2. Enable HTTPS config:
   ```bash
   mv config/conf.d/ssl.conf.example config/conf.d/ssl.conf
   ```

3. Set environment:
   ```bash
   echo "NGINX_HTTPS_PORT=443" >> .env
   ```

4. Restart nginx:
   ```bash
   docker compose restart nginx
   ```

## Health Checks

```bash
# All services
docker compose ps

# Individual health endpoints
curl http://localhost/health
curl http://localhost/api/ragussy/../health
curl http://localhost/api/shibboleth/../health
curl http://localhost/api/km-labels/../health
curl http://localhost/health/openplanner
curl http://localhost:8796/api/status
curl http://localhost:3777/health
```

## Data Persistence

Volumes are created automatically:
- `ragussy-models` - Model files
- `ragussy-runs` - Inference runs
- `shibboleth-data` - DSL datasets and chat-lab session data
- `km-labels-data` - Label exports
- `shuvcrawl-data` - Browser profiles, cache, crawl state
- `shuvcrawl-output` - Extracted markdown/artifacts
- `qdrant-storage` - Vector index
- `postgres-data` - Metadata + labels
- `redis-data` - Cache data

To reset all data:
```bash
docker compose down -v
```

## Architecture

```
                ┌─────────────────┐
                │     nginx:80    │
                │  (reverse proxy) │
                └────────┬────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   ┌──────────┐   ┌───────────┐   ┌──────────┐
   │ Ragussy  │   │ Shibboleth│   │ KM Labels│
   │  :8000   │   │   :3001   │   │  :3002   │
   └────┬─────┘   └───────────┘   └────┬─────┘
        │                               │
        └───────────────┬───────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌─────────┐
   │  Qdrant  │  │ Postgres │  │  Redis  │
   │  :6333   │  │  :5432   │  │  :6379  │
   └──────────┘  └──────────┘  └─────────┘
```

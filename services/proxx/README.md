# proxx devops home

Canonical source: `../../orgs/open-hax/proxx`

This directory is the workspace-local home for runtime and deployment material for the proxy service:
- Docker Compose files
- env examples
- local runtime config (`keys.json`, `models.json`)
- bind-mounted runtime data under `data/`

Read `RUNTIME_BOUNDARY.md` before changing local ports or databases. The short version:
- Docker compose `prod` is the primary local work instance used by Knoxx: API `8789`, web `5174`, DB `15432`.
- PM2 `proxx-host` is only a dev sidecar: API `18789`, web `15174`, DB `15439`.
- PM2 must never bind `8789` or `5174`.

The compose project name stays `open-hax-openai-proxy` so the migration keeps the existing named Postgres volume and container identity when you switch over from `services/open-hax-openai-proxy`.

## HTTPS / reverse proxy
- `docker-compose.ssl.yml` adds a Caddy TLS frontend for `ussy.promethean.rest`.
- `Caddyfile` routes `/v1*`, `/api*`, `/auth*`, and `/health` to the API on `8789`, and everything else to the web UI on `5174`.
- On hosts where you want TLS, run compose with both files:

```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d --build
```

## Runtime boundary

Canonical boundary doc: [`RUNTIME_BOUNDARY.md`](./RUNTIME_BOUNDARY.md).

Primary local Proxx for real work and Knoxx embeddings:

```bash
cd /home/err/devel/services/proxx
docker compose --profile prod up -d --build proxx
```

Host PM2 dev sidecar with separate dev DB:

```bash
cd /home/err/devel/services/proxx
docker compose -f docker-compose.dev-db.yml up -d proxx-dev-db
./scripts/seed-dev-db-from-prod.sh
pm2 start ecosystem.host.config.cjs --only proxx-host,proxx-host-web --no-autorestart
```

## Local compose
```bash
cd /home/err/devel/services/proxx
cp .env.example .env   # optional
cp keys.example.json keys.json
cp models.example.json models.json

# Production-like container (pm2 + built dist/):
docker compose --profile prod -f docker-compose.yml -f docker-compose.factory-auth.override.yml up --build -d

# OR bind-mounted dev container (debounced restarts on src/web changes):
# docker compose --profile dev -f docker-compose.yml -f docker-compose.factory-auth.override.yml up --build -d

docker compose ps
docker compose logs -f
```

If you do not need Factory auth mounts, omit the override file.

If you want z.ai/GLM routing in the local compose stack, set `ZAI_API_KEY` (or `ZHIPU_API_KEY`) in `services/proxx/.env` before `docker compose up`; `docker-compose.yml` passes those vars through to the running proxy container.

Pricing override commandment: if token pricing is missing/incorrect for a model (for example open-weights models like `gemma4:31b`), overrides must be added as EDN policy contracts under `services/proxx/policies/runtime/15-model-pricing-overrides.edn`. Do not add pricing override JSON files and do not hard-code one-off token prices in TypeScript.

Optional factory-auth secret mounts live in `docker-compose.factory-auth.override.yml`; include that file only when you have the matching host paths/env vars.

## Host fleet dashboard

The proxx web console now includes a **Hosts** page for multi-host ops.

Runtime requirements:
- `docker.sock` is mounted read-only into the proxx container so it can enumerate local containers
- the runtime directory is mounted read-only at `/workspace/runtime-repo` so the API can parse the active `Caddyfile`

Recommended env on `ussy.promethean.rest`:

```bash
HOST_DASHBOARD_SELF_ID=ussy
HOST_DASHBOARD_TARGETS_JSON=[{"id":"ussy","label":"ussy.promethean.rest","baseUrl":"https://ussy.promethean.rest"},{"id":"ussy3","label":"ussy3.promethean.rest","baseUrl":"https://ussy3.promethean.rest","authTokenEnv":"HOST_DASHBOARD_USSY3_TOKEN"}]
HOST_DASHBOARD_USSY3_TOKEN=<staging-proxy-auth-token>
```

If a future host is not reachable yet, keep it in `HOST_DASHBOARD_TARGETS_JSON` anyway — the page will render an error card instead of disappearing the host.

## Root stack wrapper
From `/home/err/devel`:
```bash
pnpm docker:stack status open-hax-openai-proxy
pnpm docker:stack use-container open-hax-openai-proxy -- --build
pnpm docker:stack logs open-hax-openai-proxy -- -f
```

## Big Ussy Path

The canonical devel -> `big.ussy.promethean.rest` pathway is:

1. Local canonical Proxx runs at `http://127.0.0.1:8789`
2. Remote canonical Proxx runs at `http://big.ussy.promethean.rest:8789`
3. Local -> remote sync uses peer id `big-ussy-canonical`
4. Remote -> local sync uses peer id `local-core`
5. Remote -> local reachability is through a reverse SSH tunnel and a remote host relay:
   - reverse SSH forward on remote host: `127.0.0.1:18789 -> 127.0.0.1:8789` on the local workstation
   - remote host relay exposed to containers: `0.0.0.0:18790 -> 127.0.0.1:18789`
   - container-visible local canonical URL: `http://host.docker.internal:18790`

The deployment/bootstrap entrypoint is:

```bash
services/proxx/bin/project-complete-devel-stack-to-big-ussy.sh --apply
```

What it is responsible for:

- build and sync the local workspace artifacts required by the remote stack
- write remote env files
- ensure the remote `ai-infra` network exists
- create the reverse SSH tunnel and durable remote `socat` relay
- bring up the remote canonical and spoke stacks
- register federation peers with the repaired ids and URLs
- prime canonical sync once in both directions
- start background canonical sync daemons

Expected live peer shape on `big.ussy` for the local canonical peer:

```json
{
  "id": "local-core",
  "peerDid": "did:web:proxx.promethean.rest:err-local",
  "baseUrl": "http://host.docker.internal:18790",
  "controlBaseUrl": "http://host.docker.internal:18790"
}
```

Health checks that matter after deploy:

```bash
curl -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
  https://federation.big.ussy.promethean.rest/api/v1/credentials?reveal=false

curl -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
  https://federation.big.ussy.promethean.rest/api/v1/credentials/openai/quota

curl -X POST -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"peerId":"local-core","ownerSubject":"did:web:proxx.promethean.rest:brethren","pullUsage":false}' \
  https://federation.big.ussy.promethean.rest/api/v1/federation/sync/pull
```

Notes:

- The credentials and quota pages intentionally show all currently available accounts, not just accounts visible from one backing store. They merge runtime-visible key-pool accounts with credential-store metadata.
- If remote sync regresses to `fetch failed`, verify both the live `local-core` peer URL and the remote relay listener on `18790` before changing Proxx code.

## Source workflows
For source edits, work in `../../orgs/open-hax/proxx`.

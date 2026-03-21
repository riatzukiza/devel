# proxx devops home

Canonical source: `../../orgs/open-hax/proxx`

This directory is the workspace-local home for runtime and deployment material for the proxy service:
- Docker Compose files
- env examples
- local runtime config (`keys.json`, `models.json`)
- bind-mounted runtime data under `data/`

The compose project name stays `open-hax-openai-proxy` so the migration keeps the existing named Postgres volume and container identity when you switch over from `services/open-hax-openai-proxy`.

## HTTPS / reverse proxy
- `docker-compose.ssl.yml` adds a Caddy TLS frontend for `ussy.promethean.rest`.
- `Caddyfile` routes `/v1*`, `/api*`, `/auth*`, and `/health` to the API on `8789`, and everything else to the web UI on `5174`.
- On hosts where you want TLS, run compose with both files:

```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d --build
```

## Local compose
```bash
cd /home/err/devel/services/proxx
cp .env.example .env   # optional
cp keys.example.json keys.json
cp models.example.json models.json
docker compose -f docker-compose.yml -f docker-compose.factory-auth.override.yml up --build -d
docker compose ps
docker compose logs -f
```

If you do not need Factory auth mounts, omit the override file.

If you want z.ai/GLM routing in the local compose stack, set `ZAI_API_KEY` (or `ZHIPU_API_KEY`) in `services/proxx/.env` before `docker compose up`; `docker-compose.yml` passes those vars through to the running proxy container.

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

## Source workflows
For source edits, work in `../../orgs/open-hax/proxx`.

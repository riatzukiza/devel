# Proxx local runtime boundary

This file is the local workstation contract for Proxx. Keep this boundary obvious.

## Primary local Proxx: Docker compose prod

This is the instance other local apps use for work, including Knoxx embeddings.

- Compose files: `docker-compose.yml` plus optional runtime overrides.
- App service: `proxx-local-proxx-1`.
- Database service: `proxx-local-proxx-local-db-1`.
- Database host port: `127.0.0.1:15432` / container `5432`.
- Proxy/API port: `0.0.0.0:8789`.
- Web port: `127.0.0.1:5174`.
- OAuth callback port: `127.0.0.1:1455`.

Do not use these ports for PM2 or CLJS development sidecars.

Commands:

```bash
cd /home/err/devel/services/proxx
docker compose --profile prod up -d --build proxx
```

Health:

```bash
curl http://127.0.0.1:8789/health
```

## Host PM2 Proxx: development sidecar

This is a separate host-side dev instance. It must never bind the primary Docker prod ports.

- PM2 apps: `proxx-host`, `proxx-host-web`.
- Wrapper: `scripts/run-host-proxx.sh`.
- PM2 config: `ecosystem.host.config.cjs`.
- Database: dedicated dev DB `proxx-dev-local-proxx-dev-db-1`.
- Database host port: `127.0.0.1:15439` / container `5432`.
- Proxy/API port: `127.0.0.1:18789`.
- Web port: `127.0.0.1:15174`.
- OAuth callback port: `127.0.0.1:18755`.

Commands:

```bash
cd /home/err/devel/services/proxx
docker compose -f docker-compose.dev-db.yml up -d proxx-dev-db
pm2 start ecosystem.host.config.cjs --only proxx-host,proxx-host-web --no-autorestart
```

Health:

```bash
curl http://127.0.0.1:18789/health
curl http://127.0.0.1:15174/
```

## Dev database seeding

The PM2 dev DB is seeded from the current Docker prod DB credential/provider subset only.

Seed script:

```bash
cd /home/err/devel/services/proxx
./scripts/seed-dev-db-from-prod.sh
```

The script copies these tables from `proxx-local-proxx-local-db-1` into `proxx-dev-local-proxx-dev-db-1`:

- `providers`
- `accounts`
- `tenant_provider_policies`
- `account_health`
- `account_cooldown`

It intentionally does not copy request logs, sessions, OAuth persistence tables, or other operational state.

Current seed smoke result:

- providers: `15`
- accounts: `312`
- account_health: `305`
- account_cooldown: `100`

## Boundary invariants

- Knoxx and normal workstation traffic use Docker prod at `8789`.
- PM2 development uses `18789` and never replaces Docker prod.
- Docker prod DB uses `15432`; PM2 dev DB uses `15439`.
- CLJS policy/runtime experiments happen on the PM2 sidecar or explicit shadow stacks, not on the primary work instance unless intentionally promoted.
- If `ss -ltnp` shows PM2 owning `8789` or `5174`, that is a bug.
- If Docker prod is down and Knoxx embeddings fail, restore Docker prod before debugging PM2.

## Quick status checklist

```bash
cd /home/err/devel/services/proxx

docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep -E 'proxx-local-proxx-1|proxx-local-proxx-local-db-1|proxx-dev-local-proxx-dev-db-1'
pm2 status | grep -E 'proxx-host|proxx-host-web'
ss -ltnp | grep -E ':(8789|5174|18789|15174|15432|15439)\\b'
```

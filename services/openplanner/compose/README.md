# OpenPlanner Compose fragments

`../docker-compose.yml` is the only file Docker Compose needs by default. It uses Compose `include` to load these fragments.

## Default use

```bash
cd /home/err/devel/services/openplanner
docker compose up -d mongodb mongo-init openplanner
curl http://localhost:${OPENPLANNER_PORT:-7777}/v1/health
```

The main `openplanner` service is not behind a `prod` profile. If a client needs the API, point it at:

```bash
export OPENPLANNER_BASE_URL=http://127.0.0.1:${OPENPLANNER_PORT:-7777}
```

## Fragments

- `storage.yml` — MongoDB/mongot/init and Knoxx Postgres/Redis stateful dependencies.
- `openplanner.yml` — main API and migration workers.
- `dev.yml` — optional watch-mode backend on `${OPENPLANNER_DEV_PORT:-7778}`.
- `proxx.yml` — optional bundled Proxx/Vexx services.
- `graph-core.yml` — graph weaver and non-sharded graph workers.
- `graph-shards-2.yml`, `graph-shards-3.yml`, `graph-shards-20.yml` — sharded graph worker profiles.
- `ingestion.yml` — crawler/ingestion/background job services.

## Optional profiles

```bash
# Dev backend only when you explicitly want a second API port.
# It uses OPENPLANNER_DEV_MONGODB_DB/openplanner-lake-dev, not the main DB/data dir.
docker compose up -d mongo-init
docker compose --profile dev up -d openplanner-dev

# Isolated bundled embedding stack
docker compose --profile bundled-proxx up -d openplanner-proxx

# Graph workers
docker compose --profile graph up -d
docker compose --profile graph-20 up -d
```

Avoid treating `openplanner-dev` as a fallback for `openplanner`; choose one endpoint and configure clients with `OPENPLANNER_BASE_URL`.

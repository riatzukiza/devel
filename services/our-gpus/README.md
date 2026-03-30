# our-gpus devops home

Canonical source: `../../orgs/shuv/our-gpus`

This directory is the workspace-local home for runtime and ingestion material for `our-gpus`:
- `compose.yaml` — local compose wrapper that builds from the canonical source repo
- `.env.example` — host port + runtime defaults
- `data/` — SQLite state bind mount for the API and worker
- `imports/` — drop Shodan-exported JSON/JSONL source lists here before ingest
- `SHODAN.md` — exact query + export commands for generating ingestable source lists

## Local compose
```bash
cd /home/err/devel/services/our-gpus
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Default local endpoints:
- Web UI: `http://127.0.0.1:15173`
- API: `http://127.0.0.1:18000`
- API docs: `http://127.0.0.1:18000/docs`

The runtime binds to loopback by default. Override `OUR_GPUS_BIND_HOST=0.0.0.0` only when you explicitly want direct network exposure.

## Ingesting a source list
Upstream notes say the app still needs an external source list, and Shodan was the previous source.

Recommended flow:
1. Put the exported `*.json` or `*.jsonl` file in `services/our-gpus/imports/`
2. Start the stack with `docker compose up -d --build`
3. Ingest via either:

```bash
# UI upload path: navigate to http://127.0.0.1:15173

# CLI path from the running API container
docker compose exec api \
  python /workspace/source/cli/ingest_json.py /workspace/imports/<file>.jsonl --auto-detect
```

You can also re-probe discovered hosts from the running API container:

```bash
docker compose exec api \
  python /workspace/source/cli/rescan_hosts.py --status offline --limit 100
```

## Source workflows
For source edits, work in `../../orgs/shuv/our-gpus`.

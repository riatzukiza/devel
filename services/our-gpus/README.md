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

## Tor-routed probing
Use the Tor overlay when you want outbound probe traffic to go through the Promethean Tor relays:

```bash
cd /home/err/devel/services/our-gpus
cp .env.example .env
docker compose -f compose.yaml -f docker-compose.tor.yml up -d --build
docker compose -f compose.yaml -f docker-compose.tor.yml ps
```

Under the Tor overlay:
- `api`, `worker`, and `probe-sidecar` outbound HTTP probing use `privoxy -> tor`
- worker batch probes go through `probe-sidecar`
- scan strategy `tor` performs exclusion-aware HTTP discovery through the Tor relays
- raw scan strategy `masscan` is blocked intentionally so it cannot leak direct egress while Tor mode is enabled

### Layered exclusions
The scanner now uses layered exclusions via `OUR_GPUS_EXCLUDE_FILES`:

- `/app/excludes.conf`: curated static high-risk ranges
- `/app/excludes.generated.conf`: refreshed cloud/CDN/provider ranges

Both `masscan` and `tor` strategies refuse to run if the combined exclusion set is empty.

Refresh the generated layer with:

```bash
cd /home/err/devel/orgs/shuv/our-gpus
uv run python cli/refresh_dynamic_excludes.py \
  --output /home/err/devel/services/our-gpus/excludes.generated.conf
```

### Scan strategies
`our-gpus` now exposes two scan strategies on the existing `POST /api/masscan` endpoint:

- `masscan`: raw packet scanner, still uses `excludes.conf`, unavailable while Tor mode requires fail-closed egress
- `tor`: HTTP-based exclusion-aware discovery that probes candidate hosts through `privoxy -> tor`

Example Tor scan request:

```bash
curl -X POST http://127.0.0.1:18000/api/masscan \
  -H 'Content-Type: application/json' \
  -d '{
    "strategy": "tor",
    "target": "198.51.100.0/24",
    "port": "11434"
  }'
```

The Tor scan strategy fails closed when:
- the exclude file is missing or empty
- the requested target expands beyond `TOR_SCAN_MAX_HOSTS`
- the target is entirely covered by excluded ranges

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

If you started with the Tor overlay, use the same `-f compose.yaml -f docker-compose.tor.yml` flags for `exec` commands.

## Source workflows
For source edits, work in `../../orgs/shuv/our-gpus`.

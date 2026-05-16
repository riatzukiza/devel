# Nexussy service notes

## Files

- `docker-compose.nexussy.yml` — local Nexussy core service
- `nexussy-data/home/` — persisted Nexussy home, config, env file, SQLite state
- `nexussy-data/projects/` — generated project worktrees and pipeline artifacts

## What this service runs

This compose stack runs the Nexussy **core** server.

It exposes:

- health: `http://127.0.0.1:7771/health`
- built-in browser UI: `http://127.0.0.1:7771/ui/`
- API root: `http://127.0.0.1:7771/`

The separate Python `web/` proxy app from the repo is not required for basic use because
Nexussy core already mounts a static UI at `/ui/`.

## Commands

Start or rebuild:

```bash
docker compose -f services/ussyverse/docker-compose.nexussy.yml up -d --build
```

Stop:

```bash
docker compose -f services/ussyverse/docker-compose.nexussy.yml down
```

Status:

```bash
docker compose -f services/ussyverse/docker-compose.nexussy.yml ps
curl http://127.0.0.1:7771/health
```

Logs:

```bash
docker compose -f services/ussyverse/docker-compose.nexussy.yml logs -f
```

## Provider keys

The container passes through common provider env vars if present on the host.

Examples:

- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `ANTHROPIC_API_KEY`
- `OLLAMA_BASE_URL`

Without provider keys, Nexussy is still useful in mock/fake local validation modes.

## Current default worker mode

This service defaults to the bundled deterministic worker shim:

- `NEXUSSY_PI_COMMAND=nexussy-pi`

That is good for:

- smoke tests
- local pipeline validation
- contract testing

If you want real Pi worker execution inside Docker, extend the image to install the Pi CLI
and set:

```env
NEXUSSY_PI_COMMAND=pi
```

## Artifact location

Generated pipeline projects land under:

```text
services/ussyverse/nexussy-data/projects/
```

A sample smoke run currently exists under:

```text
services/ussyverse/nexussy-data/projects/nexussy-smoke/
```

## How this fits the wider stack

- **Nexussy** = software-delivery pipeline harness
- **Knoxx** = opinionated agent runtime / packaged workbench
- **OpenPlanner** = canonical event, memory, and graph lake
- **Fork Tales / Cephalon lineage** = deeper head/presence/world model

Practical rule:

- use **Nexussy** to produce plans, phases, handoffs, and changed-file receipts
- use **OpenPlanner** to remember and relate those artifacts over time
- use **Knoxx** to supervise, invoke, or query those systems through runtime contracts

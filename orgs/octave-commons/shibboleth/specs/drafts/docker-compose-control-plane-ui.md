# Docker Compose stack: Control Plane + React UI (DSL-mapped)

Created: 2026-03-15
Status: draft

## Goal
Provide a **docker compose stack** that exposes:

1. a **Control Plane API** that can:
   - enumerate registered DSL primitives (sources/transforms/pipelines)
   - generate pipeline instances (EDN) from UI state
   - run builds that *produce datasets* (including MT variants) and track run status/logs
2. a **React UI** whose elements map closely to DSL grammar elements, such that:
   - a given UI state corresponds to a **pipeline instance** (EDN)
   - pressing a button produces artifacts equivalent to executing that grammar instance

This supports the framework’s core research purpose:
- measure how **language** changes prompt efficacy
- measure how different **refusal policies** handle the same prompt across languages
- generate **code-mixed / script-mixed** variants for evaluation

## Non-goals (MVP)
- No auth/multi-user permissions.
- No distributed compute / queue backend.
- No in-browser visualization beyond basic run status + logs.

## Constraints
- Existing MT uses local proxy at `127.0.0.1:8789` requiring `PROXY_AUTH_TOKEN`.
- Some datasets are Hugging Face `gated=auto` requiring `HF_TOKEN` after accepting terms.
- Avoid leaving repo in broken state; tests must pass.

## Architecture
### Services
- **control-plane** (Clojure): HTTP API + run orchestrator
- **ui** (React/Vite): DSL-mapped config editor + run launcher

### Storage
- Bind-mount `./data` into control-plane container.
- Control plane stores:
  - `data/control-plane/runs/<run-id>/pipeline.edn`
  - `data/control-plane/runs/<run-id>/run.log`
  - build outputs under existing pipeline paths (e.g. `data/build/<version>/...`)

### DSL mapping (UI → grammar instance)
- dataset checkbox list → `:sources [...]`
- MT tier languages → `:transforms {:tier-1-mt {:languages [...] ...} :tier-2-mt ...}`
- toggles (tier2, suites scope, mt scope) → corresponding EDN keys
- "Fetch" button → execute Stage 0 (`promptbench fetch`)
- "Build" button → execute full pipeline build (`promptbench build`)

UI always shows the **generated EDN** as the canonical "grammar instance".

## API (MVP)
- `GET /api/health`
- `GET /api/sources`
- `POST /api/runs` → create run + persist `pipeline.edn`
- `POST /api/runs/:id/start` with `{command: "fetch"|"build"|"verify"|"coverage"}`
- `GET /api/runs` / `GET /api/runs/:id`

## Open questions
- Do you want the control plane to run builds **in-process** (Clojure calling pipeline fns) or **as a subprocess** (spawning `clj -M -m promptbench.core ...`)?
  - MVP will use subprocess for isolation.
- Should the compose stack also run the MT proxy? (Currently out of scope; proxy is treated as an external dependency.)

## Phases
### Phase 1 — Control plane MVP
- Ring/Jetty server with endpoints above
- Run registry + log capture

### Phase 2 — React UI MVP
- Source picker
- MT config editor
- EDN preview
- Run list + status/log tail

### Phase 3 — Docker compose
- Dockerfile for control plane
- Dockerfile for UI
- `docker-compose.yml` with volumes + env passthrough

## Definition of done
- `docker compose up` brings up UI + control plane
- UI can select sources, generate EDN, and trigger fetch/build
- Runs are persisted under `data/control-plane/runs/`

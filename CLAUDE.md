# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This is a pnpm monorepo (`pnpm-workspace.yaml` covers `orgs/octave-commons/**` and `orgs/open-hax/**`) orchestrated with Nx (`nx.json`, custom plugin at `tools/nx-plugins/giga/`). The root `package.json` is the Proxx proxy package itself — the root is also a workspace member.

Key subsystems:

| Subsystem | Source | Runtime/DevOps |
|-----------|--------|----------------|
| **Proxx** (OpenAI-compatible proxy, TS → CLJS migration) | `orgs/open-hax/proxx` | `services/proxx` |
| **OpenPlanner** (event/knowledge store, TypeScript) | `orgs/open-hax/openplanner` | `services/openplanner` |
| **Knoxx** (local-first knowledge vault, CLJS/Node.js) | `orgs/open-hax/openplanner/packages/agents/knoxx` | part of `services/openplanner` stack |
| **Eta-mu extensions** (Pi/OpenCode agent extensions, CLJS) | `orgs/open-hax/eta-mu/packages/eta-mu-extensions` | `~/.ημ` symlink |

Also read `AGENTS.md` — it has mandatory coding style, CLJS patterns, and Kanban/GitHub workflow rules that apply workspace-wide.

## Proxx Commands

```bash
# Root workspace (from /home/err/devel)
pnpm run typecheck
pnpm test                   # build then node --test
pnpm run build
pnpm run web:build          # React/Vite console

# Dev mode
pnpm dev                    # API server with tsx watch
pnpm web:dev                # Vite dev server

# CI/lint
./scripts/ci-lint.sh
actionlint .github/workflows/*.yml
```

Proxx container (primary for local work and Knoxx embedding):
```bash
cd services/proxx
docker compose --profile prod up -d --build proxx
```

Host PM2 dev sidecar (separate dev DB, port 18789):
```bash
cd services/proxx
docker compose -f docker-compose.dev-db.yml up -d proxx-dev-db
./scripts/seed-dev-db-from-prod.sh
pm2 start ecosystem.host.config.cjs --only proxx-host,proxx-host-web --no-autorestart
```

## OpenPlanner Stack

```bash
cd services/openplanner
docker compose --profile dev up -d     # full stack including Vite frontend
docker compose ps
```

Compose fragments live under `services/openplanner/compose/`. The main stack starts: MongoDB → mongo-init → openplanner → graph-weaver → eros-eris-field-app. Never delete the MongoDB volumes (`openplanner-lake`, `openplanner-lake-dev`) — the app user and keyfile are initialized once and don't survive a volume wipe.

## Knoxx Commands

All from `orgs/open-hax/openplanner/packages/agents/knoxx/`:

```bash
# Backend (CLJS/Node.js)
pnpm -C backend run watch       # shadow-cljs watch (dev)
pnpm -C backend run build       # production
pnpm -C backend test
pnpm -C backend lint            # clj-kondo

# Frontend (React + CLJS)
pnpm -C frontend dev            # Tailwind + Vite bridges + shadow-cljs
pnpm -C frontend build
pnpm -C frontend test

# Ingestion (Clojure/JVM)
clj -M:dev -C ingestion/        # nREPL + dev server (port 3002)
clj -M:test -C ingestion/

# Repo-level checks
node scripts/lint-file-sizes.mjs
bash scripts/pre-push-checks.sh
```

Do **not** restart PM2/Knoxx unless explicitly asked. Shadow-cljs hot-reloads backend CLJS; Vite reloads frontend.

## Eta-mu Extensions

Extensions live in `orgs/open-hax/eta-mu/packages/eta-mu-extensions/`. Source manifest is `manifest.edn`; CLJS sources are under `src/eta_mu/extensions/`.

```bash
pnpm -C orgs/open-hax/eta-mu/packages/eta-mu-extensions run build
pnpm -C orgs/open-hax/eta-mu/packages/eta-mu-extensions run watch   # dev
pnpm -C orgs/open-hax/eta-mu/packages/eta-mu-extensions run test
```

Built targets land at `dist/runtime/<name>.cjs`, `dist/pi/cljs-<name>/index.ts`, `dist/opencode/<name>.mjs`. Full path + build reference: `docs/reference/eta-mu-runtime.md`.

## Architecture: What Lives Where

**Proxx source vs. runtime split**: Source edits happen in `orgs/open-hax/proxx`. All runtime/devops config (Compose files, policy EDN, `.env.example`, seed files) lives in `services/proxx`. The canonical host dev runner is `services/proxx/ecosystem.host.config.cjs`.

**Provider/model policy**: Provider routes, capabilities, model families, allow/deny, and pricing belong in EDN files under `services/proxx/policies/runtime/` (loaded via `00-manifest.edn`). Never solve provider/model decisions with `.env`, Compose env blocks, or TypeScript conditionals.

**Knoxx backend structure**: Vertical domain-driven slices under `backend/src/cljs/knoxx/backend/`. Domain tool namespaces (`tools.discord`, `tools.music`, `tools.openplanner`, etc.) must never import each other — shared helpers go to `tools.shared` or `tools.media`. The orchestration layer (`infra/agent/`) composes tool vectors and stays thin.

**Knoxx threads model**: Agent conversations are `knoxx_threads`. Both run-store and event-ledger writes are required; the event-ledger is the only REST read source.

**OpenPlanner embeddings**: Uses Proxx as the embedding provider. The `openplanner-proxx` bundled service (`--profile bundled-proxx`) is opt-in only; the default path is the canonical `services/proxx` stack on the `ai-infra` network.

**No new TypeScript**: The direction is ingest config as EDN (like proxx policy seeds). Pursue incrementally; do not add new TypeScript files.

## Branch and PR Policy

Normal work: branch from `staging` → PR to `staging` → staging validation → promote `staging` → `main`.
`main` only accepts PRs from the canonical `open-hax/proxx:staging` branch (staging-promotion-gate CI job enforces this).

## Kanban → GitHub Sync

Planning source is markdown kanban cards in `kanban/` (and per-repo `kanban/` dirs inside org submodules). Sync to GitHub with throttling to avoid secondary rate limits:

```bash
eta-mu kanban sync github --tasks-dir kanban --repo riatzukiza/devel --dry-run
eta-mu kanban sync github --tasks-dir kanban --repo riatzukiza/devel --max-writes 25 --write-delay-ms 5000
```

Before opening new GitHub issues, check the relevant kanban directory. Synced issues carry `<!-- openhax-kanban-sync uuid="..." -->` — do not duplicate.

## Runtime Boundaries

- Proxx primary (Knoxx + embeddings): port `8789`, Compose project `open-hax-openai-proxy`
- Proxx PM2 host dev sidecar: port `18789` — must never bind `8789`
- OpenPlanner: port `7777`
- Knoxx backend: port `8000`
- Never assert a service is up or down without probing — verify with `curl /health` first.

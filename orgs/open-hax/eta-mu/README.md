# eta-mu

Canonical eta-mu monorepo.

This repo absorbs the active eta-mu surfaces that were previously scattered across multiple repos and workspace paths, including the former `open-hax/openhax` monorepo.

## Charter

- `spec/eta-mu-charter-v1.md` - active working definition of eta-mu core, satellites, and the first living vault

## Constitutional Layer

The **eta-mu-extensions** package (`packages/eta-mu-extensions`) is the source of the constitutional layer for cybernetic governance:

- **receipt-river** - Append-only audit ledger for agent decisions
- **session-mycology** - Per-turn retrospection with skill spore incubation
- **contract-runtime** - Operational contract fulfillment evaluation
- **fork-tax** - Deterministic handoff snapshots for git-based state persistence

This is the source of truth for all `.ημ` contract runtimes used by pi, opencode, and other agent frameworks. The `~/.ημ` symlink points to this package.

Build: `cd ~/.ημ && node scripts/build.mjs release`

## Layout

### Eta-Mu Core
- `packages/eta-mu-extensions` - **Constitutional layer runtimes** (receipt-river, session-mycology, contract-runtime, fork-tax)
- `packages/eta-mu-github` - GitHub automation bot, review gate, and workflow templates
- `packages/eta-mu-docs` - docs indexing primitives
- `packages/eta-mu-truth` - truth/log/view helpers
- `packages/eta-mu-runtime` - typed movement kernel for belief state, panel selection, and auditable action envelopes
- `packages/presence-core` - presence substrate types
- `services/eta-mu` - runtime and deploy home
- `services/eta-mu-truth-workbench` - HTTP/UI workbench
- `pi/` - repo-local pi automation home

### OpenHax Surfaces
- `packages/kanban` - Kanban board CLI and API
- `packages/opencode-reactant` - ClojureScript React UI for OpenCode
- `packages/signal-contracts` - signal contract types
- `packages/signal-radar-core` - signal radar core
- `packages/signal-source-utils` - signal source utilities
- `packages/signal-watchlists` - signal watchlist management
- `services/agentd` - agent daemon
- `shared/js/opencode-events` - shared event schema

### Clojure and Runtime Config
- `deps.edn` - Clojure dependencies
- `shadow-cljs.edn` - ClojureScript build config
- `ecosystem.pm2.edn` - PM2 ecosystem for Clojure services
- `ecosystem.config.cjs` - PM2 ecosystem JS config
- `ecosystem.cljs` - PM2 ecosystem ClojureScript source

## Local Commands

```bash
pnpm install:all
pnpm dev
pnpm build
pnpm test
pnpm typecheck
```

For targeted package work:

```bash
pnpm --dir packages/eta-mu-github test
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/kanban test
pnpm --dir packages/opencode-reactant build
docker compose -f services/eta-mu/compose.yaml config
```

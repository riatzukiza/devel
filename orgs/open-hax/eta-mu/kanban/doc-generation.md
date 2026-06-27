---
uuid: "orgs-open-hax-eta-mu-kanban-orgs-open-hax-eta-mu-specs-doc-generation-md"
title: "Documentation Generation Setup"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:29:39.349Z"
source: "orgs/open-hax/eta-mu/specs/doc-generation.md"
category: "specs"
---

> Source: `orgs/open-hax/eta-mu/specs/doc-generation.md`
> Migrated-to-kanban: `orgs/open-hax/eta-mu/kanban/doc-generation.md`

# Documentation Generation Setup

## Scope
- Add TypeScript API docs for the backend via TypeDoc (services/agentd) outputting to `docs/agentd-api`.
- Add ClojureScript API docs via Codox for the frontend (packages/opencode-reactant) outputting to `docs/opencode-reactant-api`.
- Provide top-level scripts to run both doc builds.

## File references
- package.json:13-21 — monorepo doc scripts
- services/agentd/package.json:7-33 — TypeDoc script and dependency
- services/agentd/typedoc.json:1-10 — TypeDoc configuration (entry, out path, exclusions)
- deps.edn:10-35 — `:codox` alias for CLJS docs
- packages/opencode-reactant/src/opencode/ui/components.cljs:153-205 & 218-219 — balanced forms and Tailwind class literal to unblock Codox
- packages/opencode-reactant/DEVELOPMENT.md:33-37 — documented doc commands and outputs

## Definition of done
- `pnpm docs:ts` succeeds and writes HTML docs to `docs/agentd-api` using `services/agentd/typedoc.json`.
- `clojure -X:codox` (or `pnpm docs:cljs`) succeeds and writes CLJS docs to `docs/opencode-reactant-api`.
- `pnpm docs` runs both tasks; commands are discoverable in developer docs.

## Open questions
- Do we want markdown output for TypeDoc (via plugin) to match Codox, or is HTML acceptable?
- Should we wire these into CI to publish artifacts or fail on missing docstrings?

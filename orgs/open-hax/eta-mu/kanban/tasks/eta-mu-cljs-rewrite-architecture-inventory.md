---
uuid: "eta-mu-cljs-rewrite-architecture-inventory"
title: "Eta-mu CLJS Rewrite — Architecture Inventory"
status: review
priority: "P0"
labels: ["tasks", "cljs", "rewrite", "inventory", "5sp"]
created_at: "2026-05-29T21:18:48Z"
source: "kanban/epics/eta-mu-cljs-runtime-rewrite.md"
points: 5
category: "tasks"
---
# Eta-mu CLJS Rewrite — Architecture Inventory

> Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
> Points: 5

## Purpose

Create the package-by-package map that makes the CLJS rewrite safe and path-scoped instead of a big-bang port.

## Scope

- `packages/**`
- `services/**`
- root `package.json`, `pnpm-workspace.yaml`, `deps.edn`, `shadow-cljs.edn`
- existing CLJS packages such as `packages/eta-mu-extensions` and `packages/opencode-reactant`

## Work items

- [x] Count TS/JS/CLJS source by package and identify generated/dist folders to ignore.
- [x] Catalog public compatibility surfaces: binaries, package exports, SDK exports, tool manifests, provider adapters, session storage, TUI/web entrypoints, and service runners.
- [x] Classify each source cluster as `domain`, `shape`, `law`, `extern`, `infra`, `cli`, `tui`, or `web`.
- [x] Record known red tests or warning baselines before rewrite work starts.
- [x] Produce a migration map linked from the parent epic.

## Acceptance criteria

- [x] Inventory document exists in the eta-mu repo and links every package to a target CLJS ownership category.
- [x] The first three parity slices are named with risk and verification gates.
- [x] No code rewrite begins from this task except inventory scripts/docs.

## Verification

```bash
find packages services \( -path '*/node_modules' -o -path '*/dist' -o -path '*/dist-cljs' -o -path '*/target' -o -path '*/.shadow-cljs' -o -path '*/.build' -o -path '*/out' \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.cljs' -o -name '*.cljc' -o -name '*.clj' \) -print | wc -l
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/presence-core test
pnpm -C packages/eta-mu-extensions build
```

---
Planning inventory drafted at docs/cljs-runtime-rewrite-architecture-inventory.md. It classifies package surfaces, target domain/shape/law/infra/extern ownership, boundary hotspots, and the first three parity slices: eta-mu-runtime, output-contract-gate, and coding-agent message/session core.
---

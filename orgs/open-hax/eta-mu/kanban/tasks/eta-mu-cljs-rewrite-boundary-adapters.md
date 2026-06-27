---
uuid: "eta-mu-cljs-rewrite-boundary-adapters"
title: "Eta-mu CLJS Rewrite — Boundary Adapters"
status: review
priority: P0
labels: ["tasks", "cljs", "rewrite", "extern", "13sp"]
created_at: "2026-05-29T21:18:48Z"
source: "kanban/epics/eta-mu-cljs-runtime-rewrite.md"
points: 13
category: tasks
---

# Eta-mu CLJS Rewrite — Boundary Adapters

> Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
> Planning output: `docs/cljs-runtime-rewrite-boundary-adapter-plan.md`
> Points: 13

## Purpose

Create the named `extern.*` and `infra.*` boundary layers needed for CLJS runtime slices to touch the world without leaking raw JavaScript through the codebase.

## Scope

- Node filesystem/path/process adapters
- git and workspace command adapters
- provider/Proxx/OpenCode/Pi SDK adapters
- custom eta-mu tools: apply_patch, receipt river, session mycology, contract runtime, graph memory, render image, web search, Chronos
- JSON/EDN codecs and opaque handle rules

## Work items

- [x] Define one named `extern.*` namespace per real boundary.
- [x] Keep adapter public APIs CLJS-first: maps, vectors, scalars, or opaque handles.
- [x] Move `js->clj`, `clj->js`, `#js`, `aget`, `aset`, `Promise.all`, Node globals, and SDK-native object access into extern adapters only.
- [x] Add conversion tests for each adapter that is used by migrated runtime code.
- [x] Add a boundary inventory/check script similar to Knoxx's `boundary:check` pattern.

## Acceptance criteria

- [x] Boundary inventory runs and reports no disallowed raw JS interop outside `extern.*` namespaces.
- [x] Each migrated effectful runtime path has an adapter-level test.
- [x] Infra orchestration namespaces remain data-in/data-out and do not own domain policy.

## Verification

```bash
pnpm --dir packages/eta-mu-runtime cljs:boundary
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
pnpm --dir packages/eta-mu-runtime build
pnpm test
pnpm -C packages/eta-mu-extensions test
```

## Notes

Implemented the first runtime boundary adapter slice in `packages/eta-mu-runtime` with named `extern.*` adapters for JS value conversion, time/timestamps, JSON, HTTP request encoding, and process snapshots. Added `infra.boundary` inventory data for implemented and planned boundaries, moved facade JS conversion/time defaults through extern adapters, and tightened the boundary scanner so raw interop is allowed only under `extern.*`.

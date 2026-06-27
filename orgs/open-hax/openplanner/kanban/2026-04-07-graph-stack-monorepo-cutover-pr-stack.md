---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-2026-04-07-graph-stack-monorepo-cutover-pr-stack-md"
title: "Graph Stack Monorepo Cutover PR Stack"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.619Z"
source: "orgs/open-hax/openplanner/specs/2026-04-07-graph-stack-monorepo-cutover-pr-stack.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/2026-04-07-graph-stack-monorepo-cutover-pr-stack.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/2026-04-07-graph-stack-monorepo-cutover-pr-stack.md`

# Graph Stack Monorepo Cutover PR Stack

## Goal

Make `orgs/open-hax/openplanner` the canonical monorepo entrypoint for the graph stack while keeping the runtime working from monorepo package paths:

- `packages/graph-weaver`
- `packages/graph-weaver-aco`
- `packages/eros-eris-field`
- `packages/eros-eris-field-app`
- `packages/myrmex`
- `packages/vexx`

## Current Runtime Result

The Knoxx graph stack is running from monorepo paths, not the old scattered repo locations:

- `graph-weaver` healthy on `http://127.0.0.1:8796/api/status`
- `eros-eris-field-app` running with OpenPlanner-owned embeddings and Vexx/NPU path
- `myrmex` running from monorepo path

## Submodule Branches

All affected submodules have been pushed on branch `monorepo/runtime-cutover`.

| Package | Branch | SHA | PR URL |
|---|---|---:|---|
| `graph-weaver` | `monorepo/runtime-cutover` | `9561954` | https://github.com/octave-commons/graph-weaver/pull/new/monorepo/runtime-cutover |
| `graph-weaver-aco` | `monorepo/runtime-cutover` | `b9d2e85` | https://github.com/octave-commons/graph-weaver-aco/pull/new/monorepo/runtime-cutover |
| `eros-eris-field` | `monorepo/runtime-cutover` | `05fee7f` | https://github.com/octave-commons/eros-eris-field/pull/new/monorepo/runtime-cutover |
| `eros-eris-field-app` | `monorepo/runtime-cutover` | `009aeb3` | https://github.com/octave-commons/eros-eris-field-app/pull/new/monorepo/runtime-cutover |
| `myrmex` | `monorepo/runtime-cutover` | `4eee077` | https://github.com/octave-commons/myrmex/pull/new/monorepo/runtime-cutover |

## Superproject Branch

OpenPlanner superproject branch:

- branch: `monorepo/graph-stack-consolidation`
- latest pushed commit: `a6ce90e`
- PR URL: https://github.com/open-hax/openplanner/pull/new/monorepo/graph-stack-consolidation

This branch now pins the submodule SHAs above.

## Merge Order

1. Merge the five submodule PRs.
2. Rebase or refresh `monorepo/graph-stack-consolidation` only if submodule SHAs move.
3. Merge the OpenPlanner superproject PR.

## What Was Needed For Runtime Rehab

### `graph-weaver`
- restore newer OpenPlanner-backed source behavior
- restore `nodePreviews` GraphQL query
- keep monorepo-safe Mongo collection isolation via env:
  - `graph_weaver_nodes`
  - `graph_weaver_edges`
- fix nested-submodule tsconfig path assumptions
- fix Mongo auth source / replica set URI in runtime env

### `graph-weaver-aco`
- fix nested-submodule tsconfig path assumptions

### `eros-eris-field`
- restore semantic edge builder exports
- restore newer simulation behavior
- fix nested-submodule tsconfig path assumptions

### `eros-eris-field-app`
- restore OpenPlanner-owned embedding flow
- restore semantic edge persistence
- restore Vexx/NPU integration path
- fix nested-submodule tsconfig path assumptions indirectly via dependency tree

### `myrmex`
- fix nested-submodule tsconfig path assumptions
- switch runtime away from in-container `pnpm install` on read-only mounts

## Remaining Unrelated Dirt In `orgs/open-hax/openplanner`

These changes were deliberately not folded into the monorepo/submodule PR stack:

- `.env.example`
- `docker-compose.yml`
- `openplanner-lake/duckdb/archive.duckdb`
- `openplanner-lake/duckdb/archive.duckdb.wal`
- `specs/2026-04-06-openplanner-canonical-graph-embedding-layout-cutover.md`
- `src/lib/embedding-cache.ts`
- `src/lib/vexx.ts`
- `src/routes/v1/translations.ts`
- `src/tests/embeddings.test.ts`
- untracked `node_modules/`
- untracked `openplanner-lake/cache/`
- untracked `openplanner-lake/jobs/`
- untracked `pnpm-lock.yaml`

Those should be handled as a separate cleanup/follow-up change, not mixed into the monorepo cutover PR stack.

## Recommendation

Treat the monorepo cutover as a narrow PR stack focused on:

- submodule addition
- runtime rehab for monorepo paths
- superproject SHA pinning

Do not widen it with unrelated OpenPlanner dirt.

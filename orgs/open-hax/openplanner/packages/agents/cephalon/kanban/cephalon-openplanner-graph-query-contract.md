---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-cephalon-openplanner-graph-query-contract-md"
title: "Cephalon OpenPlanner Graph Query Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.910Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/cephalon-openplanner-graph-query-contract.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/cephalon-openplanner-graph-query-contract.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/cephalon-openplanner-graph-query-contract.md`

# Cephalon OpenPlanner Graph Query Contract

## Purpose

Define the first bounded graph-query contract Cephalon should use when it needs graph context from the shared ecosystem.

This spec exists so Cephalon can:

- consume canonical graph truth from OpenPlanner
- stay compatible with Graph-Weaver as a workbench layer
- prepare a clean seam for later daimoi-style retrieval walkers

without growing a private incompatible graph API.

## Problem

Cephalon currently has:

- an OpenPlanner client focused on memory/search events
- a local graph helper for short-horizon conversational topology
- no stable contract for asking the shared graph layer for bounded graph context

Without a contract, future graph-aware cognition will drift into:

- ad hoc Graph-Weaver calls
- ad hoc OpenPlanner calls
- private local graph shortcuts

and later daimoi retrieval will have no honest seam to target.

## Design rule

Cephalon should treat **OpenPlanner as canonical graph truth**.

Graph-Weaver remains:

- a workbench
- a preview/mutation surface
- a human-facing graph instrument

But the base graph-query contract for Cephalon cognition should anchor on OpenPlanner-compatible semantics.

## Current shared graph surfaces

### OpenPlanner

Current real routes in `openplanner/src/routes/v1/graph.ts`:

- `GET /v1/graph/stats`
- `GET /v1/graph/export`
- `GET /v1/graph/query`
- `GET /v1/graph/nodes`
- `GET /v1/graph/edges`
- `POST /v1/graph/traverse`

### Graph-Weaver

Current workbench surfaces in `graph-weaver/specs/service-surface.md`:

- search
- neighbors
- node preview
- graph view
- mutation and layout surfaces

### Cephalon

Current `packages/cephalon-ts/src/openplanner/client.ts` supports:

- hybrid memory search
- memory event emission
- health probing

It does **not yet** expose a graph client.

## Contract scope

This v1 contract is intentionally small.

Cephalon should be able to ask for:

1. graph status
2. node search
3. bounded incident edges / neighbors
4. node preview / lookup
5. bounded graph slice export

This contract is **not** yet for:

- deep graph traversal policy
- autonomous graph exploration
- graph mutation
- derived-view optimization logic

## Proposed Cephalon interface

```ts
interface CephalonGraphQueryClient {
  status(): Promise<GraphStatus>
  search(query: string, options?: GraphSearchOptions): Promise<GraphQueryResult>
  node(idOrUrl: string): Promise<GraphNodeLookup>
  neighbors(idOrUrl: string, options?: NeighborOptions): Promise<GraphNeighborResult>
  exportSlice(options?: GraphSliceOptions): Promise<GraphSlice>
}
```

## Query semantics

### 1. `status()`

Returns enough to decide whether graph-aware reasoning is worth attempting.

Minimum fields:

- `ok`
- `storageBackend`
- `nodeCount`
- `edgeCount`
- `source: "openplanner"`

### 2. `search(query, options)`

Maps onto bounded OpenPlanner `graph/query` semantics.

Suggested options:

```ts
type GraphSearchOptions = {
  projects?: string[]
  nodeTypes?: string[]
  edgeTypes?: string[]
  limit?: number
  edgeLimit?: number
}
```

Expected result shape:

- matched nodes
- incident edges limited by `edgeLimit`
- counts
- source metadata proving the result came from the canonical lake

### 3. `node(idOrUrl)`

Returns one canonical node lookup if available.

Initial implementation may support:

- node id lookup via export/query filtering
- URL lookup via `GET /v1/graph/nodes?url=...`

### 4. `neighbors(idOrUrl, options)`

Returns bounded incident edges and referenced neighboring nodes.

Suggested options:

```ts
type NeighborOptions = {
  edgeTypes?: string[]
  limit?: number
}
```

This is the most likely seed surface for future daimoi-style bounded expansion.

### 5. `exportSlice(options)`

Returns a bounded graph slice for:

- workbench synchronization
- explanation payloads
- richer context assembly

Suggested options:

```ts
type GraphSliceOptions = {
  projects?: string[]
  nodeTypes?: string[]
  edgeTypes?: string[]
}
```

Maps onto `GET /v1/graph/export`.

## Normalization rule

Cephalon should normalize OpenPlanner graph results into one stable local shape.

That shape should preserve at least:

- `id`
- `kind`
- `label`
- `lake`
- `nodeType` or `edgeType`
- `data`

Cephalon must not leak raw backend-specific row forms into higher cognition layers.

## Relationship to Graph-Weaver

Graph-Weaver is not excluded by this contract.

Instead:

- OpenPlanner remains the canonical query truth
- Graph-Weaver may adapt the same node/edge identities for preview and human-facing inspection
- Cephalon may later add a separate `GraphWorkbenchClient` for preview/mutation affordances

But the graph context used by cognition should still be explainable in OpenPlanner terms.

## Knoxx consequence

If Cephalon eventually owns the agentic loop inside Knoxx, this contract becomes the likely graph-facing base layer for:

- graph-aware context assembly
- bounded graph/tool reasoning
- future retrieval-walker integration

while Knoxx remains free to present a stronger opinionated UX over the same underlying seam.

## Future daimoi seam

This contract is intentionally walker-friendly.

Later daimoi/retrieval layers should be able to use:

- `search(...)` as seed selection
- `neighbors(...)` as bounded expansion
- `node(...)` for explanation / identity recovery

without changing Cephalon's public graph contract first.

## Phases

### Phase 1 — client seam

- add graph-query client types to `cephalon-ts`
- implement OpenPlanner-backed `status/search/node/neighbors/exportSlice`

### Phase 2 — cognition use

- allow Cephalon context assembly to request bounded graph context explicitly
- keep graph use optional and fail-soft when unavailable

### Phase 3 — workbench alignment

- align node/edge identities with Graph-Weaver preview flows
- keep workbench preview separate from canonical base truth

### Phase 4 — daimoi-aligned expansion

- use `neighbors(...)` and bounded seeds for retrieval walkers
- keep budgets and explanation traces explicit

## Definition of done

This spec is complete when:

- Cephalon has one honest graph-query seam anchored on OpenPlanner semantics
- graph-aware cognition no longer depends on private ad hoc graph shapes
- future retrieval walkers can target the same seam without contract churn

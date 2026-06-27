---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-graph-workbench-adapter-md"
title: "Cephalon Graph Workbench Adapter Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.898Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/graph-workbench-adapter.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/graph-workbench-adapter.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/graph-workbench-adapter.md`

# Cephalon Graph Workbench Adapter Spec

## Purpose

Resolve the naming and ownership drift between:

- Cephalon's internal `GraphWeaver` helper
- the external `octave-commons/graph-weaver` workbench service

and define the intended convergence path.

## Problem

Right now, two different graph ideas share one name:

1. `packages/cephalon-ts/src/mind/local-mind-graph.ts`
   - a local conversational/social trace graph inside the head runtime
2. `orgs/octave-commons/graph-weaver`
   - the external graph workbench service with query, preview, mutation, and OpenPlanner import surfaces

This creates three risks:

- contributors confuse the local helper with the canonical graph workbench
- Cephalon accidentally grows a private graph empire instead of consuming shared graph organs
- future daimoi/retrieval work targets the wrong graph seam

## Design rule

Cephalon may keep a **mind-local graph aid**, but it should not pretend that aid is the canonical graph workbench.

The long-term direction is:

> Cephalon's graph-facing cognition should call out to the true graph workbench and canonical lake surfaces through a bounded adapter.

## Current state

### What the internal helper does well

`packages/cephalon-ts/src/mind/local-mind-graph.ts` is good at:

- ingesting Discord message topology
- tracking channels/authors/messages/links/assets
- building a cheap local social trace graph
- summarizing the hot topology of recent activity

### What it should not become

It should not become responsible for:

- canonical graph storage
- graph UI / preview / mutation surfaces
- web graph ingestion orchestration
- shared graph query contracts for Knoxx/OpenPlanner

Those belong elsewhere.

## Target shape

### 1. Keep a local trace layer

Cephalon should be allowed to keep a fast local topology helper for:

- room/channel/actor traces
- short-horizon message/link adjacency
- local event-native engagement scoring

But that layer should be named honestly, e.g.:

- `ConversationGraph`
- `SocialTraceGraph`
- `LocalMindGraph`

so it stops claiming the workbench's name.

### 2. Add a graph workbench adapter

Cephalon should gain a bounded client/adapter that talks to the true shared graph surfaces.

Initial likely target:

- `octave-commons/graph-weaver` query/preview surfaces
- backed by OpenPlanner canonical graph truth where appropriate

### 3. Future daimoi expansion should use the shared seam

When Cephalon grows bounded retrieval-walker behavior, that work should target the shared graph seam rather than the private local trace graph.

## Adapter contract direction

The adapter should remain small and bounded.

Suggested operations:

```ts
interface GraphWorkbenchClient {
  status(): Promise<GraphWorkbenchStatus>
  searchNodes(query: string, options?: SearchOptions): Promise<NodeHit[]>
  neighbors(nodeId: string, options?: NeighborOptions): Promise<NeighborHit[]>
  nodePreview(nodeId: string): Promise<NodePreview>
  graphView(options?: GraphViewOptions): Promise<GraphSlice>
}
```

Optional later operations:

- `edgeExplain(...)`
- `queryRawVsDerived(...)`
- `traceWalk(...)`

## Ownership rules

### Cephalon owns

- when to ask for graph context
- how graph context combines with memory, field, and tool timing
- whether a candidate response is sufficiently anchored/situated/novel/alive

### Graph-Weaver owns

- graph query / preview / intervention surface
- user-layer graph edits
- workbench-facing graph rendering slices

### OpenPlanner owns

- canonical graph receipts
- graph export/query base truth
- derived graph projections once materialized

## Knoxx consequence

If Knoxx becomes the packaged agentic product, Cephalon should eventually own the **agentic loop** inside Knoxx, while the graph context it consumes should come from shared Graph-Weaver/OpenPlanner seams rather than an ad hoc private graph.

## Phases

### Phase 1 — name the split

- document that Cephalon's local trace graph is not the canonical workbench
- stop treating it as the canonical workbench

### Phase 2 — add adapter seam

- define a `GraphWorkbenchClient` interface in Cephalon
- implement one adapter for the external `graph-weaver` service
- keep local trace graph as a separate helper

### Phase 3 — route cognition through the adapter

- graph-aware engagement and retrieval request bounded graph slices through the adapter
- local trace graph remains a short-horizon input, not the whole graph truth

### Phase 4 — daimoi-aligned retrieval

- future bounded retrieval walkers operate over shared graph query seams
- explanation traces reference shared node/edge identities rather than private local ids only

## Definition of done

This spec is complete when:

- Cephalon's local graph helper no longer masquerades as the canonical workbench
- Cephalon can call the true graph workbench through a bounded client
- future graph-aware cognition has one honest seam to target

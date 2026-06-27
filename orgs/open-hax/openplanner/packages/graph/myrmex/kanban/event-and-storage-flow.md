---
uuid: "orgs-open-hax-openplanner-packages-graph-myrmex-kanban-orgs-open-hax-openplanner-packages-graph-myrmex-specs-event-and-storage-flow-md"
title: "Event and Storage Flow Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:39.561Z"
source: "orgs/open-hax/openplanner/packages/graph/myrmex/specs/event-and-storage-flow.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/myrmex/specs/event-and-storage-flow.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/myrmex/kanban/event-and-storage-flow.md`

# Event and Storage Flow Spec

## Purpose

Document what happens when Myrmex successfully fetches a page and how that result is propagated.

## Source anchors

- `src/Myrmex.ts`
- `src/event-router.ts`
- `src/graph-store.ts`
- `src/types.ts`

## Flow

### 1. ACO emits a page event
`GraphWeaverAco` emits:
- url
- fetchedAt
- outgoing links
- optional content/title/metadata

### 2. Myrmex normalizes it
`Myrmex` converts it into `MyrmexPageEvent`:
- hashes content (currently a lightweight pseudo-hash)
- derives status classification (`success` or `partial`)
- assigns `graphNodeId`

### 3. EventRouter sends rich node content
`EventRouter.route()` posts to:
- `POST /api/v1/lake/events`

Payload shape:
- `kind: graph.node`
- timestamp
- url/title/content/contentHash/metadata
- discoveredAt / lastVisitedAt / visitCount / pheromone

### 4. GraphStore sends node + edge records
`GraphStore` also posts to:
- `POST /api/v1/lake/events`

For the node itself:
- `kind: graph.node`

For each outgoing link:
- `kind: graph.edge`

## Filtering and truncation

The EventRouter applies:
- include patterns
- exclude patterns
- max content length truncation

This means Myrmex already has the beginnings of an ingestion policy surface even before a more mature content model exists.

## Important current reality

- node content is routed separately from edges
- `visitCount` and `pheromone` are currently simple seeded values, not full restored frontier state
- there is no dedupe or replay logic yet in this repo itself

## Consequence

The current repo is best understood as **ingest-first**:
- it successfully ferries content into the lake
- it does not yet fully own long-term graph state restoration

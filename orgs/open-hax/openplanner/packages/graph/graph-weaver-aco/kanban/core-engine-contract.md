---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-specs-core-engine-contract-md"
title: "Core Engine Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:37.934Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/core-engine-contract.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/core-engine-contract.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/kanban/core-engine-contract.md`

# Core Engine Contract

## Purpose

Define the contract of `GraphWeaverAco` as a reusable engine rather than as a whole application.

## Public surface

### Constructor
```ts
new GraphWeaverAco(options?: GraphWeaverAcoOptions)
```

### Inputs
- seed URLs via `seed(urls)`
- runtime options for:
  - ants
  - dispatch cadence
  - concurrency
  - per-host delay
  - revisit horizon
  - ACO weights
  - frontier cap
  - fetch backend

### Outputs
- `page` events
- `error` events
- frontier/in-flight stats via `stats()`

### Lifecycle
- `start()`
- `stop()`
- `onEvent(cb)`

## Event contract

### `page`
```ts
{
  type: "page",
  url,
  status,
  contentType,
  fetchedAt,
  outgoing,
  content?,
  title?,
  metadata?
}
```

### `error`
```ts
{
  type: "error",
  url,
  fetchedAt,
  message
}
```

## Behavioral invariants

1. seeds are normalized before entering the frontier
2. host pacing is enforced before dispatch
3. robots denial reduces repeated attempts instead of hard-crashing the loop
4. failed fetches decay pheromone
5. successful visits update outgoing links and frontier state
6. the engine can run forever with bounded frontier size

## Architectural position

This engine is responsible for **choosing and attempting** visits.
It is not responsible for:
- graph persistence
- UI rendering
- REST/GraphQL endpoints
- search indexing
- high-level orchestration

## Adjacent bindings

- default backend: `SimpleFetchBackend`
- richer backend: supplied externally (e.g. Myrmex → ShuvCrawl)
- service host: `octave-commons/graph-weaver`
- orchestration host: `octave-commons/myrmex`

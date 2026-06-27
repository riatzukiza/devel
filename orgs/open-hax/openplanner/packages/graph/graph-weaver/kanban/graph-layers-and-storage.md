---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-specs-graph-layers-and-storage-md"
title: "Graph Layers and Storage Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:36.376Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver/specs/graph-layers-and-storage.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver/specs/graph-layers-and-storage.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver/kanban/graph-layers-and-storage.md`

# Graph Layers and Storage Spec

## Purpose

Make the internal graph layering explicit.

## Graph layers

### 1. Local layer
Produced by repo scan.

Sources:
- tracked files
- markdown links
- JS/TS imports
- Python imports
- Clojure requires

Characteristics:
- deterministic rebuild from repo state
- `layer: local`
- seeds external URLs found in markdown

### 2. Web layer
Produced by crawler events coming from `graph-weaver-aco`.

Characteristics:
- `url:*` nodes
- outgoing web edges
- page/error metadata
- persisted to Mongo under store `web`

### 3. User layer
Produced by explicit user mutations.

Characteristics:
- overlay nodes and edges
- layout position overrides
- user-authored graph edits
- persisted to Mongo under store `user`

### 4. Semantic layer
Produced by OpenPlanner semantic exports and daimoi reinforcement.

Characteristics:
- `layer: semantic`
- semantic edges are transient circuit edges, not durable truth claims
- every semantic edge must carry `data.similarity` with the cosine score between connected nodes
- reinforced edges increase `data.conductance`; unreinforced edges decay by half-life into `broken` and then are pruned
- durable truth still belongs to OpenPlanner edge claims, not semantic edges

### 5. Presence layer
Produced by presence GraphQL mutations and future OpenPlanner runtime sync.

Characteristics:
- `kind: presence`, `layer: presence`
- `data.presence_class` is `resource`, `muse`, or `transient`
- `data.saturation`, `data.emission_threshold`, and `data.refractory_ms` model neuron-like emission
- resource presences represent CPU cores, NPU, GPU, RAM, or other system resources/processes
- muse presences represent an LLM actor's autonomic graph interface
- transient presences represent bounded effects such as memory-tool query emission events

## Merge model

The runtime merges:
- `localStore`
- `webStore`
- `userStore`

Semantic and presence layers currently persist through `userStore` unless they are
imported from OpenPlanner export, but they keep their own `layer` values so the
GraphQL schema and renderer can distinguish them.

Merged graph is cached until invalidated by a dirty mark.

## Storage backends

### In-memory
All three layers are active in memory via `GraphStore`.

### MongoDB
`MongoGraphStore` persists:
- nodes by `store + id`
- edges by `store + id`
- indexes on `store/id`, `store/source`, `store/target`

### Runtime files
Config and legacy user graph state live in runtime paths such as:
- `.opencode/runtime/devel-graph-weaver.config.json`
- `.opencode/runtime/devel-graph-weaver.user-graph.json`

## Design consequence

This repo is not a pure cache or a pure derivation engine.
It is a layered graph instrument that intentionally combines:
- rebuildable derivation
- discovered external state
- human-authored overlay
- transient semantic circuits
- presence-driven intent/resource nodes

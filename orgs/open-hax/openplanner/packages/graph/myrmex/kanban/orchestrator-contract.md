---
uuid: "orgs-open-hax-openplanner-packages-graph-myrmex-kanban-orgs-open-hax-openplanner-packages-graph-myrmex-specs-orchestrator-contract-md"
title: "Orchestrator Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:39.560Z"
source: "orgs/open-hax/openplanner/packages/graph/myrmex/specs/orchestrator-contract.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/myrmex/specs/orchestrator-contract.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/myrmex/kanban/orchestrator-contract.md`

# Orchestrator Contract

## Purpose

Define `Myrmex` as a composition root rather than as a bag of ad hoc service calls.

## Core composition

`Myrmex` owns and wires:
- `ShuvCrawlClient`
- `ShuvCrawlFetchBackend`
- `GraphWeaverAco`
- `EventRouter`
- `GraphStore`
- `CheckpointManager`

## Lifecycle

### Inputs
- seed URLs
- runtime config
- backend service base URLs and tokens

### Controls
- `start()`
- `stop()`
- `pause()`
- `resume()`
- `restoreCheckpoint()`
- `stats()`
- `onEvent(cb)`

## State exposed by `stats()`
- running
- paused
- pause reason
- frontier size
- in-flight fetch count
- page count
- error count
- last checkpoint timestamp
- pending graph writes
- graph-store/OpenPlanner backpressure state

## Event normalization

Upstream ACO events are normalized into `MyrmexEvent`:
- `page`
- `error`
- `checkpoint`

This keeps downstream consumers from depending on raw engine internals.

## Responsibilities

Myrmex is responsible for:
- constructing the richer fetch backend
- starting the traversal engine
- routing extracted content into Proxx/OpenPlanner surfaces
- maintaining a small runtime summary
- checkpoint scheduling
- applying downstream OpenPlanner backpressure so crawl rate does not silently flood the lake

## Downstream backpressure contract

- Graph writes to OpenPlanner are serialized rather than fired concurrently.
- Transient downstream failures (`5xx`, `429`, timeout, transport abort/fetch failure) engage explicit backpressure with exponential retry.
- While OpenPlanner is unhealthy or the graph-write queue is saturated, `Myrmex` pauses the crawl and surfaces the reason in logs and `stats()`.
- `Myrmex` resumes only after OpenPlanner recovers and the pending write queue drains below the configured resume threshold.
- Permanent graph-store failures are surfaced as explicit `error` events; they must never be swallowed silently.
- Pause/resume must be reversible at runtime; a temporary downstream pause must not require a process restart to restart dispatch.
- Crawl scheduling should prefer cross-host breadth when a single sitemap-heavy domain floods the frontier.

Myrmex is not responsible for:
- reinventing ACO traversal
- being the long-term lake itself
- being the graph UI

## Architectural position

This repo is the **bridge organism** between:
- a small traversal brain
- a heavy extraction mouth
- a downstream knowledge lake

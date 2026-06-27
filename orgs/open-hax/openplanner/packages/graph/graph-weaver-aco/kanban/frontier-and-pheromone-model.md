---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-specs-frontier-and-pheromone-model-md"
title: "Frontier and Pheromone Model"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:37.934Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/frontier-and-pheromone-model.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/frontier-and-pheromone-model.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/kanban/frontier-and-pheromone-model.md`

# Frontier and Pheromone Model

## Purpose

Explain how the extracted engine stores URL state, scores candidates, and stays bounded over long runs.

## Frontier state

Each URL is tracked as:

```ts
{
  url,
  host,
  discoveredAt,
  lastVisitedAt,
  visits,
  pheromone,
  outgoing: Set<url>
}
```

## Heuristic

The current heuristic combines:
- **novelty** = `1 / (1 + visits)`
- **staleness** = fraction of revisit horizon elapsed

Weighted blend:
```text
heuristic = novelty * 0.85 + staleness * 0.25
```

This means the engine prefers new URLs strongly, but slowly reopens old ones once enough time has passed.

## Choice rule

For a candidate URL:

```text
weight = pheromone^alpha * heuristic^beta
```

Then the next URL is chosen by weighted random choice over candidates that survive gating.

## Gating before choice

A candidate must first pass:
- host pacing
- no active in-flight request on that host
- minimal revisit guard (`lastVisitedAt` not too recent)

## Pheromone updates

### On seed
A seed gets a small bump so the colony has somewhere sane to begin.

### On success
- visited URL gets pheromone deposit weighted by novelty
- previous URL gets a smaller supportive bump when there is a path relation

### On failure
failed URLs lose pheromone more aggressively.

### On global evaporation
Every minute, frontier pheromone decays by configured evaporation rate.

## Bounded frontier

The frontier enforces `maxFrontier`.
When exceeded, it drops the least relevant URLs using a score that penalizes:
- many visits
- age
- low pheromone

This is important because the engine is designed for **long-running crawl memory** without unbounded growth.

## Why this matters

The extracted engine is not trying to be optimal in a single short batch.
It is trying to be a **small enduring colony**:
- curious
- bounded
- polite
- capable of remembering where food used to be

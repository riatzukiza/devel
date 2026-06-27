# @workspace/graph-weaver-aco

A tiny, polite web graph weaver (crawler) inspired by **ant colony optimization**:

- multiple “ants” walk a growing hyperlink graph
- selection is novelty-biased, but allows revisits (staleness-aware)
- host-heavy candidate sets are penalized so one sitemap flood does not monopolize traversal
- slow + steady dispatch cadence (designed to grow a graph forever)
- basic robots.txt respect + per-host pacing
- `start()` / `stop()` are reversible pause/resume controls for long-lived crawls

This package is intentionally dependency-free and small.


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Reading order

1. `docs/INDEX.md`
2. `docs/FORK_TALES_SOURCE_MAP.md`
3. `specs/core-engine-contract.md`
4. `specs/frontier-and-pheromone-model.md`
5. `specs/ethical-crawling-contract.md`
6. `specs/fetch-backend-contract.md`

## Concepts

- **Frontier**: discovered URLs with visit metadata.
- **Ants**: agents that choose the next URL from the current node’s out-links.
- **ACO-ish choice**: weight = pheromone^α × heuristic^β.
- **Heuristic**: novelty + staleness (prefer new, occasionally recheck old).

## API

```ts
import { GraphWeaverAco } from "@workspace/graph-weaver-aco";

const weaver = new GraphWeaverAco({
  ants: 4,
  dispatchIntervalMs: 15000,
});

weaver.onEvent((ev) => {
  if (ev.type === "page") {
    console.log(ev.url, ev.status, ev.outgoing.length);
  }
});

weaver.seed(["https://example.com/"]);
weaver.start();
```

## Adjacent repos

- `octave-commons/graph-weaver` — service/UI/local+web graph workbench
- `octave-commons/myrmex` — richer extraction and ingestion orchestrator

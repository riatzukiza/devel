# Fork Tales Source Map

`graph-weaver-aco` is the extraction of the **ACO traversal kernel** from the larger Fork Tales Web Graph Weaver organism.

## Primary upstream sources

### 1. The original crawler service
- `orgs/octave-commons/fork_tales/part64/code/web_graph_weaver.js`
- `orgs/octave-commons/fork_tales/docs/WEB_GRAPH_WEAVER.md`
- `orgs/octave-commons/fork_tales/specs/drafts/web-graph-weaver.md`

These sources contained the whole live service:
- watchlist ingestion
- frontier crawling
- robots and delay compliance
- REST endpoints
- websocket event stream
- dashboard integration

This repo captures only the **crawling decision kernel** from that organism.

### 2. The presence contract
- `orgs/octave-commons/fork_tales/.opencode/agent/presence.web-graph-weaver.md`

This file is important because it preserves the behavioral doctrine:
- ethical crawling
- real-time graph deltas
- dashboard and metrics
- explainable skips
- fail-safe defaults

The extracted package implements part of that doctrine at the engine level.

### 3. Field / graph integration notes
- `orgs/octave-commons/fork_tales/specs/drafts/weaver-graph-field-integration.md`
- `specs/drafts/radar-crawler-integration-2026-03-20.md`

These documents show how the old crawler stopped being an isolated sidecar and started becoming a graph-bearing organ feeding larger systems.

### 4. Research-oriented crawler policy notes
- `orgs/octave-commons/fork_tales/specs/drafts/parameter-golf-research-daimoi-mode.md`

This matters because it shows the crawler was already evolving from generic link-following toward **policy-guided exploration**.
That pressure ultimately makes sense of why extracting the ACO kernel separately is valuable.

## What this repo currently preserves

From the larger crawler organism, this repo now preserves:
- URL frontier state
- novelty/staleness heuristic
- pheromone evaporation and deposit
- per-host pacing
- robots gating
- event emission for page/error outcomes
- pluggable fetch backend support

## What lives elsewhere now

- `octave-commons/graph-weaver` — service/UI/local+web graph surface
- `octave-commons/myrmex` — ShuvCrawl-backed orchestration and ingestion path

## Honest status

This repo is a clean kernel extraction, not a full fidelity clone of the old Part64 crawler service. That is a feature, not a loss: it makes the foraging logic legible on its own.

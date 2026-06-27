# GraphWeaver ACO Docs Index

This repo is the extracted **traversal brain** from the larger Fork Tales web-graph system.

## Reading order

1. `../README.md` — quick orientation
2. `FORK_TALES_SOURCE_MAP.md` — upstream origins inside `fork_tales`
3. `OPENCODE_SESSION_PROVENANCE.md` — later recovery trail
4. `../specs/core-engine-contract.md` — public engine contract
5. `../specs/frontier-and-pheromone-model.md` — URL state, trimming, and ACO choice logic
6. `../specs/ethical-crawling-contract.md` — robots, host pacing, and fail-safe rules
7. `../specs/fetch-backend-contract.md` — pluggable backend interface
8. `../specs/myrmex-orchestrator.md` — downstream orchestration with richer extraction
9. `../specs/pluggable-fetch-backend.md` — design note for backend pluggability

## What this repo is

`graph-weaver-aco` is not the whole crawler service.
It is the **small deterministic colony kernel**:
- frontier state
- ant selection
- pheromone dynamics
- robots gating
- host pacing
- event emission

## What it is not

It is not:
- the dashboard/UI
- the full graph storage service
- the ShuvCrawl bridge
- the Part64 world-runtime integration layer

Those belong in sibling repos such as:
- `octave-commons/graph-weaver`
- `octave-commons/myrmex`

# Fork Tales Source Map

`myrmex` is less a direct code transplant from early Fork Tales and more a **named convergence** of several later decomposition lines.

## Primary upstream sources

### 1. The Myrmex epic in the devel workspace
- `specs/drafts/myrmex-graph-epic.md`

This is the strongest documentary source for the repo's intent:
- combine GraphWeaver ACO traversal with ShuvCrawl extraction
- route content through Proxx into OpenPlanner
- preserve graph state and expose management surfaces

### 2. GraphWeaver ACO downstream specs
- `orgs/octave-commons/graph-weaver-aco/specs/myrmex-orchestrator.md`
- `orgs/octave-commons/graph-weaver-aco/specs/pluggable-fetch-backend.md`

These show how the orchestrator was expected to bind to the extracted traversal kernel.

### 3. Fork Tales crawler doctrine
- `orgs/octave-commons/fork_tales/.opencode/agent/presence.web-graph-weaver.md`
- `orgs/octave-commons/fork_tales/docs/notes/implementation/2026-02-27-daimoi-crawler-muse-architecture-note.md`
- `orgs/octave-commons/fork_tales/docs/notes/implementation/2026-02-26-addendum-standardized-roles-and-test-matrix.md`

These matter because they show the crawler was already becoming an organ in a larger ecology of:
- daimoi
- crawler triggers
- muse coordination
- bounded job queues

## What this repo captures now

- A `Myrmex` class that composes:
  - `ShuvCrawlClient`
  - `ShuvCrawlFetchBackend`
  - `GraphWeaverAco`
  - `EventRouter`
  - `GraphStore`
  - `CheckpointManager`
- a CLI/runtime entrypoint
- a document-first contract for future persistence and recovery

## Honest status

This repo is a prototype extraction of the orchestrator layer.
The checkpoint path is still intentionally skeletal, which is useful because the docs can now lead the next implementation step instead of pretending it is already done.

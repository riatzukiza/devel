# OpenCode Session Provenance

The provenance for `myrmex` is mostly carried by checked-in specs and neighboring repo docs rather than by a rich standalone session trail.

## Strong documentary trail

### `specs/drafts/myrmex-graph-epic.md`
This is the clearest statement of intent for the orchestrator:
- GraphWeaver ACO as traversal brain
- ShuvCrawl as extraction engine
- Proxx/OpenPlanner as ingestion path
- graph state persistence and management surfaces

### `graph-weaver-aco` specs
The neighboring extracted repo now carries two key recovery docs:
- `specs/myrmex-orchestrator.md`
- `specs/pluggable-fetch-backend.md`

Together they preserve how Myrmex was supposed to sit on top of the ACO engine.

## Relevant session constraint

The semantic session-search CLI in `packages/reconstituter` is currently broken in this workspace by an `openplanner-cljs-client` export mismatch, so provenance here was recovered by direct search through checked-in artifacts instead of the intended semantic workflow.

## Honest reading

`myrmex` is a younger extraction than `daimoi` or `graph-runtime`.
Its trail is therefore more programmatic and spec-driven than archaeologically rich.
That is acceptable as long as the docs stay explicit about it.

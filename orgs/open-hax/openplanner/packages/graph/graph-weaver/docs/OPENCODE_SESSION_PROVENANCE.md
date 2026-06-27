# OpenCode Session Provenance

This repo's provenance combines:
- old Fork Tales crawler/service artifacts
- newer graph-workbench implementation in the devel workspace
- neighboring extracted repos such as `graph-weaver-aco`

## Direct session evidence found

### `session-ses_3208.md`
This session records restoring a live Part64 graph/catalog surface and is relevant because it preserves the idea that graph surfaces were operational runtime concerns, not just visualization.

### `session-ses_3402.md`
This session explicitly notes the Node-side web graph weaver script inside Part64.

## Stronger documentary trail than session trail

For this repo, the clearest recovery path is in source/spec artifacts:
- `fork_tales/docs/WEB_GRAPH_WEAVER.md`
- `fork_tales/specs/drafts/web-graph-weaver.md`
- `fork_tales/specs/drafts/weaver-graph-field-integration.md`
- `graph-weaver-aco` code and specs

## Caveat

The semantic session-search CLI in `packages/reconstituter` is currently broken in this workspace by an `openplanner-cljs-client` export mismatch, so provenance here was assembled from direct searches over checked-in session artifacts.

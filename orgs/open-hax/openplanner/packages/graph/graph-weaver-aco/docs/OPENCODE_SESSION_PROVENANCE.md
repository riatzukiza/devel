# OpenCode Session Provenance

This repo's provenance is driven more by checked-in specs and source artifacts than by a rich dedicated session trail.

## Direct session evidence found

### `session-ses_3402.md`
This session artifact explicitly notes:
- `part64/code`: Python runtime and APIs; **Node web graph weaver script**.

That matters because it confirms the crawler had already been recognized as a distinct Node-side organ inside the larger Part64 stack.

## Stronger documentary trail than session trail

For this repo, the design recovery is better anchored in docs/specs than in raw sessions:
- `orgs/octave-commons/fork_tales/docs/WEB_GRAPH_WEAVER.md`
- `orgs/octave-commons/fork_tales/specs/drafts/web-graph-weaver.md`
- `specs/drafts/myrmex-graph-epic.md`
- `orgs/octave-commons/fork_tales/.opencode/agent/presence.web-graph-weaver.md`

## Why this matters

The package we extracted is not the full crawler service but the **decision kernel** that later work needed as a reusable library.
That extraction logic is clearest in the specs and code, even when the session trail is sparse.

## Caveat

The semantic session-search CLI in `packages/reconstituter` is currently broken in this workspace by an `openplanner-cljs-client` export mismatch, so provenance here was recovered by searching the checked-in session artifacts directly.

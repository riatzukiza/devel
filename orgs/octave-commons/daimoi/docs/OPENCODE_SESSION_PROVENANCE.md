# OpenCode Session Provenance

This repo was reconstructed using checked-in OpenCode session artifacts from the devel workspace.

## Relevant session artifacts

### `session-ses_3df5.md`
This session explicitly lists the retrieval stack next steps:
- `Nexus Index` — metadata graph for retrieval
- `Daimoi Walkers` — graph-walking retrieval algorithm

That is important because it shows daimoi were being treated as an actionable retrieval / traversal mechanism, not just lore.

### `docs/opencode-session-ses_3e34.md`
This exported session artifact repeats the same planning vocabulary and is easier to read than the raw session dump.

### `session-ses_3d56.md`
This session artifact records the note bundle containing:
- `cephalon-daimoi-v01.md`
- `cephalon-nexus-index-v01.md`
- `promethean-ontology-8-layers.md`

This is useful because it preserves the note cluster that later decomposition work depended on.

## Related recovered notes
Outside this repo, the later Cephalon note corpus still contains useful adjunct docs:
- `orgs/octave-commons/cephalon/packages/cephalon-cljs/docs/notes/cephalon/cephalon-daimoi-v01.md`
- `orgs/octave-commons/cephalon/packages/cephalon-cljs/docs/notes/cephalon/cephalon-nexus-index-v01.md`

They are not the canonical home for daimoi, but they are part of the recovery trail.

## Provenance method
The semantic session-search CLI in `packages/reconstituter` currently fails in this workspace because of an `openplanner-cljs-client` export mismatch, so the provenance in this file was assembled by searching the checked-in session artifacts directly.

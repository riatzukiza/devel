# OpenCode Session Provenance

This repo was not invented from thin air; it was recovered from earlier OpenCode work in the devel workspace.

## Sessions and artifacts worth rereading

### `session-ses_3208.md`
This session documents getting the live Part64 graph back online after migrating eta-mu into the shared workspace.

Relevant details called out in the session artifact:
- hardening `part64/code/world_web/lith_nexus_index.py`
- restoring a live `api/catalog` graph with reported counts
- validating the websocket and catalog graph surfaces

Why it matters here:
- it shows the graph substrate was not only a theory document, but a live runtime concern
- it links the abstract runtime model to the operational `lith_nexus` / catalog graph

### `session-ses_3df5.md`
This session captured a bundle of load-bearing Cephalon notes and explicitly listed:
- `cephalon-nexus-index-v01.md`
- `Daimoi Walkers` as a next step

Why it matters here:
- it demonstrates that graph indexing and daimoi-based traversal were already being treated as adjacent runtime layers in later decomposition work

### `session-ses_3d56.md`
This session artifact includes the recovered note set containing:
- `cephalon-daimoi-v01.md`
- `cephalon-nexus-index-v01.md`
- `promethean-ontology-8-layers.md`

Why it matters here:
- it preserves the path from `fork_tales` concept clusters into later extracted notes that informed this runtime repo

### `docs/opencode-session-ses_3e34.md`
This artifact repeats the `Nexus Index` / `Daimoi Walkers` planning vocabulary in a cleaner exported form.

## Reading order
1. `SPEC.md`
2. `docs/FORK_TALES_SOURCE_MAP.md`
3. `session-ses_3208.md` in the devel workspace
4. `session-ses_3df5.md` / `docs/opencode-session-ses_3e34.md`
5. the upstream `fork_tales` system-design notes

## Caveat
The session search CLI in `packages/reconstituter` is currently broken in this workspace by an `openplanner-cljs-client` export mismatch, so this provenance was recovered by searching the checked-in session artifacts directly.

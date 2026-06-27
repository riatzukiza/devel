# OpenCode Session Provenance

This repo's consolidation is grounded in checked-in session artifacts and spec files in the devel workspace.

## Important session/spec trail

### `session-ses_3db3.md`
Captured the merge of `services/cephalon-ts` into `packages/cephalon-ts`, including the preference for services as the then-canonical source.

### `session-ses_3d56.md` and `session-ses_3df5.md`
Preserved the later Cephalon note corpus and the load-bearing concepts:
- nexus index
- daimoi walkers
- field digest
- ontology/layer docs

### `spec/2026-02-03-cephalon-clj-recovery.md`
Documents the path archaeology for the lost `cephalon-clj` experiment and the reconstruction of the `recovered/cephalon-clj` archive.

### `spec/2026-02-03-cephalon-clj-recovered-merge.md`
Documents the active JVM Clojure skeleton under `packages/cephalon-clj` and the conclusion that recovered sources were mostly absent, making the live package the real continuation.

### `spec/promethean-discord-io-bridge-agent-consolidation.md`
Preserves the clearest surviving map of the lost two-process CLJ architecture:
- brain
- Discord IO bridge
- shared wire protocol
- MCP tooling path

## Provenance rule

The Cephalon family should be read historically in this order:
1. recovered session/spec archaeology
2. CLJ precursor(s)
3. CLJS always-running mind architecture
4. TS head/hive implementation

## Caveat

The semantic session-search CLI in `packages/reconstituter` is currently broken in this workspace by an `openplanner-cljs-client` export mismatch, so provenance here was assembled by direct search over checked-in session and spec artifacts.

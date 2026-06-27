# Fork Tales Source Map

This repo is the cleaned-up **runtime model** extracted from the larger `octave-commons/fork_tales` experiment.

## Primary upstream sources

### 1. Hybrid field/graph formalism
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-hybrid-field-graph-formalism.md`

This is the clearest precursor to `SPEC.md`. It contributes the core model pieces that later became the standalone runtime document:
- **Presences** with needs, priority, and mass
- **Daimoi** as packets with owner, size, type distribution, and location
- **TruthGraph** / **ViewGraph** split
- a coupled system of **continuous field dynamics** and **discrete graph topology**
- event/ledger explainability as a first-class requirement

### 2. Design clarifications for field and collision semantics
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-design-hole-responses-field-and-collisions.md`

This note sharpens the runtime assumptions behind the more formal spec:
- daimoi as **particle ants** in an ACO-like field
- sparse field deposition and decay
- nexus entities as a **hybrid node/particle** model
- immutable owner semantics for emitted daimoi
- different friction regimes for daimoi, nexus, and presences
- interpretation through a presence-specific semantic lens

### 3. Part64 runtime surfaces
- `orgs/octave-commons/fork_tales/part64/code/world_web/server.py`
- `orgs/octave-commons/fork_tales/part64/docker-compose.yml`
- `orgs/octave-commons/fork_tales/mcp-lith-nexus/`

These are not clean standalone runtime documents, but they show where the model was operationalized:
- simulation parameters for **daimoi** and **nexus** motion
- the live catalog / graph surfaces exposed by the runtime
- the `lith-nexus` layer used to expose a canonical graph view over the system

## Related decomposition docs in the devel workspace
- `specs/eta-mu-extraction-vault.md`
- `specs/daimoi-core-spec.md`
- `specs/drafts/myrmex-graph-epic.md`

These were written while decomposing `fork_tales` into individually comprehensible repos/services.

## How this repo fits the decomposition
- `graph-runtime` = the **load-bearing conceptual substrate**
- `daimoi` = measurement + packet/field semantics extracted from that substrate
- `simulacron` = cognition/layer framing for entities that inhabit the substrate
- `graph-weaver`, `graph-weaver-aco`, `myrmex` = adjacent graph traversal / ingestion systems

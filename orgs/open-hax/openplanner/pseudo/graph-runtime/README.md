# graph-runtime

A speculative **graph-native runtime** design for systems where semantics, topology, resources, and agent behavior share the same graph substrate.


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## What it describes

- **TruthGraph** and **ViewGraph** separation
- **Nexus** runtime nodes with resource reservoirs and pressure
- **Presences** that project needs and gravity wells over the graph
- **Daimoi** as probabilistic message packets moving through the system
- local pricing, flow, congestion, and graph-distance-aware resource allocation

## Reading order

1. `SPEC.md` — the main runtime specification
2. `docs/INDEX.md` — repo map and navigation
3. `docs/FORK_TALES_SOURCE_MAP.md` — where the model came from in `fork_tales`
4. `docs/OPENCODE_SESSION_PROVENANCE.md` — session artifacts that carried the decomposition forward
5. `specs/runtime-surfaces.md` — mapping from abstract runtime ideas to concrete old runtime surfaces
6. `specs/decomposition-roadmap.md` — proposed service/package cuts for future extraction

## Status

Draft / exploratory. This repo captures the formal model plus provenance back to the coupled `fork_tales` experiment and later OpenCode decomposition work.

## Adjacent repos

- `octave-commons/daimoi` — packet / field / observer layer
- `octave-commons/simulacron` — layered entity / presence framing
- `octave-commons/graph-weaver` — graph UI and local/web graph surface
- `octave-commons/myrmex` — graph foraging/orchestration layer

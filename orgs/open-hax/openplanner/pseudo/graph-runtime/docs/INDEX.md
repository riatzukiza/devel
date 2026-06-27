# Graph Runtime Docs Index

This repo is the extracted **substrate dossier** for the part of `fork_tales` that wanted to become a graph-native runtime.

## Reading order

1. `../SPEC.md` — canonical formal statement of the runtime
2. `FORK_TALES_SOURCE_MAP.md` — upstream code and note origins
3. `OPENCODE_SESSION_PROVENANCE.md` — later session trail and recovery notes
4. `../specs/runtime-surfaces.md` — how the abstract model appeared in live Fork Tales runtime surfaces
5. `../specs/decomposition-roadmap.md` — how to cut this substrate into comprehensible services

## What this repo is for

- preserve the **runtime ideas** separately from the coupled experiment
- describe the **load-bearing abstractions** clearly enough that implementations can be rebuilt
- record how the substrate relates to adjacent repos:
  - `octave-commons/daimoi`
  - `octave-commons/simulacron`
  - `octave-commons/graph-weaver`
  - `octave-commons/myrmex`

## Core vocabulary

- **TruthGraph** — immutable provenance-preserving graph of raw objects
- **ViewGraph** — coarsened / operational graph projected from TruthGraph
- **Nexus** — runtime node with resources, pressure, and topology
- **Presence** — policy-bearing influence pattern with needs and mass
- **Daimoi** — packets / particles / probabilistic traversals moving through the field

## Truth note

This repo is still design-first. It is honest about upstream sources and downstream aspirations rather than pretending a finished runtime already exists here.

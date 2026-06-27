# daimoi

Design notes for **Daimoi** field physics, static-observer measurement, and signal-to-noise metrics.

## Reading order

1. `docs/INDEX.md` — repo map and navigation
2. `docs/snr-metrics.md` — non-arbitrary SNR metrics for daimoi populations and field-following behavior
3. `docs/FORK_TALES_SOURCE_MAP.md` — the upstream `fork_tales` files and notes behind the concept
4. `docs/OPENCODE_SESSION_PROVENANCE.md` — later session artifacts that kept the decomposition alive
5. `docs/ANNOTATED_SOURCE_EXCERPTS.md` — extracted constants, profile rows, and code-surface readings
6. `docs/VISUAL_LANGUAGE.md` — UI/UX grammar for daimoi as symbolic packets
7. `specs/field-model.md` — minimal operational model for daimoi state and movement
8. `specs/runtime-parameters-and-profiles.md` — recovered defaults, bounds, and typed classes
9. `specs/ownership-collision-and-observer.md` — explicit ownership, collision, and governance rules
10. `specs/retrieval-walkers.md` — later graph-walk / associative-memory meaning of daimoi
11. `specs/event-schema.md` — append-only event vocabulary for a future engine
12. `specs/extraction-roadmap.md` — path from dense Part64 subsystem to standalone package
13. `specs/implementation-backlog.md` — concrete build sequence

## Status

Exploratory design repo extracted from the devel workspace, with explicit provenance back to the original `fork_tales` runtime and the later recovery sessions.

## Adjacent repos

- `octave-commons/graph-runtime` — graph/topology/resource substrate
- `octave-commons/simulacron` — layered entities served by casts of presences

## Current shape

This repo now holds five complementary layers:
- provenance
- source-map
- annotated upstream excerpts
- operational specs
- extraction roadmap

The intent is simple: a future implementer should be able to rebuild the organism without reopening the entire Part64 vault first.

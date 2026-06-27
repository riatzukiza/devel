# cephalon

**Cephalon** is the head of the agent system: the thing the user is actually speaking to.

This repo is the intended **single source of truth** for the Cephalon family inside the `octave-commons` line.


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Canonical Runtime

**`packages/cephalon-cljs`** is the canonical implementation using ECS architecture.

The TypeScript package (`packages/cephalon-ts`) is deprecated and will be retired after CLJS achieves feature parity. See `specs/cljs-ts-feature-parity-audit.md` for current gaps.

## Reading order

1. `docs/INDEX.md`
2. `specs/cljs-ts-feature-parity-audit.md`
3. `specs/package-decomposition-roadmap.md`
4. `specs/adjacent-systems-matrix.md`
5. `specs/head-of-agent-system.md`
6. `specs/graph-workbench-adapter.md`
7. `specs/cephalon-openplanner-graph-query-contract.md`
8. `specs/package-lattice.md`
9. `specs/boundary-contract.md`
10. `specs/implementation-backlog.md`
11. package dossier indexes under `packages/*/docs/`

## Package lattice

| Package | Status | Description |
|---------|--------|-------------|
| `packages/cephalon-cljs` | **Canonical** | ECS runtime, always-running mind, eidolon |
| `packages/cephalon-ts` | Deprecated | TypeScript runtime (retirement pending) |
| `packages/cephalon-clj` | Reference | JVM Clojure precursor/skeleton |
| `recovered/cephalon-clj` | Archive | Two-process experiment archaeology |

## Decomposition Roadmap

See `specs/package-decomposition-roadmap.md` for the planned decomposition into:

- `@promethean-os/agent-runtime` — CLJS ECS as default implementation
- `@promethean-os/agent-memory` — Recall past states
- `@promethean-os/agent-mind` — Decision making and future inference
- `@promethean-os/personality-system` — Pluggable personality architectures
- `@promethean-os/discord-bot-adapter` — Discord gateway integration
- `@promethean-os/discord-bot-tools` — Discord-specific tools

## Package dossiers

- `packages/cephalon-ts/docs/INDEX.md` — operational runtime dossier
- `packages/cephalon-cljs/docs/INDEX.md` — always-running mind / ECS dossier
- `packages/cephalon-clj/docs/INDEX.md` — precursor runtime dossier
- `recovered/cephalon-clj/docs/INDEX.md` — archaeology dossier

## Why this repo exists

Cephalon was previously scattered across:
- `packages/cephalon-ts`
- `packages/cephalon-clj`
- `services/cephalon-cljs`
- `recovered/cephalon-clj`
- multiple specs and session artifacts

This repo is the act of making that head legible again.

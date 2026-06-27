---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-implementation-backlog-md"
title: "Cephalon Implementation Backlog"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.907Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/implementation-backlog.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/implementation-backlog.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/implementation-backlog.md`

# Cephalon Implementation Backlog

## Canonical Runtime

**`packages/cephalon-cljs`** is the canonical implementation. TypeScript (`packages/cephalon-ts`) is deprecated.

See `specs/cljs-ts-feature-parity-audit.md` for current gaps and `specs/package-decomposition-roadmap.md` for planned decomposition.

## Goal

Turn the consolidated Cephalon canon into a legible, convergent program without destroying the distinct insights carried by each package.

---

## Critical Gaps (CLJS → TS Parity)

| Spec | Points | Status | Description |
|------|--------|--------|-------------|
| [cljs-gap-mongodb-memory-store.md](./cljs-gap-mongodb-memory-store.md) | 2 | **done** | MongoDB persistence for CLJS |
| [cljs-gap-tool-executor-registry.md](./cljs-gap-tool-executor-registry.md) | 5 | **done** | Expand tool registry, add executor |
| [cljs-gap-turn-processor.md](./cljs-gap-turn-processor.md) | 3 | **done** | Turn processing pipeline |
| [cljs-gap-circuit-scheduling.md](./cljs-gap-circuit-scheduling.md) | 3 | **done** | 8-circuit temporal scheduler |
| **Total** | **13** | **13 done** | |

**Execution order:** mongodb-store + tool-executor + circuit-scheduling can run in parallel; turn-processor depends on tool-executor.

---

## Package Decomposition

See [package-decomposition-roadmap.md](./package-decomposition-roadmap.md) for full plan.

| Phase | Spec | Points | Status |
|-------|------|--------|--------|
| 0 | CLJS canonical establishment | 3 | **done** |
| 1 | Personality system | 3 | **in-progress** |
| 2 | Discord adapter | 3 | todo |
| 3 | Agent memory | 2 | todo |
| 4 | Agent LLM | 2 | todo |
| 5 | Tools split | 5 | todo |
| 6 | Agent mind | 2 | todo |
| 7 | Rename packages | 1 | todo |
| 8 | Agent runtime | 3 | todo |

---

## Phase 0 — keep the dossier honest

- [ ] keep root docs and package-level dossier indexes in sync
- [ ] add one package-status matrix showing what is active, precursor, or archival
- [ ] explicitly mark `packages/cephalon-ts/src/app.ts` as the preferred TS assembly seam
- [ ] explicitly mark `packages/cephalon-ts/src/main.ts` as experimental/legacy unless promoted again
- [ ] keep `recovered/cephalon-clj` clearly labeled as archaeology rather than runnable source

## Phase 1 — harden each living stratum

### TypeScript head runtime
- [ ] smoke-test the `createCephalonApp` path
- [ ] verify the eight-circuit scheduler and output-channel routing in one reproducible local profile
- [ ] test `DiscordIntegration`, `ToolExecutor`, and `TurnProcessor` as a single runtime slice
- [ ] decide whether `main.ts` should be absorbed into `app.ts` or remain an explicit lab path

### ClojureScript mind runtime
- [ ] smoke-test the shadow-cljs build and test targets from the canonical repo
- [ ] verify the ECS system order still matches the note/spec doctrine
- [ ] test the TS bridge path deliberately instead of leaving it as a mostly-implicit option
- [ ] identify which note-derived concepts are now executable and which are still only conceptual

### JVM Clojure precursor
- [ ] verify the JVM runtime still boots cleanly from `deps.edn`
- [ ] run the sentinel note-tagging path against a sandbox note set
- [ ] document what parts of eidolon retrieval still work and what parts are only scaffolding

## Phase 2 — boundary contracts between strata

Drafted contract set:
- `specs/boundary-contract.md`
- `specs/contracts/event-envelope.md`
- `specs/contracts/memory-record.md`
- `specs/contracts/tool-surface.md`
- `specs/contracts/runtime-state-and-handoff.md`

- [x] draft one shared event-envelope contract across TS, CLJS, and precursor CLJ paths
- [x] draft one shared memory-record contract with clear required vs optional fields
- [x] draft one shared tool-surface vocabulary for note, memory, Discord, browser, and runtime actions
- [x] draft one runtime-state contract for graph/field/prompt summaries
- [x] draft a revived candidate runtime handoff flow from `packages/cephalon-ts/docs/runtime-handoff.md`

Implemented so far:
- `packages/cephalon-ts/src/contracts/event-envelope.ts`
- `packages/cephalon-ts/src/contracts/memory-record.ts`
- `packages/cephalon-cljs/src/promethean/contracts/event_envelope.cljs`
- `packages/cephalon-cljs/src/promethean/contracts/memory_record.cljs`
- `packages/cephalon-cljs/src/promethean/bridge/cephalon_ts.cljs` boundary-envelope bridge helpers
- `packages/cephalon-clj/src/promethean/contracts/event_envelope.clj`
- `packages/cephalon-clj/src/promethean/contracts/memory_record.clj`
- `packages/cephalon-clj/src/promethean/runtime/eventbus.clj` boundary-edge bus helpers

Implementation and adapter work still remain after the draft, especially for tool and runtime-state surfaces and for deeper live-runtime adoption of the new memory adapters.

## Phase 3 — choose convergence lines

- [ ] decide whether the long-term live runtime is primarily TS with absorbed CLJS ideas, CLJS with TS service adapters, or a stricter mixed architecture
- [ ] extract shared doctrine and schemas into repo-level contracts instead of duplicating them per package
- [ ] choose where the canonical implementation of eidolon, nexus, and prompt-field logic should live
- [ ] choose whether the control plane belongs inside the TS runtime only or as a cross-package contract
- [ ] finish the local-trace/workbench split: `packages/cephalon-ts/src/mind/local-mind-graph.ts` now holds the honest local trace helper, `src/mind/graph-weaver.ts` is a compatibility shim, and `packages/cephalon-ts/src/graph-workbench/client.ts` plus `TurnProcessor` now consume workbench previews; remaining work is to remove old naming drift from the rest of the package
- [x] implement the OpenPlanner-backed graph query seam described in `specs/cephalon-openplanner-graph-query-contract.md` via `packages/cephalon-ts/src/openplanner/graph-*.ts` and initial `TurnProcessor` graph-context integration

## Phase 4 — package-family polish

- [x] add one root matrix relating Cephalon to `graph-runtime`, `graph-weaver`, `myrmex`, `daimoi`, and `simulacron` via `specs/adjacent-systems-matrix.md` (also includes OpenPlanner and current Knoxx roadmap anchors)
- [ ] add reproducible dev profiles for `duck`, `openhax`, `openskull`, and `error`
- [ ] define which repo-local docs are doctrine, which are historical, and which are implementation notes
- [ ] add small architecture diagrams for the TS runtime, CLJS ECS loop, and recovered two-process branch

## Sharp warnings

Bad convergence moves would be:
- deleting the CLJS note corpus because the TS runtime is more runnable
- pretending the recovered CLJ archive is a runnable package
- keeping both `src/app.ts` and `src/main.ts` as equal truths without naming the split
- flattening the family into one language before the shared contracts are explicit

The dossier already tells us something important:
- TS currently speaks best
- CLJS still thinks best in architecture
- JVM CLJ still explains the small loop best
- recovered CLJ still remembers a distributed topology the others keep rediscovering

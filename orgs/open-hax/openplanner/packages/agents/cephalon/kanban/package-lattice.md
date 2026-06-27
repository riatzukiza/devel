---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-package-lattice-md"
title: "Package Lattice"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.914Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-lattice.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-lattice.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/package-lattice.md`

# Package Lattice

## Purpose

Describe how the Cephalon family is partitioned today and what each stratum contributes.

## Lattice

```text
cephalon
├── packages/cephalon-ts      # TS head/runtime/hive path
├── packages/cephalon-cljs    # CLJS always-running mind path
├── packages/cephalon-clj     # JVM CLJ precursor path
└── recovered/cephalon-clj    # recovered archive of lost two-process branch
```

## Package roles

### `cephalon-ts`
Role:
- operational head runtime
- bot/circuit orchestration
- practical service integrations
- user-facing behavior

### `cephalon-cljs`
Role:
- architecture-rich always-running mind
- ECS/event-native runtime
- note corpus and extracted specs
- bridge between concept and executable substrate

### `cephalon-clj`
Role:
- JVM skeleton
- precursor runtime pieces
- useful simplification of watchers/memory/runtime loops

### `recovered/cephalon-clj`
Role:
- archive, not production package
- preserves the shape of the lost brain/discord-io/shared system
- source of architectural prompts and interface clues

## Unification doctrine

The repo should evolve toward:
- one canonical package family
- explicit package boundaries
- no stray duplicate roots in `/packages` or `/recovered` outside this repo

But unification does **not** mean flattening everything into one language or one binary immediately.

## Near-term desired posture

- `cephalon-ts` and `cephalon-cljs` remain primary living packages
- `cephalon-clj` remains a preserved precursor package
- `recovered/cephalon-clj` remains a documented archive feeding future absorption work

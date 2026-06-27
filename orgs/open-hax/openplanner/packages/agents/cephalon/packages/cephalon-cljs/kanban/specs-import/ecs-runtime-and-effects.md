---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-specs-ecs-runtime-and-effects-md"
title: "Cephalon CLJS ECS Runtime and Effects"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:29.131Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/specs/ecs-runtime-and-effects.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/specs/ecs-runtime-and-effects.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/specs-import/ecs-runtime-and-effects.md`

# Cephalon CLJS ECS Runtime and Effects

## Goal

Describe the package as an always-running ECS-style brain daemon instead of only a collection of notes.

## World contract

The runtime world assembled in `src/promethean/main.cljs` carries at least:
- tick/time state
- entities
- incoming and outgoing events
- effect queues and pending effect state
- environment maps for config, clients, adapters, and stores

This matters because the CLJS branch treats cognition as world evolution over time, not only as “call model, get answer.”

## System order

The main executable path currently runs systems in this order:
1. route events into sessions or cephalon-facing processing
2. ingest memory
3. index eidolon / nexus state
4. maintain eidolon vectors
5. run sentinel behavior
6. run cephalon cognition
7. flush side effects

That order is load-bearing.
It means perception, memory, indexing, governance, and action are intended to be distinct passes.

## Effects contract

The effects system currently preserves a strong event-native pattern:
- effects are queued as data
- effects receive IDs and pending-state records
- execution is bounded by `max-inflight`
- each effect resolves into a result or error event
- completed effects are retained for later inspection up to a configured bound

This is one of the cleanest surviving expressions of Cephalon as a structured runtime instead of prompt glue.

## Bridge contract

When `CEPHALON_TS_BRIDGE=true`, the CLJS package may start the TypeScript cephalon runtime.

Interpretation:
- CLJS can still act as the brain-daemon / orchestrating mind layer
- TS can provide a stronger service/runtime/output surface
- the family was already moving toward mixed-language composition

## Why this package still matters

Even if the TS runtime is the stronger operator-facing surface, the CLJS branch still preserves:
- the best explicit world model
- the best system decomposition
- much of the note/spec doctrine around context, eidolon, and field semantics

A future convergence that ignores this package would likely rebuild these ideas from scratch.

---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-head-of-agent-system-md"
title: "Head of the Agent System"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.907Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/head-of-agent-system.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/head-of-agent-system.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/head-of-agent-system.md`

# Head of the Agent System

## Claim

Cephalon is the **head** of the agent system: the locus where user-facing conversation, memory, tool invocation, and session identity braid together.

## Why "head"

Adjacent systems can be understood by role:
- `graph-runtime` — substrate / world
- `daimoi` — moving packets / winds / retrieval walkers
- `simulacron` — layered entity doctrine
- `graph-weaver` / `myrmex` — graph foraging and ingestion organs
- **Cephalon** — the thing that speaks, remembers, routes, and acts

## Load-bearing responsibilities

A serious Cephalon needs to cover at least:
- user-facing session identity
- context compilation
- memory ingestion and retrieval
- tool invocation / coordination
- policy and safety boundaries
- continuity across turns and channels

## Existing package distribution

### `packages/cephalon-ts`
Currently strongest on:
- user-facing runtime and hive model
- bot identities and circuits
- practical integrations and tooling

### `packages/cephalon-cljs`
Currently strongest on:
- architectural notes
- ECS/event-native framing
- eidolon/nexus/daimoi conceptual lattice
- persistent note corpus

### `packages/cephalon-clj`
Currently strongest on:
- smaller JVM skeleton
- simpler precursor implementation of memory/runtime watchers

### `recovered/cephalon-clj`
Currently strongest on:
- remembering the lost two-process architecture
- preserving the brain/discord-io/shared split
- MCP/toolset topology

## Principle

Cephalon should not be treated as a single language implementation.
It is a family of overlapping attempts to build the head.
The job of this repo is to make that family explicit enough that the next cut can unify by doctrine rather than by folder accident.

---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-ts-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-ts-specs-runtime-topology-md"
title: "Cephalon TS Runtime Topology"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:31.326Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-ts/specs/runtime-topology.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-ts/specs/runtime-topology.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-ts/kanban/runtime-topology.md`

# Cephalon TS Runtime Topology

## Purpose

Describe what the TypeScript package is responsible for inside the larger Cephalon family.

## Position in the family

`packages/cephalon-ts` is currently the strongest **user-facing and service-facing** implementation.

It is the stratum most ready to:
- log in as a bot identity
- route incoming messages into session turns
- call tools and external services
- surface memory/running-state through an HTTP UI
- run multiple circuits or multiple cephalons in one process

## Topology

```text
Discord / IRC / feeds / browser / files
                ↓
           Event bus + temporal scheduler
                ↓
           Session manager + circuit manifest
                ↓
        Turn processor + tool executor + memory
                ↓
   output channels / UI / memory summaries / prompt updates
```

## Major subsystems

### Ingress
- Discord gateway integration
- IRC integration
- feed ingestion
- browser/web/vision tools acting as secondary perception surfaces

### Cognition
- session routing
- context assembly
- memory lookup and compaction
- circuit-specific prompts and tool permissions
- graph/field/prompt helper subsystems

### Enactment
- `discord.speak`
- output-channel selection
- tool-driven world actions
- UI and runtime inspection surfaces

### Governance
- temporal scheduling
- circuit cadence
- control-plane pacing and welcome estimation
- prompt update proposals and integrations

## Strongest current invariants

- a cephalon can be parameterized by bot identity instead of hard-coding one persona
- circuit behavior is explicit in `src/circuits.ts`
- runtime ticks can be expressed as scheduled events rather than only raw intervals
- output routing is a first-class runtime concern

## Weakest current invariants

- there are still overlapping entrypoint stories (`app.ts` and `main.ts`)
- some mind/field subsystems are present as local helpers rather than clearly separated contracts
- runtime handoff/promotion is documented but not yet a finished operator flow

## Desired future contract

The TS package should eventually be the place where a future operator can answer, with little ambiguity:
- which cephalon identity is running
- which circuits are active
- what world surfaces it can perceive
- which tools it may use
- how output routing is governed
- how a candidate runtime is promoted safely

## Non-goal

This package does **not** need to absorb every conceptual detail in the family.
The CLJS package remains the richer always-running mind / note-corpus stratum, and the CLJ branches preserve precursor and recovered ideas that should be harvested deliberately rather than silently overwritten.

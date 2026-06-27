---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-boundary-contract-md"
title: "Cephalon Boundary Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.902Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/boundary-contract.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/boundary-contract.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/boundary-contract.md`

# Cephalon Boundary Contract

## Purpose

Define the **cross-strata contract** for the Cephalon family.

This spec is not about how each package stores its own in-memory state.
It is about the shapes that must remain legible when state crosses one of these boundaries:
- package ↔ package
- process ↔ process
- runtime ↔ UI/API
- runtime ↔ persisted artifact
- candidate runtime ↔ incumbent runtime during handoff

## Draft status

This is a **draft normative contract**.

Meaning:
- new convergence work should aim toward these shapes
- existing code may still expose older or package-local forms
- adapters are allowed while the family converges

## Boundary doctrine

### 1. One family, multiple internal representations
The Cephalon family may keep different internal shapes:
- TypeScript runtime uses plain JSON-friendly objects
- CLJS and JVM CLJ often use namespaced keyword maps
- recovered CLJ is archival and non-authoritative as runnable source

That is acceptable **internally**.

### 2. One canonical wire shape
At package/process/runtime boundaries, the canonical exchange shape should be:
- JSON-serializable
- UTF-8 text or standard JSON payloads
- explicit about ids, timestamps, and schema version
- stable enough that TS, CLJS, JVM CLJ, and future mixed runtimes can all adapt to it

### 3. Favor current living surfaces over archaeology
When there is a conflict:
- `packages/cephalon-ts/src/types/index.ts` is the strongest current source for wire-friendly event/memory shapes
- `packages/cephalon-cljs/src/promethean/memory/types.cljs` is the strongest source for the semantic memory record on the CLJS side
- `packages/cephalon-ts/docs/runtime-handoff.md` is the strongest existing statement of candidate promotion intent
- recovered CLJ may inform topology, but does not outrank living executable packages

## Contract surfaces

The boundary contract is partitioned into four subcontracts:

1. `contracts/event-envelope.md`
2. `contracts/memory-record.md`
3. `contracts/tool-surface.md`
4. `contracts/runtime-state-and-handoff.md`

## Ratification rule

A package is considered boundary-compatible when it can do all of the following through adapters or native types:
- emit and consume the canonical event envelope
- emit and consume the canonical memory record
- express tool calls/results through the canonical tool surface
- expose enough runtime state for candidate handoff and inspection

## Non-goals

This contract does **not** require:
- one language
- one binary
- one internal memory implementation
- deleting CLJS or precursor CLJ ideas in favor of TS convenience

It only requires that the family stop smuggling incompatible shapes across boundaries without naming the translation layer.

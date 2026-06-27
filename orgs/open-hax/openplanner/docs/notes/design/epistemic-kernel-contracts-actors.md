---
original_name: "2026.04.17.19.10.00.md"
title: "Epistemic Kernel Contracts and Actors"
summary: "Drafts the epistemic primitives, contracts, actors, events, receipts, and judgments for OpenPlanner and Knoxx/Cephalon runtimes."
category: "design"
created: "2026-04-17"
---

# Epistemic Kernel, Contracts, and Actors

> **Status**: draft, internal design note
> **Context**: tie openplanner's graph/data model to Knoxx/cephalon-style agent contracts and actor model.

## 1. Epistemic primitives (promptdb-core)

The epistemic kernel is a small, stable set of record shapes that everything else (contracts, actors, events, receipts) is built on.

```clojure
(fact {:ctx    :己             ;; who is asserting
       :claim  any?           ;; the proposition
       :src    any?           ;; provenance: event-id, actor-id, external URL, etc.
       :p      [0.0 1.0]      ;; confidence
       :time   inst?})        ;; when asserted

(obs  {:ctx    :己
       :about  any?           ;; what was sensed
       :signal any?           ;; what the signal looked like
       :p      [0.0 1.0]})    ;; confidence it was perceived correctly

(inference {:from  [fact|obs]  ;; evidence chain
            :rule  keyword?    ;; contract-id that fired
            :actor keyword?    ;; who executed the contract
            :claim any?        ;; derived proposition
            :p     [0.0 1.0]}) ;; confidence of derivation

(attestation {:actor   keyword? ;; who is attesting
              :did     any?     ;; what they claim they did
              :run-id  uuid?
              :causedby uuid?   ;; what triggered the run
              :p       [0.0 1.0]})

(judgment {:of      uuid?      ;; which inference or attestation
           :verdict :held|:failed|:partial
           :auditor keyword?   ;; who or what judged
           :p       [0.0 1.0]})
```

**Rule of thumb:** openplanner is the source of truth for these records. Knoxx/cephalon-style runtimes *read and write* this kernel; they do not define a separate epistemic store.

Concretely:

- `fact` encodes "a principal asserted X with probability p at time t".
- `obs` encodes raw signals from ingestors, Discord, UI, etc.
- `inference` encodes a derived claim made by applying a contract/rule to evidence.
- `attestation` is the actor's signed statement of what they did during a run.
- `judgment` is the world's verdict on whether a claim or attestation held.

All higher-level concepts (roles, actors, contracts, receipts, fulfillment) are projections or compositions over this kernel.

## 2. Roles and actors

We treat roles and actors as *facts in the epistemic store*.

- **Role**: a `fact` that a principal has a role in an org.
  - Example: `{:claim [:role :principal-id :org-id :role-id] ...}`
- **Actor**: a principal that is allowed to execute contracts.
  - Example: `{:claim [:actor :principal-id :capabilities {...}] ...}`

This gives us a clean story:

- openplanner stores role membership and actor capability as first-class facts.
- Knoxx/cephalon runtimes query those facts to decide which contracts can fire for which actors.
- Multi-tenancy lives in the same kernel (facts about `:org/id`, `:tenant/id`, etc.).

## 3. Contracts as inference rules

Contracts live above the epistemic kernel and describe *how* new `inference`, `attestation`, and `judgment` records are created.

Contract kinds in this frame:

- `trigger` — turns `obs` into eligible inputs for contract matching.
- `policy` — side-condition: must be true for rule to fire.
- `tool-call` — capability grant: which attestation types this actor may make.
- `agent` — the inference rule itself: `obs + actor-fact → inference + attestation`.
- `fulfillment` — issues `judgment` on an inference/attestation.
- `role` — asserts the actor-fact into the store.

One contract-driven run looks like:

```clojure
obs (event arrives)
  → actor (fact: this principal is permitted to process it)
    → contract (inference-rule: if obs matches pattern, then claim C)
      → inference (claim C, p=0.9, src=event-id, actor-id)
        → action (world-effect)
          → receipt (attestation: actor says they did X)
            → fulfillment (judgment: did C actually hold?)
              → new obs (world changed)
```

The epistemic kernel is where we persist each step of that loop.

## 4. OpenPlanner vs Knoxx responsibilities

**OpenPlanner (this repo):**

- Owns the epistemic kernel records and indexes them.
- Provides search, traversal, and graph views over facts/obs/inferences.
- Ingests promptdb and other filesystem sources as `fact`/`obs`.
- Exposes APIs that:
  - write kernel records (`/v1/fact/upsert`, `/v1/obs/upsert`, etc. — future work),
  - query by principal/org/event,
  - hydrate agent context (RAG, graph traversals) for runtimes.

**Knoxx (agent runtime, separate repo):**

- Owns contract loading, validation, compilation, and execution.
- Binds contracts to actors/principals and orgs.
- Emits `inference` + `attestation` records when contracts fire.
- Subscribes to events and world changes from openplanner and other systems.
- Calls openplanner APIs for:
  - retrieving relevant facts/obs for a given run,
  - writing new kernel records.

We deliberately keep the epistemic kernel in openplanner so that multiple runtimes (Knoxx, future cephalon rewrite, other tools) can share one source of truth.

## 5. PromptDB as first-class evidence

PromptDB becomes just another source of `fact` and `obs` records.

- Prompt definitions live as EDN/Markdown files in this monorepo.
- The ingestion system has a `source-kind :promptdb` driver that:
  - walks the promptdb filesystem,
  - parses EDN/metadata,
  - validates against the same Malli schemas used by Knoxx,
  - emits `fact`/`obs` into the epistemic store.

This gives us:

- A single graph where runtime facts, human-authored prompts, and observed events all coexist.
- Version-controlled prompt changes that show up as new facts over time.

## 6. Datalog layer

Internally, we treat the epistemic kernel as a Datalog-style store:

- Entities for `fact`, `obs`, `inference`, `attestation`, `judgment`, principals, roles, orgs.
- Rules to derive higher-level views ("all inferences made by actor A", "all judgments about org O", etc.).
- openplanner's graph/garden view becomes a projection over this store plus existing Mongo/vector indexes.

This is an implementation detail, but it keeps the mental model simple:

> "The truth is a Datalog-like store of small records. The rest is views and controllers."

## 7. Where we go next

Short-term steps:

1. Introduce shared `.cljc` Malli schemas for the epistemic kernel.
2. Add a `source-kind :promptdb` ingestion contract and driver.
3. Add APIs for writing/reading kernel records from Knoxx.
4. Gradually teach graph/garden views to project from the kernel instead of bespoke document types.

This document is the anchor for the "openplanner as epistemic kernel" direction and is expected to evolve as Knoxx and cephalon runtime work lands.

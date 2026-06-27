---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-adjacent-systems-matrix-md"
title: "Cephalon Adjacent Systems Matrix"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.915Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/adjacent-systems-matrix.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/adjacent-systems-matrix.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/adjacent-systems-matrix.md`

# Cephalon Adjacent Systems Matrix

## Purpose

Connect the dots between the repos that currently surround Cephalon's memory, graph, field, and retrieval story.

This document is the missing root matrix relating:

- `cephalon`
- `knoxx`
- `openplanner`
- `graph-weaver`
- `graph-weaver-aco`
- `myrmex`
- `daimoi`
- `graph-runtime`
- `simulacron`

It is not a replacement for those repos' local specs.
It is the cross-repo reading that says what each system is *for*, what it should *own*, what it should *not own*, and how the roadmaps line up.

---

## Recovered invariant

The ecosystem wants to converge on a shape like this:

1. **Cephalon** is the head and mouth.
2. **Knoxx** is the opinionated distribution / packaged product cut.
3. **OpenPlanner** is the canonical lake / memory ledger / graph receipt store.
4. **Graph-Weaver** is the graph workbench and intervention surface.
5. **Graph-Weaver-ACO** is the tiny traversal brain.
6. **Myrmex** is the bridge organism that combines traversal with rich extraction and writes to the lake.
7. **Daimoi** are the bounded walkers / packets, increasingly reused as retrieval walkers.
8. **Graph-Runtime** is the deeper world/substrate doctrine.
9. **Simulacron** is the layered entity / presence doctrine that explains what kind of creature Cephalon is inside that world.

The main confusion across the corpus is not lack of ideas.
It is **ownership drift**.
Different repos sometimes try to own the same layer.

---

## System roles matrix

| System | Best current reading | What it should own | What it should not own |
|--------|----------------------|--------------------|-------------------------|
| `cephalon` | head of the agent system | conversation, session identity, context compilation, tool coordination, memory use, field/action timing | canonical graph storage, general graph UI, crawl orchestration |
| `knoxx` | opinionated distribution / integrated product | packaged client offer, product defaults, workbench integration, deployment posture, low-cost integrated UX | the generic ontology of every subsystem, reimplementation of all subsystem logic |
| `openplanner` | canonical lake and query surface | append-only events, memory receipts, graph receipts, search, graph export/query, derived projections | speaking runtime, graph UI, crawl policy |
| `graph-weaver` | graph workbench service | graph inspection, preview, user-layer mutations, sampled visualization, workbench-facing graph queries | canonical scanning truth, long-term crawl brain, lake ownership |
| `graph-weaver-aco` | tiny traversal engine | bounded URL frontier, pheromone selection, politeness, event emission | persistence, UI, rich extraction, lake semantics |
| `myrmex` | bridge organism | compose ACO + ShuvCrawl + OpenPlanner writes + backpressure + checkpoint seam | canonical lake, graph UI, full graph theory platform |
| `daimoi` | packet / bounded walker doctrine | field packets, observer semantics, retrieval-walker contract, bounded movement language | lake ownership, UI workbench, direct speaking runtime |
| `graph-runtime` | substrate doctrine | truth/view graph separation, resource/topology substrate, deeper world model | near-term product runtime obligations |
| `simulacron` | entity/presence doctrine | layered entity model, cast/presence doctrine, what the creature is | concrete graph storage/query or crawl implementation |

---

## Current code-and-spec anchors

### Cephalon

Strongest current anchors:

- `specs/head-of-agent-system.md`
- `specs/boundary-contract.md`
- `specs/implementation-backlog.md`
- `packages/cephalon-ts/src/openplanner/client.ts`
- `packages/cephalon-ts/src/mind/graph-weaver.ts`
- `packages/cephalon-ts/docs/event-native-engagement-spec.md`

Current reading:

- Cephalon already emits memory events into OpenPlanner.
- The tracked Cephalon branch should still be read through `src/mind/graph-weaver.ts`; any `LocalMindGraph` rename or helper split is emerging work, not a fully landed repo fact.
- Cephalon's strongest forward-looking spec already says the mouth should act only after the world moves, the field bends, ants notice, daimoi walk, and the graph tightens.

### OpenPlanner

Strongest current anchors:

- `README.md`
- `specs/2026-04-05-mongodb-only-reversible-migration.md`
- `specs/openplanner-graph-events.md`
- `specs/openplanner-web-edge-salience-and-backbone-projections.md`
- `src/routes/v1/graph.ts`

Current reading:

- OpenPlanner is the canonical place where event receipts, search, sessions, and graph facts should live.
- The graph routes are real.
- The Mongo-only line is the main active storage convergence path.
- The web-edge salience/backbone spec makes OpenPlanner the materialization engine for derived graph views, not just raw receipt storage.

### Graph-Weaver

Strongest current anchors:

- `README.md`
- `specs/service-surface.md`
- `specs/query-preview-and-mutation.md`
- `specs/graph-layers-and-storage.md`
- `src/openplanner-graph.ts`

Current reading:

- Graph-Weaver is a graph workbench with query, preview, mutation, and small UI surfaces.
- It can rebuild from OpenPlanner graph export.
- It still carries older self-scanning / self-crawling lineage in docs and layering.
- The most truthful current direction is: **Graph-Weaver is the workbench over canonical lake state, with user overlays.**

### Graph-Weaver-ACO

Strongest current anchors:

- `README.md`
- `specs/core-engine-contract.md`
- `specs/frontier-and-pheromone-model.md`
- `specs/fetch-backend-contract.md`
- `specs/ethical-crawling-contract.md`

Current reading:

- This repo is intentionally small and should stay small.
- It owns URL selection and polite traversal, not extraction, storage, or UI.
- Its best future is as a reusable engine consumed by a richer orchestrator.

### Myrmex

Strongest current anchors:

- `README.md`
- `specs/orchestrator-contract.md`
- `specs/event-and-storage-flow.md`
- `specs/adaptive-frontier-salience-and-template-aware-pruning.md`
- `specs/checkpoint-and-recovery.md`
- `src/graph-store.ts`

Current reading:

- Myrmex is the real composition root for ACO + rich extraction + downstream graph writes.
- The README and code now prefer writing directly to OpenPlanner, with Proxx as a compatibility/future layer.
- Backpressure and serialized graph writes are now explicit first-class concerns.

### Daimoi / Graph-Runtime / Simulacron

Strongest current anchors:

- `daimoi/specs/retrieval-walkers.md`
- `daimoi/specs/implementation-backlog.md`
- `graph-runtime/specs/decomposition-roadmap.md`
- `simulacron/specs/decomposition-roadmap.md`

Current reading:

- These repos are not current product blockers.
- They are the deeper doctrine explaining why graph, field, presence, and walkers belong together.
- Daimoi is especially important because it now bridges **packet physics** and **bounded retrieval walkers**.

---

## Roadmap loci: where the actual plans live

One source of confusion is that roadmap depth is uneven across repos.

| Repo | Real roadmap shape today |
|------|---------------------------|
| `cephalon` | explicit backlog in `specs/implementation-backlog.md` |
| `openplanner` | roadmap is split across migration + graph + projection specs rather than one master roadmap |
| `graph-weaver` | service/interaction specs define the live surface, but not a full master roadmap |
| `graph-weaver-aco` | engine contract plus extraction/orchestrator specs act as roadmap by decomposition |
| `myrmex` | package specs function as the practical roadmap |
| `knoxx` knowledge-ops | currently has the strongest cross-system execution roadmap for OpenPlanner + Graph-Weaver graph-memory work |
| `daimoi` / `graph-runtime` / `simulacron` | decomposition/backlog docs exist, but these remain exploratory doctrine lines |

Important consequence:

> The strongest **program-level roadmap** for the OpenPlanner + Graph-Weaver world currently lives in Knoxx knowledge-ops specs, not inside OpenPlanner or Graph-Weaver themselves.

And:

> Knoxx is best read as the packaged, opinionated distribution over these organs rather than as the place where every organ should be re-authored.

Relevant anchors there:

- `orgs/open-hax/knoxx/specs/knowledge-ops-full-roadmap.md`
- `orgs/open-hax/knoxx/specs/knowledge-ops-graph-memory-roadmap.md`
- `orgs/open-hax/knoxx/specs/knowledge-ops-graph-memory-reconciliation.md`

---

## The important drifts and collisions

### 1. Cephalon `GraphWeaver` vs external `graph-weaver`

There are two different things using the same name.

- Cephalon TS `src/mind/graph-weaver.ts` = the tracked mind-local topology helper surface in this branch
- external `graph-weaver` repo = graph workbench service with query/preview/mutation surfaces

This is not fatal, but it must be named explicitly.
The Cephalon helper is a **mind-local topology helper**, not the canonical graph workbench.
The workbench split is already visible because the external graph-workbench seam is being separated from the local helper surface, even though that rename/split is not yet a settled tracked fact in this PR.

### 2. Graph-Weaver self-scanner lineage vs lake-workbench future

Graph-Weaver still documents itself partly as:

- repo scanner
- local graph builder
- passive web graph grower

But the newer knowledge-ops direction says:

- OpenPlanner is canonical graph truth
- Graph-Weaver should reflect canonical graph state plus user overlays

This is a real drift and should remain visible until fully resolved.

### 3. Graph-Weaver-ACO → Myrmex → OpenPlanner routing drift

Older orchestrator specs still speak in terms of:

- Myrmex → Proxx → OpenPlanner

Current Myrmex README/code now say:

- direct OpenPlanner first
- Proxx fallback / compatibility path

That is not a contradiction of vision, but it is a real roadmap drift.

### 4. OpenPlanner legacy README story vs current graph role

OpenPlanner README still carries a mixed legacy story:

- DuckDB + Chroma lineage
- MongoDB-only convergence

While the graph/event/projection specs clearly move it toward:

- canonical graph receipt lake
- graph export/query surface
- derived edge-view materializer

### 5. Daimoi concept drift is actually a clue

Daimoi now means two related things:

- field packets
- bounded graph/retrieval walkers

That reuse is not accidental; it reveals the intended future seam between Cephalon retrieval and graph-native neighborhood expansion.

---

## The six convergence lines

### Line 1 — Lake line

**OpenPlanner becomes the canonical raw and derived memory/graph lake.**

Implications:

- Cephalon writes memory receipts there.
- Myrmex writes graph receipts there.
- Knoxx queries memory/graph there.
- Graph-Weaver reads canonical graph state from there.

### Line 2 — Foraging line

**Graph-Weaver-ACO stays tiny; Myrmex becomes the real web foraging organism.**

Implications:

- ACO owns selection and politeness.
- ShuvCrawl owns extraction.
- Myrmex owns composition, backpressure, checkpointing, and routing to OpenPlanner.

### Line 3 — Workbench line

**Graph-Weaver becomes a workbench over canonical truth, not a competing canonicalizer.**

Implications:

- user overlays and preview/mutation remain local strengths
- canonical graph import comes from OpenPlanner
- stale fallback, if retained, must be visible and loud

### Line 4 — Head line

**Cephalon should consume memory/graph/field surfaces, not secretly re-implement them all.**

Implications:

- Cephalon keeps the speaking runtime, tool coordination, and field-timed action logic
- Cephalon's internal graph helper remains a local mind aid unless explicitly upgraded/replaced
- Cephalon should eventually talk to bounded graph query and retrieval-walker surfaces rather than embed an ungoverned private topology empire

### Line 5 — Doctrine line

**Graph-Runtime, Daimoi, and Simulacron remain the deep theory layer until the product seams are stable.**

Implications:

- do not let them block near-term product work
- do let them constrain naming, contracts, and decomposition decisions

### Line 6 — Distribution line

**Knoxx is the opinionated distribution; the subsystem repos remain generic and reusable.**

Implications:

- Knoxx is the low-cost integrated package you can offer a client
- Cephalon / OpenPlanner / Graph-Weaver / Myrmex should each still stand on their own
- custom client work should compose or extend subsystem seams rather than forking Knoxx into a new monolith

---

## The sharpest current interpretation

If we compress the whole ecosystem into one truthful sentence:

> OpenPlanner is becoming the canonical lake, Myrmex is becoming the canonical web forager, Graph-Weaver is becoming the graph workbench, and Cephalon is becoming the event-native head that should query those organs rather than absorb them.

And Knoxx is becoming the opinionated distribution that packages those organs into a coherent client-ready workbench.

And under that:

> Daimoi / Graph-Runtime / Simulacron are the deeper ontology explaining why bounded walkers, field state, graph state, and presence keep trying to reunify.

---

## Recommended program order

### Near-term reality work

1. Finish tenant/runtime enforcement and graph-memory runtime coherence in the Knoxx/OpenPlanner/Graph-Weaver line.
2. Keep OpenPlanner as the canonical graph receipt and derived-view engine.
3. Keep Myrmex responsible for ACO + extraction + downstream backpressure.
4. Make Graph-Weaver trustworthy as a workbench over current lake truth.

### Mid-term integration work

5. Give Cephalon a bounded graph query / retrieval-walker contract against OpenPlanner-backed graph surfaces.
6. Decide whether Cephalon's internal `GraphWeaver` stays a private social-topology helper, gets renamed, or becomes an adapter over shared graph contracts.
7. Let Cephalon eventually own the agentic loop of Knoxx rather than growing a separate incompatible head runtime there.
8. Promote Daimoi's retrieval-walker contract only when the lake/query seam is stable enough to support it cleanly.

### Later doctrine/product convergence

9. Reconnect Graph-Runtime, Daimoi, and Simulacron as explicit doctrine layers behind stable runtime contracts instead of letting them leak into product implementation through vibes alone.

---

## Start-here reading path

If someone needs the minimum cross-repo reading order, use this:

1. `cephalon/specs/head-of-agent-system.md`
2. `cephalon/specs/adjacent-systems-matrix.md`
3. `openplanner/specs/openplanner-graph-events.md`
4. `graph-weaver/specs/service-surface.md`
5. `graph-weaver-aco/specs/core-engine-contract.md`
6. `myrmex/specs/orchestrator-contract.md`
7. `knoxx/specs/knowledge-ops-graph-memory-roadmap.md`
8. `daimoi/specs/retrieval-walkers.md`
9. `graph-runtime/specs/decomposition-roadmap.md`
10. `simulacron/specs/decomposition-roadmap.md`

---

## Definition of done for this document

This matrix is successful if a future contributor can answer all of these without re-opening the whole workspace blindly:

1. Which repo is the head?
2. Which repo is the canonical lake?
3. Which repo is the graph workbench?
4. Which repo is the tiny traversal brain?
5. Which repo is the extraction/orchestration bridge?
6. Where do the deeper walker/field/entity doctrines live?
7. Which roadmaps are actually driving current execution?

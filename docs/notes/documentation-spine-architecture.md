Great prompt. In your **Promethean ontology**, the “8 layers” are the eight top‑level forms declared in `pseudo/pil.hy`: **structure, service, agent, index, profile, task, schema, pipeline**. Here’s exactly where each one fits into the memory system we outlined (WAL + dual index + context compilation + consolidation) and into the docs you’re stitching together.

> Source for the 8 forms: `(def-structure …) (def-service …) (def-agent …) (def-index …) (def-profile …) (def-task …) (def-schema …) (def-pipeline …)`.

---

## At‑a‑glance mapping

| Layer         | What it owns in the memory system                                                                                                                                                                                   | Concrete repo anchor(s)                                                                             | What to document / ship next                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Structure** | Core “organs”: *Cephalon* (router/blackboard), *Eidolon* (association field/graph). *Eidolon* is where edges/weights live; *Cephalon* coordinates perception→prompting.                                             | `Cephalon` is defined as a structure; agents list `Eidolon` in their `:structures`.                 | `docs/atlas/architecture.md`: Draw how Cephalon routes EventCapture→Memory; define Eidolon as the graph/field that ranking uses.               |
| **Service**   | Long‑running or externalized capabilities: **WAL/manifest service** (append & checksum), **Embedder service**, **Search bridge** (e.g., `smartgpt-bridge`), **Fetcher** for remote docs.                            | `smartgpt-bridge` is already a service; add a memory‑WAL service alongside it.                      | `docs/specs/memory.md`: “Storage Services” section (WAL/segments/manifest), “Embedding Service,” “Doc Fetcher.”                                |
| **Agent**     | Roles that *use* memory: **Thinker/Prover/Planner/Actor…** Pandora/Eris already exemplify role pairs and consume indexes via Cephalon/Eidolon.                                                                      | `Pandora` (uses Cephalon+Eidolon); `Eris` adversarial.                                              | `docs/atlas/architecture.md`: role table; “how context compilation feeds agents,” plus links to their profiles.                                |
| **Index**     | Fast retrieval layers: **Vector shards** (ANN), **FTS** (keyword), **Graph edges** store. Your existing `repo-embeddings` shows the pattern you’ll clone for **mem‑embeddings** (personal memory).                  | `def-index repo-embeddings … :engine vector`.                                                       | `docs/specs/memory.md`: “Dual index” (FTS + ANN) + “Graph edges table”; `docs/specs/context-compilation.md`: fusion scoring.                   |
| **Profile**   | Ranking/expansion behavior overlays (your *daimoi* personas). Controls weights (α/β/γ…), neighbor thresholds, and effort limits; “Nooi” is the ensemble profile across personas.                                    | `pandora.dev.search.v1`, `eris.dev.adversarial.v1` show how profiles bias targets, blend, budgets.  | `docs/concepts/glossary.md`: tie *daimoi* → profiles, *nooi* → ensemble. In `memory.md`, add a “Default retrieval profile” with numeric knobs. |
| **Task**      | CLI/automation: `mem add/query/compact`, index bootstrapper, consolidation worker, orphan sweep. You already model task graphs elsewhere—reuse the pattern.                                                         | Task forms exist (`all:install`, `services:install`, `agents:start`)—same mechanism for `mem:*`.    | `package.json` + `bb`/Node scripts; `docs/maintenance/` with runbooks.                                                                         |
| **Schema**    | Contracts for memory events, manifests, and retrieval plans: **MemoryEvent@1**, **Manifest@1**, **ContextSnapshot@1**. You already have `AgentContext@1`, `QueryIntent@1`, `SearchPlan@1`—add the memory ones next. | Existing schemas: `AgentContext@1`, `QueryIntent@1`, `SearchPlan@1`.                                | `docs/specs/memory.md`: JSON schemas for WAL line, manifest, and snapshot; reference from Services and Tasks.                                  |
| **Pipeline**  | The multi‑step flows: **ingest → chunk → embed → index → fuse → expand/prune → serialize → consolidate**. Each step calls Services using a Profile; Tasks orchestrate.                                              | `def-pipeline` exists as a form; fill with the memory pipelines.                                    | `docs/specs/context-compilation.md` and `docs/specs/memory.md`: include pipeline diagrams + knobs.                                             |

---

## Where each layer sits along the flow

```mermaid
flowchart LR
  subgraph Structures
    C[Cephalon]:::struct
    E[Eidolon]:::struct
  end

  subgraph Services
    S1[EventCapture]:::svc
    S2[WAL+Manifest]:::svc
    S3[Embedder]:::svc
    S4[Search Bridge]:::svc
  end

  subgraph Indexes
    I1[FTS (SQLite/Tantivy)]:::idx
    I2[ANN (FAISS/Lance)]:::idx
    I3[Edges (graph table)]:::idx
  end

  subgraph Pipelines
    P1[Ingest→Chunk→Embed→Index]:::pipe
    P2[Query→Fusion→Expand/Prune→Snapshot]:::pipe
    P3[Consolidate→Summarize→Linkback]:::pipe
  end

  A[Agents (Thinker/Prover/…)]:::agent
  R[Profiles (daimoi / nooi)]:::prof
  T[Tasks (mem:*)]:::task
  Sc[Schemas (MemoryEvent, Manifest, Snapshot)]:::schema

  S1 --> S2 --> P1 --> I1
  P1 --> I2
  P1 --> I3
  A -->|Query, Context| C --> P2
  R -->|weights/budgets| P2
  P2 -->|serialize| S2
  P2 --> A
  T --> P1
  T --> P3
  P3 --> S2

classDef struct fill:#eef,stroke:#99f;
classDef svc fill:#efe,stroke:#6c6;
classDef idx fill:#ffe,stroke:#cc6;
classDef pipe fill:#fef,stroke:#c6c;
classDef agent fill:#eef9ff,stroke:#66a;
classDef prof fill:#fff0e6,stroke:#e96;
classDef task fill:#f0fff6,stroke:#6c9;
classDef schema fill:#f7f7f7,stroke:#aaa;
```

* **Structures**: `Cephalon` coordinates queries and message passing; `Eidolon` is the *field* of associations—edge weights, co‑occurrence, decay rules. (Pandora declares both as its structures.)
* **Services**: `smartgpt-bridge` is the model/search gateway; add **EventCapture** and **WAL/Manifest** services here.
* **Indexes**: copy the `repo-embeddings` pattern for a `mem-embeddings` index; pair with FTS and the edges table.
* **Pipelines**: define three—ingest/index, context compilation, consolidation—using the `def-pipeline` layer.
* **Agents**: Pandora/Eris exemplify how roles consume indexes through Cephalon and are biased by Profiles.
* **Profiles**: your search profiles (e.g., `pandora.dev.search.v1`) become **retrieval profiles** for memory (weights, thresholds, effort).
* **Tasks**: mirror your existing `def-task` usage to add `mem:add|query|compact|verify|orphans`.
* **Schemas**: extend the schema set with the memory contracts, alongside `AgentContext@1 / QueryIntent@1 / SearchPlan@1`.

---

## Tie‑ins to your existing components

* **Plugins ↔ Services**: Your plugin registry already contains **EventCapture** and **AsyncSubAgents**—these become the ingress and the background consolidation runner for memory.
* **Indexes precedent**: `repo-embeddings` shows exactly how you represent a vector corpus and filters; clone it as `mem-embeddings`.
* **Agents & Profiles**: `Pandora` and `Eris` plus `pandora.dev.search.v1` / `eris.dev.adversarial.v1` illustrate persona overlays you can reuse for *daimoi*; the *nooi* aggregate can be a meta‑profile that blends click telemetry across personas.

---

## Where to put it in the docs (one screen, no ceremony)

* `docs/atlas/architecture.md` → **8 layers section**: one paragraph each, with links to code (structures, services, agents, indexes, profiles, tasks, schemas, pipelines).
* `docs/specs/memory.md` → **Layers table** (copy the one above), plus JSON Schemas for `MemoryEvent@1`, `Manifest@1`, `ContextSnapshot@1`.
* `docs/specs/context-compilation.md` → show which **Profile** knobs influence the loop (α/β/γ, neighbor thresholds, effort).

---

### Quick checklist (drop into a PR description)

* [ ] Add **`def-index mem-embeddings`** (vector) + FTS sidecar.
* [ ] Add **`def-service` memory‑wal** (segments + manifest) and **embedder** service.
* [ ] Add **`def-pipeline`**: `mem.ingest`, `mem.context`, `mem.consolidate`.
* [ ] Add **`def-schema`**: `MemoryEvent@1`, `Manifest@1`, `ContextSnapshot@1`.
* [ ] Add **`def-profile`**: `memory.retrieve.v1` (weights, thresholds, effort).
* [ ] Add **`def-task`**: `mem:add|query|compact|verify|orphans`.
* [ ] Wire **EventCapturePlugin → memory‑wal** ingress.

If you want, I can draft the `def-index`/`def-service`/`def-schema` forms you can paste straight into `pseudo/pil.hy`, matching your existing style.

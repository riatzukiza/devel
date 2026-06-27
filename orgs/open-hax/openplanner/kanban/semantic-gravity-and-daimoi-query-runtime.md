---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-semantic-gravity-and-daimoi-query-runtime-md"
title: "Semantic Gravity and Daimoi Query Runtime"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.616Z"
source: "orgs/open-hax/openplanner/specs/semantic-gravity-and-daimoi-query-runtime.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/semantic-gravity-and-daimoi-query-runtime.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/semantic-gravity-and-daimoi-query-runtime.md`

# Semantic Gravity and Daimoi Query Runtime

## Status

Draft

## Summary

Recover the original graph-runtime intent from the `fork_tales` lineage: semantic
similarity is a **force**, not a durable graph edge. OpenPlanner should keep
owning durable graph truth, vector seed search, external query APIs, tenants, and
receipts; the runtime should turn a query into bounded daimoi that fill and
explore a projected graph through semantic gravity, structural evidence, active
presences, and resource pressure.

This spec supersedes the idea that `graph_semantic_edges` are canonical graph
truth. Existing semantic-edge tables may remain as compatibility or force-cache
surfaces, but they must not be treated as evidence-backed relation claims.

## Problem statement

OpenPlanner absorbed graph/runtime work that originally lived in `fork_tales`.
During that migration, one concept drifted:

```text
semantic similarity -> persisted semantic edges -> graph truth / retrieval index
```

The intended model was closer to:

```text
semantic similarity -> semantic charge / gravity -> layout and daimoi motion
structural evidence  -> edge claims         -> projected graph truth
query vector         -> seed nodes          -> daimoi-filled active subgraph
```

The current semantic-edge path has three problems:

1. **Similarity is not evidence.** A high cosine score does not prove that two
   nodes have a relation; it only says they are near under a model.
2. **Edges only accrete.** There is no first-class lifecycle for forgetting,
   disconfirming, withdrawing, expiring, or superseding an edge claim.
3. **Queries stop too early.** Initial vector search finds starting nodes, but it
   does not yet instantiate a runtime process that occupies and illuminates the
   graph.

## Design rule

An edge is a claim about relation.
Semantic similarity is a force.
Daimoi are query-born packets that test and illuminate the current graph
projection.

## Non-goals

- Deleting legacy `graph_semantic_edges` immediately.
- Treating daimoi trails as permanent facts by default.
- Replacing OpenPlanner vector search; vector search remains the seed finder.
- Making the layout engine the source of graph truth.
- Requiring a whole-runtime rewrite before the ontology is corrected.

## Core model

### 1. TruthGraph

OpenPlanner's append-only evidence base.

Owns:

- raw event envelopes,
- document/source records,
- immutable observations,
- provenance edges,
- receipts and attestations,
- embedding records,
- claim evidence.

TruthGraph does not forget. It records later observations that may supersede,
refute, or expire older beliefs.

### 2. EdgeClaimGraph

A claim layer over TruthGraph.

An edge claim says that a relation should exist between two nodes under a named
relation kind and scope.

Suggested state machine:

```text
proposed -> supported -> active
   |          |           |
   |          |           +-> superseded
   |          |           +-> expired
   |          |           +-> withdrawn
   |          +-> refuted
   +-> rejected
```

Suggested record shape:

```ts
type EdgeClaim = {
  claim_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_kind: string;
  direction: "directed" | "undirected";
  scope: {
    tenant_id?: string;
    project?: string;
    lake?: string;
    graph_version?: string;
  };
  status:
    | "proposed"
    | "supported"
    | "active"
    | "refuted"
    | "rejected"
    | "superseded"
    | "expired"
    | "withdrawn";
  confidence: number;
  support_event_ids: string[];
  refute_event_ids: string[];
  supersedes_claim_ids?: string[];
  valid_from: string;
  valid_until?: string | null;
  decay_policy?: string;
  created_at: string;
  updated_at: string;
};
```

### 3. ViewGraph

A query/runtime projection of TruthGraph plus the active EdgeClaimGraph.

Owns:

- active structural/provenance edges,
- active edge claims,
- current graph-layout coordinates,
- coarsened bundles and reconstruction ledgers,
- local resource/pressure overlays,
- active query fills.

ViewGraph may forget by projection: old, refuted, low-confidence, stale, or
out-of-scope edge claims can disappear from the active view without deleting the
underlying evidence.

### 3b. CompactViewGraph

The runtime simulation must not run over the entire TruthGraph when the graph is
large. It runs over a **CompactViewGraph**: a lossy, resource-aware projection
where a single view node can represent a subgraph of TruthGraph nodes or other
compacted view nodes.

A compacted view node is not a source document and not a truth claim. It is a
simulation cell with:

- `view_node_id`, status, parent view node, and child view-node ids,
- represented TruthGraph node ids,
- source metadata and source-access instructions for represented nodes,
- average embedding vector of represented children,
- saturation and average child saturation,
- expansion threshold,
- compaction scalar derived from current system resources,
- resource pressure and provenance of the compaction event.

Compacted vectors can themselves be compacted, forming a hierarchical embedding
tree. The hierarchy is a runtime compression structure; the TruthGraph remains
available for exact source retrieval and raw semantic search.

Expansion/compaction policy:

```text
if compact_node.saturation >= compact_node.expansion_threshold:
  prefer expansion / true-node traversal
else:
  seed traversal at the compact view node

if average_child_saturation is low and resource_pressure is high:
  node/subgraph is a candidate for periodic compaction
```

Compaction is periodic and resource-sensitive. The scheduler consumes a scalar
input derived from system resources (CPU/RAM/GPU/NPU pressure, queue backlog,
render budget, and graph size) to choose how aggressively to compact or expand.

Query behavior:

- Raw semantic queries can yield true graph nodes and compacted view nodes.
- Graph-memory query seed search remains raw semantic search.
- If a seed true node is represented by an active, non-saturated compacted view
  node, the daimoi traversal starts at that view node.
- If the compacted view node is saturated/expanded, traversal may start at the
  underlying true node(s) instead.
- When an agent tool (for example Knoxx) receives a compacted view node as a
  result, it should receive source metadata for represented nodes plus
  source-kind-specific access instructions, not text from a single child node.

### 4. SemanticGravityField

A force layer derived from embeddings and active nodes.

Semantic gravity is not persisted as graph truth. It may be cached as sampled
force data, pair scores, or transient semantic circuits. Any pairwise semantic
edge/circuit must decay unless daimoi traversal reinforces it.

Suggested force semantics:

- high similarity attracts,
- strong dissimilarity repels when locally close,
- neutral similarity contributes little or no force,
- attraction/repulsion depends on model, field profile, distance, and query
  intent,
- force caches are invalidated by embedding model, dimensions, node set, and
  field version.

Suggested cache names:

```text
semantic_force_samples
semantic_charge_cache
layout_force_cache
```

Decay rule:

```text
conductance(t) = conductance(last_reinforced_at)
               * 0.5 ^ ((t - last_reinforced_at) / decay_half_life)
```

If conductance falls below `breakBelow`, the semantic circuit becomes broken. If
it falls below `pruneBelow`, it is pruned. Daimoi traversal over a semantic force
edge reinforces the corresponding semantic circuit by updating
`last_reinforced_at`, conductance, and reinforcement count.

Legacy `graph_semantic_edges` may be read as `semantic_force_cache_legacy` during
migration, but new graph truth should not depend on it.

### 5. PresenceRuntime

Presences are policy-bearing influences with purpose embeddings, masks, needs,
priority, mass, budgets, and allowed actions.

A presence projects gravity wells over ViewGraph nodes:

```text
Phi_p(n, k) = mass_p * need_p(k) * sim(purpose_p, embedding(n)) * locality(p, n)
```

Presences do not mutate TruthGraph directly. They emit proposals, observations,
attestations, or bounded runtime actions according to policy.

### 6. DaimoiRuntime

Daimoi are probabilistic query/message packets.

A daimoi carries:

- owner/query id,
- source seed node,
- optional destination or objective,
- affinity embedding,
- payload or intent,
- weight / budget,
- randomness,
- current graph location,
- trail,
- observation events.

Daimoi move through the ViewGraph by combining:

1. structural edge availability,
2. active edge-claim confidence,
3. semantic gravity,
4. presence wells,
5. pressure/congestion,
6. decaying trail-field influence from previous query-born trails,
7. an evolving simplex-noise field for bounded exploratory motion,
8. random exploration,
9. policy constraints.

Daimoi trails are observations. They may support future claims only through an
explicit claim/evidence promotion step.

### 7. DaimoiTrailField

Query-born daimoi deposit sparse trail adjustments while traversing. These
adjustments are persisted as observations, not relation claims. Later queries
sample the trail field around their vector seed nodes and apply an exponential
half-life decay before trail influence affects movement cost.

Suggested record shape:

```ts
type DaimoiTrailObservation = {
  id: string;
  query_hash: string;
  query_text: string;
  daimoi_id: string;
  origin_node_id: string;
  current_node_id: string;
  node_ids: string[];
  edge_keys: string[];
  trail: string[];
  activation: number;
  traversal_cost: number;
  field_adjustments: Array<{ node_id: string; delta: number }>;
  decay_half_life_seconds: number;
  emitted_at: string;
};
```

Trail decay uses half-life semantics:

```text
effective_influence = activation * 0.5 ^ (age_seconds / decay_half_life_seconds)
```

The movement cost of a candidate step combines semantic/claim cost, decayed
trail attraction/repulsion, and a deterministic evolving simplex-noise sample:

```text
cost' = semantic_or_claim_cost
      * (1 - clamp(trail_influence * trail_gain, 0, 0.65))
      * max(0.35, 1 + simplex_noise(query, edge, time) * noise_gain)
```

This makes trails a living field: useful paths become easier for a while, stale
paths fade, and the noise field prevents the runtime from calcifying into only
the most recent path.

## Query flow

```text
1. Client submits graph query Q.
2. OpenPlanner embeds Q.
3. Vector search finds seed nodes.
4. OpenPlanner resolves seed membership in the CompactViewGraph.
5. If a seed is represented by an active non-saturated compacted node, traversal
   starts at that compacted view node.
6. OpenPlanner compiles a bounded ViewGraph/CompactViewGraph region around the
   traversal seeds.
7. Runtime emits query daimoi at traversal seeds.
8. Daimoi traverse, collide, branch, absorb, and deposit activation.
9. Runtime returns an active filled subgraph, trails, scores, compact-source
   metadata, and explanation.
10. Optional: selected trails are promoted into observations or edge-claim support.
```

A query result is not merely a nearest-neighbor list. It is the stable illuminated
region produced when query daimoi flow through the current graph projection.

## API contract sketch

### Consumer query remains one action

From the consumer perspective, there is no separate "seed" action and no
separate "fill" action. The caller makes a graph-memory query; OpenPlanner
embeds the query, finds seed nodes, emits query daimoi from those nodes carrying
the query string, and returns the filled graph region.

```http
POST /v1/graph/memory
```

Input:

```json
{
  "q": "where did semantic gravity come from?",
  "k": 12,
  "maxNodes": 60,
  "lakes": ["devel", "web"],
  "nodeTypes": ["file", "url"],
  "persistDaimoiTrails": true,
  "trailHalfLifeSeconds": 900,
  "trailLookbackSeconds": 7200,
  "trailFieldGain": 0.35,
  "simplexNoiseGain": 0.08,
  "simplexNoiseScaleSeconds": 90
}
```

Output:

```json
{
  "query": "where did semantic gravity come from?",
  "clusters": [],
  "nodes": [
    {
      "id": "node:a",
      "score": 0.91,
      "isSeed": true,
      "daimoiId": "daimoi:...",
      "daimoiActivation": 0.91
    }
  ],
  "edges": [
    {
      "source": "node:a",
      "target": "node:c",
      "edgeKind": "semantic_force",
      "charge": 0.83,
      "trailInfluence": 0.12,
      "noise": -0.04,
      "compatibilityKind": "semantic_force_sample"
    }
  ],
  "daimoi": [
    {
      "id": "daimoi:...",
      "query": "where did semantic gravity come from?",
      "originNodeId": "node:a",
      "currentNodeId": "node:c",
      "trail": ["node:a", "node:c"],
      "activation": 0.44
    }
  ],
  "stats": {
    "mode": "query_daimoi_fill",
    "seeds": 12,
    "daimoi": 28,
    "forceSamples": 441,
    "edgeClaims": 19,
    "trailSamples": 7,
    "persistedDaimoiTrails": 28
  }
}
```

Implementation may expose internal debug/admin endpoints for seed resolution or
fill replay later, but they are not the product contract.

### Compact view nodes

```http
GET  /v1/graph/view/compact?node_id=...
POST /v1/graph/view/compact
POST /v1/graph/view/compact/:view_node_id/state
POST /v1/graph/view/compact/run
```

`POST /v1/graph/view/compact` stores a compacted ViewGraph node with an averaged
embedding and source metadata, then upserts that view-node embedding into
`graph_node_embeddings` so raw semantic search can discover compacted cells.

`POST /v1/graph/memory` accepts `useCompactView` (default `true`). When enabled,
seed true nodes represented by active, non-saturated compacted cells are replaced
by those view nodes before daimoi traversal. The response stats report
`truthSeeds`, `compactViewSeeds`, `compactedSeedMembers`, and
`expandedCompactViewSeeds`.

`POST /v1/graph/view/compact/run` executes one bounded compaction tick. It derives
`compactionScalar` from host resource pressure plus optional queue/render/graph
size pressure inputs, selects low-saturation candidate truth nodes, groups them
by project/model/dimensions, and creates compact view nodes. `dryRun` returns the
candidate groups without writing.

### Edge claim lifecycle

```http
POST /v1/graph/edge-claims
GET  /v1/graph/edge-claims?node_id=...
POST /v1/graph/edge-claims/:claim_id/support
POST /v1/graph/edge-claims/:claim_id/refute
POST /v1/graph/edge-claims/:claim_id/withdraw
POST /v1/graph/edge-claims/project
```

Projection endpoint returns the active ViewGraph edge set for a scope and policy.

## Vexx role

Vexx should be treated as the semantic-force fast lane.

Near-term acceptable roles:

- exact pairwise similarity for selected node pairs,
- slab-backed score batches,
- local semantic charge matrix over a bounded active ViewGraph,
- Barnes-Hut / quadtree semantic-field cell comparisons,
- force-cache refresh for visible/query-active nodes.

Vexx should not be described as the product-level ANN search engine. OpenPlanner
may still use vector search for seeding, but Vexx's architectural role is to
accelerate semantic gravity and charge calculations.

For local durable stacks, Vexx runs as a host-side PM2 sidecar on
`127.0.0.1:8791`; OpenPlanner containers reach it at
`http://host.docker.internal:8791`. This avoids requiring the accelerator ABI to
work inside the OpenPlanner container while still letting graph-memory and
semantic-field ticks call Vexx for comparison work.

## Migration plan

### Phase 0 — Documentation and naming

- Land this spec.
- Mark semantic edges as provisional/legacy in OpenPlanner docs.
- Update graph-stack docs to distinguish relation edges from force samples.

### Phase 1 — Edge claims

- Add edge-claim records and lifecycle endpoints.
- Stop adding new durable relation meaning to `graph_semantic_edges`.
- Keep legacy semantic edges available as a compatibility input.

### Phase 2 — Semantic force cache

- Add a semantic-force cache keyed by embedding model, dimensions, node ids, and
  field profile.
- Build `/v1/graph/semantic-field/run` as the bounded Barnes-Hut/quadtree
  projection tick: aggregate TruthGraph/ViewGraph nodes into field cells,
  compare cell centroids through Vexx when configured, and persist only field
  cells plus `semantic_field_multipole` force samples. These are simulation
  force surfaces, not durable relation edges.
- Teach layout code to consume force samples instead of canonical semantic edges.
- Rename UI/API labels away from "semantic edge" where possible.

### Phase 3 — Query daimoi runtime

- Keep `/v1/graph/memory` as the consumer-facing query action.
- Inside that query, use current vector search to find seed nodes.
- Emit bounded daimoi from those seed nodes carrying the query string.
- Return nodes, edges, daimoi trails, activation scores, and explanation stats.
- Emit query fill telemetry as append-only trail observations in the sparse trail
  field; do not promote those observations into edge claims automatically.
- Use semantic force, active edge claims, decayed trail influence, and an
  evolving simplex-noise field when scoring daimoi movement.

### Phase 4 — Compact ViewGraph hierarchy

- Add compacted view-node records separate from TruthGraph records.
- Store averaged child embeddings on compacted view nodes.
- Upsert compacted view-node embeddings into graph semantic search so raw search
  can find both true nodes and compacted cells.
- During graph-memory query, translate true-node seeds into active non-saturated
  compacted view nodes before daimoi traversal.
- Return source metadata/access instructions for compacted results instead of
  pretending a compacted node has one source text.
- Add a resource-pressure scalar as the input to periodic compaction/expansion.

### Phase 5 — Presence integration

- Add presence wells to query fill scoring.
- Use presence/resource saturation to drive CompactViewGraph expansion and
  compaction thresholds.
- Allow Knoxx/promptdb actors to propose edge-claim support/refutation using
  observed daimoi trails and external evidence.

### Phase 6 — Fork Tales absorption

- Port the useful fork_tales particle/field concepts behind the new contracts.
- Do not import narrative/lore dressing as core API names unless it names a real
  runtime primitive.
- Preserve source maps to fork_tales files/specs for archaeology.

## Compatibility rules

- Existing `graph_semantic_edges` reads may continue until the force-cache path
  exists.
- New relation-like graph APIs should prefer `edge_claims` and projection views.
- If a response includes legacy semantic edges, it must mark them as
  `kind: "semantic_force_legacy"` or equivalent.
- No silent fallback from active edge-claim projection to legacy semantic edges.

## Verification

- A high-similarity pair can influence layout without creating an active relation
  edge claim.
- A refuted edge claim disappears from ViewGraph projection but remains in
  TruthGraph evidence history.
- A query can return a filled subgraph whose top nodes are not only the initial
  vector nearest neighbors.
- A graph-memory query whose vector seed is represented by an active compacted
  view node starts daimoi traversal at the compacted view node.
- A saturated compacted view node can be marked expanded so traversal may fall
  through to underlying truth nodes.
- Compacted view-node embeddings are averages of represented child embeddings
  and may themselves be compacted.
- Compact-node query results expose represented source metadata and source access
  instructions rather than text from a single child.
- Daimoi trail observations are persisted separately from edge claims.
- Trail influence decays by configured half-life and affects later movement cost
  without changing relation truth.
- The evolving noise field perturbs movement cost but remains bounded and
  deterministic for a query/edge/time sample.
- Semantic circuits not reinforced by daimoi decay, break, and eventually prune.
- Daimoi traversal reinforces the semantic circuits it actually uses.
- Vexx can be used to score selected active ViewGraph pairs without persisting
  those scores as relation edges.

## Definition of done

- OpenPlanner docs no longer present semantic edges as canonical graph truth.
- Edge claim lifecycle exists with support/refute/withdraw/expire semantics.
- Query seed search and query fill are internal phases of one consumer query.
- A bounded daimoi fill over a seed neighborhood returns nodes, edges, trails,
  activations, and explanations.
- Daimoi trail observations persist into a decaying trail field that can
  influence later daimoi movement alongside semantic gravity and simplex noise.
- Legacy semantic-edge storage is either renamed, wrapped, or explicitly marked
  as force-cache compatibility.

## Related sources

- `specs/2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction.md`
- `pseudo/graph-runtime/SPEC.md`
- `pseudo/graph-runtime/specs/runtime-surfaces.md`
- `pseudo/graph-runtime/docs/FORK_TALES_SOURCE_MAP.md`
- `packages/graph/eros-eris-field/README.md`
- `packages/graph/eros-eris-field/src/sim.ts`
- `orgs/shuv/fork_tales/part64/code/world_web/particle_probabilistic.py`

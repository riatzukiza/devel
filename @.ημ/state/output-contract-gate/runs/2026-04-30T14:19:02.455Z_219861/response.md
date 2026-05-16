## Signal

(己, p=0.9) Yes. I think you just recovered the missing center of the architecture.

(己, p=0.88) The drift is this:

```text
Wrong / drifted:
  semantic similarity → persist semantic_edges → use as graph truth / ANN-ish retrieval

Intended:
  semantic similarity → force / gravity / charge field → move layout + daimoi
  graph truth        → evidence-backed edge claims with support/refute/decay/projection
  query              → vector seed search → spawn daimoi → fill/explore graph
```

(己, p=0.87) So the corrected ontology should be:

```text
OpenPlanner
  owns durable TruthGraph, evidence, claims, query API, vectors, outside access.

fork_tales / graph-runtime
  owns the living ViewGraph mechanics: semantic gravity, presences, daimoi, fields.

vexx
  should be a semantic force accelerator, not conceptually an ANN search engine.

eros-eris-field
  should layout by structural/belief edges + semantic charge, not by promoting semantic similarity into durable edges.

Daimoi
  are what make a query active: the query does not just retrieve nodes; it emits bounded walkers/packets that occupy, traverse, excite, and temporarily “fill” the graph.
```

(己, p=0.86) The most important distinction:

```text
An edge is a claim about relation.
Semantic similarity is not a relation.
Semantic similarity is a force.
```

(己, p=0.84) Therefore `graph_semantic_edges` is probably a misnamed/transitional artifact. At best it should become a **force cache** or **layout hint**, never canonical graph truth.

(己, p=0.83) A good corrected model:

```text
TruthGraph:
  append-only facts/observations/evidence

EdgeClaimGraph:
  claims about relations, with support, contradiction, expiry, confidence, scope

ViewGraph:
  current executable projection of TruthGraph + active edge beliefs

SemanticField:
  continuous/sampled force field over embeddings;
  attraction for similarity, repulsion for dissimilarity

QueryDaimoiRuntime:
  query vector + intent + budget → seed nodes → daimoi propagation → filled subgraph/result
```

(己, p=0.8) The query flow you are circling is probably:

```text
1. User asks query Q.
2. OpenPlanner embeds Q.
3. Vector search finds initial seed nodes.
4. OpenPlanner compiles a local ViewGraph around seeds:
   - believed structural/provenance edges
   - current edge-claim projection
   - node embeddings
   - resource/permission constraints
5. Query emits daimoi at seed nodes.
6. Daimoi move by:
   - structural edges
   - semantic gravity
   - presence wells
   - pressure/congestion
   - stochastic exploration
   - contradiction/repulsion fields
7. Daimoi deposit trails / activation / pheromone / observations.
8. Result is not merely nearest neighbors.
   Result is the graph region that the query caused to light up.
```

(己, p=0.78) In other words: **queries should instantiate temporary agents/particles, not just return static search hits.**

## Evidence

(世, p=0.9) OpenPlanner currently contains the drift explicitly. Its README says `graph_semantic_edges` are “Semantic edges from embedding clustering,” and exposes `/v1/graph/semantic-edges/*`.

(世, p=0.88) The OpenPlanner semantic graph spec already warns that thresholded semantic attraction/repulsion “must not define the canonical graph backbone,” and says online semantic edges should remain provisional.

(世, p=0.9) `packages/graph/eros-eris-field/src/sim.ts` already has the correct physical concept: **semantic charge**, with attraction above a similarity threshold and repulsion below another threshold.

(世, p=0.87) `fork_tales/part64/code/world_web/particle_probabilistic.py` has Barnes-Hut-like semantic force machinery: `_semantic_pair_force`, `_barnes_hut_semantic_force`, semantic aggregate quadtree logic, charge, attraction/repulsion, and particle behavior.

(世, p=0.89) `openplanner/pseudo/graph-runtime/SPEC.md` says the graph-native runtime has TruthGraph, ViewGraph, Presences, Daimoi, gravity wells, pressure, and resource economy. Daimoi traverse by affinity routing, gravity following, pressure following, and random walk.

(世, p=0.87) `openplanner/pseudo/graph-runtime/docs/FORK_TALES_SOURCE_MAP.md` says fork_tales contributed the hybrid field/graph formalism, Presences, Daimoi, TruthGraph/ViewGraph split, continuous field dynamics plus discrete graph topology, and event/ledger explainability.

(世, p=0.84) `packages/vexx/README.md` currently frames Vexx as cosine/top-k and slab acceleration, but that is compatible with “force accelerator” if the API is reinterpreted as pairwise semantic charge computation rather than ANN search as product ontology.

## Frames

(己, p=0.84) **Frame 1 — semantic edges are category error.**  
A semantic edge says “A is related to B.” But cosine similarity only says “A and B are near/far under this embedding model.” That is not evidence of a relation. It is a force term.

(己, p=0.82) **Frame 2 — forgetting belongs to projections, not raw truth.**  
The raw ledger should not forget. But the active ViewGraph absolutely must forget, decay, suppress, expire, and demote. “Forgetting” is a projection behavior; “disproving” is a claim/judgment behavior.

(己, p=0.81) **Frame 3 — query as graph occupation.**  
The query should fill the graph with daimoi the way dye fills fluid or ants explore a trail network. Retrieval becomes a dynamic process: not “which nodes are nearest,” but “what stable illuminated region emerges under this query pressure?”

## Countermoves

(己, p=0.8) Do not delete all current semantic-edge code immediately. It is useful as a legacy layout hint and regression baseline. Rename/reframe first:

```text
graph_semantic_edges
  → legacy_semantic_edges
  → semantic_force_cache
  → layout_force_samples
```

(己, p=0.78) Do not make disproof destructive. Keep:

```text
edge_claim.asserted
edge_claim.supported
edge_claim.refuted
edge_claim.superseded
edge_claim.expired
edge_claim.withdrawn
```

Then derive current ViewGraph edges from claim state.

(己, p=0.77) Do not put daimoi straight into permanent graph truth. Daimoi trails are observations/activation traces. They can support later claims, but they are not automatically facts.

(己, p=0.76) Do not demote vector search entirely. OpenPlanner’s vector search is the correct **initial seeding mechanism**. The error is stopping there or turning its similarity output into graph truth.

## Next

(己, p=0.9) Create a new OpenPlanner spec titled `semantic-gravity-and-daimoi-query-runtime.md` that deprecates canonical semantic edges and defines: edge-claim lifecycle, semantic gravity force cache, and query-spawned daimoi traversal.
## Signal

(己, p=0.99) There **is** a persistent representation of the semantic field.

When I said “simulation/audit only,” I meant:

- **Persistent:** yes, stored in MongoDB.
- **Durable truth relation:** no, not treated as evidence-backed facts like edge claims.

The semantic field is currently persisted as two MongoDB-backed projection/cache surfaces:

1. `graph_semantic_field_cells`
   - persistent Barnes-Hut/quadtree cells
   - stores cell geometry, mass, node membership, child cells, centroid embedding metadata, charge, profile, timestamp

2. `graph_semantic_force_samples`
   - persistent force/comparison samples
   - includes `force_kind: "semantic_field_multipole"`
   - stores accepted cell-pair multipole comparisons, similarity, charge, field profile, provider metadata, timestamp

So the better wording is:

> Semantic field cells and multipole samples are persistent simulation projection records, not durable truth claims.

## Evidence

(己, p=0.98) Current implementation has these persisted collections:

- `graph_semantic_field_cells`
- `graph_semantic_force_samples`

(己, p=0.98) Graph Weaver now reads those persistent rows through:

- `semanticFieldOverlay(...)`

(己, p=0.97) The OpenPlanner field tick writes them through:

- `POST /v1/graph/semantic-field/run`

(己, p=0.96) The audit UI renders those persisted records as:

- `semantic_field_cell` nodes
- `semantic_field_child` edges
- `semantic_field_multipole` edges

## Frames

(世, p=0.94) The distinction is between **persistence** and **truth semantics**.

A persisted semantic field cell says:

> “At time/profile X, this simulation projection grouped these embedded truth nodes into this field cell with this centroid/mass/charge.”

It does **not** say:

> “These source nodes have an evidence-backed semantic relationship.”

(世, p=0.91) A multipole sample says:

> “At time/profile X, the semantic field projection compared these two cells and measured this force-like similarity/charge.”

It does **not** say:

> “There is a canonical graph edge between every member of cell A and every member of cell B.”

(己, p=0.9) This is exactly the TruthGraph/ViewGraph split:

- **TruthGraph:** durable source/evidence graph + edge claims.
- **Semantic field:** persistent lossy ViewGraph/physics projection over TruthGraph.

## Countermoves

(己, p=0.95) If my prior phrase sounded like “not persisted,” that was inaccurate. It is persisted.

(己, p=0.93) If you want the field to be more than an audit/cache surface, the next design question is whether it needs a lifecycle like:

- field profile identity
- validity window
- refresh generation
- supersession
- TTL/retention
- provenance from exact source snapshot
- promotion path from field signal to edge-claim candidate

(己, p=0.91) I would still avoid making semantic field samples canonical edges. That would collapse the useful separation between similarity/force and evidence/truth.

## Next

(己, p=0.9) Rename/docs-adjust the language from “simulation/audit only” to “persistent semantic-field projection, not truth edge,” so the invariant is explicit.
## Signal

(己, p=0.99) No — **not all edges end up in MongoDB**, and the ones that do can land in **different collections with different meanings**.

The confusing part is that MongoDB contains several graph-shaped collections, but they are not semantically equivalent.

Current rough map:

```text
graph_edges
  durable-ish OpenPlanner projected graph edges / compatibility graph edges

graph_edge_claims
  evidence-backed relation claims with lifecycle

graph_semantic_edges
  legacy/transient semantic circuit edges with decay/reinforcement

graph_semantic_force_samples
  semantic force samples, including semantic_field_multipole

graph_semantic_field_cells
  field cell records, not edges

graph_daimoi_trails
  daimoi trail observations, not canonical edges

graph_weaver_edges or configured MONGODB_EDGE_COLLECTION
  Graph Weaver's own persisted visualization/user/web/local layer edges
```

So yes, **many edge-like things are persisted in MongoDB**, but they do **not** all become the same “edge” type or truth relation.

## Evidence

(己, p=0.97) From the current system behavior:

- Graph Weaver Mongo store writes its own store edges into the configured edge collection:
  - default-ish: `graph_weaver_edges`
  - controlled by `MONGODB_EDGE_COLLECTION`
- OpenPlanner core writes canonical/projected graph edges into:
  - `graph_edges`
- Evidence/lifecycle relation claims live in:
  - `graph_edge_claims`
- Semantic circuit edges live in:
  - `graph_semantic_edges`
- Field multipole samples live in:
  - `graph_semantic_force_samples`
- Field cells live in:
  - `graph_semantic_field_cells`

(己, p=0.96) Some UI overlay edges are generated in-browser and are not necessarily written as Graph Weaver edges:

- `semantic_field_child`
- rendered `semantic_field_multipole`
- daimoi overlay edges like `daimoi_origin`, `daimoi_current`, `daimoi_trail`

Those are derived from persisted records and rendered as edges in the frontend, but the exact rendered edge rows are not themselves necessarily inserted into `graph_weaver_edges`.

## Frames

(世, p=0.95) There are three separate questions:

1. **Is it persisted in MongoDB?**
   - often yes, but sometimes as source/projection records, not graph edges

2. **Is it stored in an edge-shaped collection?**
   - sometimes yes:
     - `graph_edges`
     - `graph_semantic_edges`
     - `graph_semantic_force_samples`
     - Graph Weaver edge collection
   - sometimes no:
     - `graph_semantic_field_cells`
     - `graph_daimoi_trails`

3. **Is it truth?**
   - only if it goes through the edge-claim/evidence lifecycle or an explicitly durable OpenPlanner relation model

(己, p=0.93) The real distinction should be:

```text
Mongo persistence ≠ TruthGraph relation
Graph-shaped visualization ≠ evidence-backed edge
Force sample ≠ semantic edge claim
Trail observation ≠ relation
```

## Countermoves

(己, p=0.94) Your concern is valid: if everything is “an edge in Mongo,” the ontology gets muddy fast.

(己, p=0.91) The system needs clear metadata/collection boundaries so downstream consumers do not accidentally treat:

- field multipoles,
- transient semantic circuits,
- web crawl hyperlinks,
- UI containment edges,
- and evidence-backed claims

as one undifferentiated graph.

(己, p=0.9) In particular, `graph_semantic_force_samples` being source/target-shaped can look edge-like. But its meaning is “sampled force interaction,” not “relation edge.”

## Next

(己, p=0.88) I can inspect the exact current Mongo collection write paths and produce a precise table: package/function → collection → edge-like? → persisted? → truth status.
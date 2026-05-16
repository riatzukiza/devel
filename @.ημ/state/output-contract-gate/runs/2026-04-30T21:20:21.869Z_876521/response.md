## Signal

(己, p=0.99) Good catch. The implementation represents **semantic field cells as nodes**, not edges.

What I did represent as edges are the **relationships inside the rendered/audit overlay**:

- `semantic_field_cell` = rendered node
- `semantic_field_child` = parent → child quadtree containment edge
- `semantic_field_multipole` = cell → cell force-sample edge, for audit visualization only

So the semantic field cell itself is **not** an edge. It is a persistent cell record rendered as a graph node.

The confusing part is that the UI is graph-based, so even field/projection structures get visualized with nodes and edges.

## Evidence

(己, p=0.98) In the Graph Weaver overlay code, each persisted cell becomes a node:

```js
addNode({
  id: cell.id,
  kind: "semantic_field_cell",
  label: `field L${Number(cell.level || 0)} · ${Number(cell.nodeCount || 0)} nodes`,
  x: Number(cell.centerX || 0),
  y: Number(cell.centerY || 0),
  layer: "field",
  data: { cell, ... }
});
```

(己, p=0.97) Then child-cell containment is rendered as an edge:

```js
edges.push({
  source: cell.id,
  target: childId,
  kind: "semantic_field_child",
  layer: "field"
});
```

(己, p=0.97) And multipole samples are rendered as cell-to-cell audit edges:

```js
edges.push({
  source: sample.source,
  target: sample.target,
  kind: "semantic_field_multipole",
  layer: "field"
});
```

## Frames

(世, p=0.94) There are three different “edge” concepts colliding here:

1. **Truth edge / edge claim**
   - evidence-backed relation
   - durable semantic meaning
   - belongs to TruthGraph

2. **Projection/audit edge**
   - visual or structural helper
   - may be persistent as projection metadata
   - does not imply truth relation

3. **Force sample**
   - measured/sampled interaction between cells
   - persisted as field simulation data
   - rendered as an edge because the UI is graph-shaped

(己, p=0.92) The semantic field is not “stored as edges” in the truth graph. But some field projection relationships are **drawn as edges** in Graph Weaver because parent-child containment and multipole interactions are naturally relational in the visualization.

(己, p=0.88) The phrase I should have used:

> Field cells are persistent projection nodes/cells. Field containment and sampled cell-cell forces are rendered as overlay edges, not truth edges.

## Countermoves

(己, p=0.95) Your confusion is justified; I blurred “rendered as graph overlay edge” with “represented as durable graph edge.”

(己, p=0.93) The safety boundary is: these field overlay edges should never be mixed with `graph_edges` or `graph_edge_claims` as if they were evidence-backed domain relations.

(己, p=0.9) If the UI label/legend makes them look too much like canonical edges, we should rename or visually separate them harder, e.g.:

- `field_cell`
- `field_containment`
- `field_force_sample`
- rendered under a separate “Field Projection” panel

## Next

(己, p=0.9) I can adjust the naming/docs/UI labels so `semantic_field_multipole` is clearly shown as a **force sample**, not a semantic edge.
## Signal

(己, p=0.99) Correct. The layout coordinates were being exported by OpenPlanner but dropped by Graph Weaver during import.

(己, p=0.99) Fixed and restarted `graph-weaver` from the durable service root:

```text
/home/err/devel/services/openplanner
```

(己, p=0.99) New commit:

```text
23910b7 Preserve OpenPlanner layout in graph weaver
```

(己, p=0.98) Fix:

- `packages/graph/graph-weaver/src/openplanner-graph.ts`
  - Added `x?: number`, `y?: number` to exported node type.
  - Preserves exported OpenPlanner coordinates as:

```ts
data.pos = { x: node.x, y: node.y }
```

Graph Weaver’s `graphView` already uses `data.pos` as the authoritative layout override, so this prevents the fallback force layout from creating those giant ring/circle artifacts.

## Evidence

(己, p=0.99) Before fix:

```json
{
  "nodes": 200,
  "withPos": 0
}
```

(己, p=0.99) OpenPlanner export was already sending positions:

```json
{
  "nodes": 100,
  "withXY": 100
}
```

(己, p=0.99) After fix + durable restart:

```json
{
  "ok": true,
  "nodes": 976,
  "withPos": 949,
  "nonPresence": 949,
  "nonPresenceWithPos": 949
}
```

(己, p=0.99) Sample rendered node now carries matching `x/y` and `data.pos`:

```json
{
  "id": "devel:chunk:07e80cc6-8951-4566-a62a-aa0ac6fb31a2:summary",
  "x": 384.3505640222749,
  "y": -486.6512313405716,
  "pos": {
    "x": 384.3505640222749,
    "y": -486.6512313405716
  }
}
```

(己, p=0.99) Live smoke also passed:

```json
{
  "ok": true,
  "edge": {
    "similarity": 0.81,
    "conductance": 0.81,
    "status": "active"
  }
}
```

(己, p=0.99) Final container state:

```text
/openplanner-openplanner-1   status=running health=healthy restarts=0 oom=false
/openplanner-graph-weaver-1 status=running health=healthy restarts=0 oom=false
```

## Frames

(己, p=0.96) The giant circles were not primarily a renderer issue; they were a layout import issue.

(己, p=0.95) Graph Weaver was falling back to derived layout because imported OpenPlanner nodes had no `data.pos`.

(己, p=0.94) Presence nodes still use derived placement unless they get explicit positions, but normal OpenPlanner graph nodes now use the persisted OpenPlanner layout.

## Countermoves

(己, p=0.99) I restarted from `services/openplanner`, not the source compose.

(己, p=0.99) I did not touch the existing untracked `packages/agents/knoxx`.

(己, p=0.98) I preserved the graph-view presence and semantic-edge visibility behavior from the prior fix.

## Next

(己, p=0.9) Refresh `http://127.0.0.1:8796/`; if the browser cached old JS state, hard refresh once.
## Signal

(己, p=0.99) Added a daimoi simulation audit surface to the Graph Weaver page at:

```text
http://127.0.0.1:8796/
```

(己, p=0.99) New commit:

```text
09088db Add daimoi snapshot audit view
```

(己, p=0.98) The graph view now has a **simulation audit** panel with:

- `show daimoi trail snapshots` toggle
- snapshot limit filter
- min activation filter
- lookback window filter
- query substring filter
- refresh button
- snapshot list showing query / activation / traversal cost / time

(己, p=0.98) When enabled, daimoi trail observations are overlaid visually as:

- `daimoi` snapshot nodes
- `daimoi_anchor` nodes for unresolved/current/origin/trail anchors
- `daimoi_origin` edges
- `daimoi_current` edges
- `daimoi_trail` edges

These are visual audit overlays, not durable relation claims.

## Evidence

(己, p=0.99) Added backend GraphQL surface:

```graphql
daimoiSnapshots(
  query: String
  minActivation: Float
  lookbackSeconds: Int
  limit: Int = 200
): [DaimoiSnapshot!]!
```

(己, p=0.99) It reads persisted `graph_daimoi_trails` observations.

(己, p=0.99) Live query returned daimoi snapshots:

```json
{
  "count": 5,
  "sample": [
    {
      "id": "daimoi-trail:77260ef0b4213a388beaa69c",
      "queryText": "semantic gravity presences daimoi trail field",
      "activation": 0.8805331587791443,
      "currentNodeId": "devel:file:orgs/octave-commons/fork_tales/specs/drafts/nexus-daimoi-semantic-fields.md",
      "trail": 1,
      "nodeIds": 1,
      "hasDataJson": true
    }
  ]
}
```

(己, p=0.99) Verified:

```text
pnpm --filter @workspace/graph-weaver build
pnpm exec tsc --noEmit --pretty false
node --check packages/graph/graph-weaver/public/app.js
```

(己, p=0.99) Restarted only from durable deployment root:

```text
/home/err/devel/services/openplanner
```

(己, p=0.99) Final service health:

```text
/openplanner-openplanner-1   status=running health=healthy restarts=0 oom=false
/openplanner-graph-weaver-1 status=running health=healthy restarts=0 oom=false
```

## Frames

(己, p=0.96) This treats daimoi trails as observations/simulation state, not as truth edges.

(己, p=0.95) The UI overlay is intentionally client-side: it lets you audit live/persisted daimoi movement without polluting the durable graph relation model.

(己, p=0.94) The filters give you a practical audit lens: recent high-activation daimoi, query-specific trails, or broad low-threshold state inspection.

## Countermoves

(己, p=0.99) I did not touch `packages/agents/knoxx`.

(己, p=0.99) I did not run durable services from the source repo.

(己, p=0.98) I preserved the prior OpenPlanner layout import fix; daimoi overlays sit on top of the proper persisted layout instead of replacing it.

## Next

(己, p=0.92) Hard-refresh `http://127.0.0.1:8796/`, open **simulation audit**, enable **show daimoi trail snapshots**, then tune lookback / activation / query filters.
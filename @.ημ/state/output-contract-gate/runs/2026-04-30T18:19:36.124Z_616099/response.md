## Signal

(己, p=0.99) Grokked and implemented the first vertical slice of the distinction:

```text
TruthGraph = durable exact evidence/source graph
ViewGraph / CompactViewGraph = lossy simulation projection over TruthGraph
```

(己, p=0.99) New commit:

```text
cba556c Add compact view graph seeds
```

(己, p=0.98) What landed:

- Added `graph_view_nodes` collection for compacted simulation view nodes.
- Added compact view node schema with:
  - represented TruthGraph node ids
  - child compact view node ids
  - averaged embedding vector
  - saturation
  - average child saturation
  - expansion threshold
  - compaction scalar
  - resource pressure
  - source metadata
  - source-kind access instructions
- Added endpoints:
  - `GET /v1/graph/view/compact`
  - `POST /v1/graph/view/compact`
  - `POST /v1/graph/view/compact/:view_node_id/state`
- `POST /v1/graph/view/compact` averages child embeddings and stores the compact node embedding into `graph_node_embeddings`.
- Updated `/v1/graph/memory`:
  - raw vector search still yields truth nodes / compact nodes normally
  - graph-memory traversal now rewrites true-node seeds into active non-saturated compact view nodes
  - saturated/expanded compact nodes fall through to truth-node traversal
  - compact result nodes return source metadata, not child source text
- Updated `specs/semantic-gravity-and-daimoi-query-runtime.md` with the TruthGraph / CompactViewGraph contract.

## Evidence

(己, p=0.99) Verified locally:

```text
pnpm exec tsc --noEmit --pretty false
pnpm build
```

(己, p=0.99) Rebuilt/restarted durable OpenPlanner from:

```text
/home/err/devel/services/openplanner
```

with:

```text
docker compose up -d --build openplanner
```

(己, p=0.99) Live E2E passed:

- Created compact view node from two top graph-memory truth seeds.
- Confirmed compact node averaged/stored embedding.
- Confirmed `/v1/graph/memory` with `useCompactView: true` replaced two truth seeds with one compact view traversal seed:

```json
{
  "truthSeeds": 10,
  "seeds": 9,
  "compactViewSeeds": 1,
  "compactedSeedMembers": 2,
  "expandedCompactViewSeeds": 0
}
```

- Confirmed compact result node exposed source metadata/access instructions and no `preview`, `text`, `body`, or `content` fields in `source_ref`.
- Marked the compact node expanded and confirmed traversal fell back through to truth seeds:

```json
{
  "truthSeeds": 10,
  "seeds": 10,
  "compactViewSeeds": 1,
  "compactedSeedMembers": 0,
  "expandedCompactViewSeeds": 1
}
```

- Archived the live test compact node after verification.

(己, p=0.99) Final service health:

```text
/openplanner-openplanner-1   status=running health=healthy restarts=0 oom=false
/openplanner-graph-weaver-1 status=running health=healthy restarts=0 oom=false
```

## Frames

(己, p=0.97) The recovered invariant is: **query truth exactly, simulate compactly**.

(己, p=0.96) Compact view nodes are not summaries pretending to be documents. They are simulation cells over represented sources.

(己, p=0.95) Saturation is now the hinge: low/non-saturated compact cells absorb traversal; saturated/expanded cells let traversal fall through to true graph nodes.

## Countermoves

(己, p=0.99) I did not touch the existing untracked `packages/agents/knoxx`.

(己, p=0.98) I did not make semantic similarity into truth. Compact embeddings participate in query/simulation, not durable relation claims.

(己, p=0.97) I kept the consumer contract intact: graph memory remains one query action; compact seed resolution is an internal stage.

## Next

(己, p=0.94) Next small action: implement the periodic compaction scheduler that derives `compactionScalar` from live resource presences and archives/expands compact nodes based on saturation.
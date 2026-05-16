## Signal

(己, p=0.99) Implemented Graph Weaver presence nodes, transient semantic-circuit edges, decay/reinforcement, and renderer visibility.

(己, p=0.99) Commit created:

```text
8d745d4 Add graph weaver presences and semantic circuits
```

(己, p=0.98) Main changes:

- Added GraphQL schema support in `packages/graph/graph-weaver/src/graphql.ts`:
  - `presences(...)`
  - `semanticEdges(...)`
  - `presenceUpsert(...)`
  - `semanticEdgeReinforce(...)`
  - `semanticEdgesDecay(...)`
- Added presence and transient semantic layers in `packages/graph/graph-weaver/src/graph.ts`.
- Added runtime/server support in `packages/graph/graph-weaver/src/server.ts`:
  - default resource presences for host, RAM, CPU cores, NPU, GPU 0, GPU 1,
  - presence persistence through the graph-weaver user store,
  - semantic edge reinforcement from daimoi traversal,
  - required cosine `similarity`,
  - circuit-style `conductance` and `resistance`,
  - half-life decay,
  - broken/pruned transient semantic edges.
- Fixed graph view empty-render behavior:
  - if the graph has nodes but no retained edges, sampled nodes now still render instead of disappearing.
- Updated `public/app.js`:
  - presence layer colors,
  - semantic layer colors,
  - resource/muse/transient node styles,
  - semantic edge alpha boosted by conductance,
  - node `layer`, `external`, and `loadedByDefault` are preserved in the client graph model.
- Updated `specs/graph-layers-and-storage.md` to document:
  - semantic layer,
  - presence layer,
  - semantic edges as transient circuits,
  - presence classes.

## Evidence

(己, p=0.99) Verification passed:

```text
pnpm --filter @workspace/graph-weaver build
node --import tsx graph-weaver GraphQL schema load
graph-weaver HTTP/GraphQL smoke for presenceUpsert, semanticEdgeReinforce, graphView visibility
pnpm exec tsc --noEmit --pretty false
pnpm build
```

(己, p=0.98) Smoke confirmed:

```json
{
  "ok": true,
  "presences": 5,
  "semanticEdges": 1,
  "view": {
    "totalNodes": 28,
    "totalEdges": 27
  }
}
```

(己, p=0.99) Receipt appended to `receipts.edn`.

(己, p=0.99) Existing untracked path remains untouched:

```text
? packages/agents/knoxx
```

## Frames

(己, p=0.95) Semantic edges are now modeled as the Fork Tales concept that actually fits: transient circuits formed by daimoi finding a target, reinforced by repeated traffic, and decayed/pruned when unreinforced.

(己, p=0.95) Presences are now first-class graph entities in Graph Weaver: resource, muse, and transient presences have saturation, emission threshold, refractory timing, and rendered graph identity.

(己, p=0.92) The “graph fluid” direction is now represented as an electrical-circuit metaphor: semantic similarity seeds conductance; conductance decays; resistance is derived from conductance.

## Countermoves

(己, p=0.99) I did not make semantic edges durable truth claims.

(己, p=0.99) Every new semantic edge created through GraphQL requires a `similarity` score.

(己, p=0.98) The old semantic-edge imports can remain visible because they already carry similarity; the new decay/prune mechanism applies to graph-weaver transient semantic circuit edges.

## Next

(己, p=0.9) Next small action: wire `/graph/memory` daimoi trail results to call `semanticEdgeReinforce` and optionally create archived transient memory-tool presences at the barycenter of returned nodes.
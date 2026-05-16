## Signal

(己, p=0.95) Done.

(己, p=0.94) Added the new OpenPlanner spec:

- `orgs/open-hax/openplanner/specs/semantic-gravity-and-daimoi-query-runtime.md`

(己, p=0.92) Updated the spec registry:

- `orgs/open-hax/openplanner/specs/README.md`

(己, p=0.91) Recorded the decision receipt:

- `orgs/open-hax/openplanner/receipts.edn`

(己, p=0.93) Committed the work:

```text
3ddfa0b Document semantic gravity daimoi runtime
```

## Evidence

(世, p=0.92) The new spec defines:

- semantic similarity as **force**, not graph truth
- `TruthGraph`
- `EdgeClaimGraph`
- `ViewGraph`
- `SemanticGravityField`
- `PresenceRuntime`
- `DaimoiRuntime`
- query flow: vector seeds → bounded ViewGraph → query-born daimoi fill
- edge-claim lifecycle with support/refute/withdraw/expire
- Vexx as semantic-force fast lane
- migration away from canonical `graph_semantic_edges`

(世, p=0.88) Sanity check passed with:

```text
python3 spec sanity ok 428 lines
```

(世, p=0.87) Note: `python` was unavailable in shell, so I reran with `python3`.

## Frames

(己, p=0.86) The spec now captures the recovered intent: OpenPlanner owns durable graph truth and query APIs; fork_tales/graph-runtime concepts provide living force/daimoi mechanics.

(己, p=0.84) It does not immediately delete semantic edges. It reframes them as legacy/provisional force-cache inputs so migration can be staged.

(己, p=0.82) It creates the missing bridge from “vector search found seeds” to “the query fills the graph with daimoi.”

## Countermoves

(己, p=0.78) I did not touch the existing untracked/unknown `packages/agents/knoxx` status entry.

(己, p=0.8) I did not modify runtime code yet; this was the architecture/spec cut.

(己, p=0.79) The next implementation should avoid renaming APIs blindly until compatibility surfaces are mapped.

## Next

(己, p=0.9) Implement Phase 1 from the spec: add `edge_claims` storage and support/refute/withdraw projection endpoints.
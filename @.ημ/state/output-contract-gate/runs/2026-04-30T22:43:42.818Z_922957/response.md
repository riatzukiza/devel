## Signal

(己, p=0.98) Done. I advanced the graph claim core vertical slice.

Implemented in:

- `orgs/open-hax/openplanner/packages/graph/graph-claim-core/src/openplanner/graph/claims/schema.cljs`
- `orgs/open-hax/openplanner/packages/graph/graph-claim-core/src/openplanner/graph/claims/policy.cljs`
- `orgs/open-hax/openplanner/packages/graph/graph-claim-core/src/openplanner/graph/claims/adapters/mongo.cljs`
- updated `boundary.cljs`, `shadow-cljs.edn`, `index.d.ts`, `README.md`, and tests.

Commits:

- OpenPlanner nested repo: `ecbc414 feat: add graph claim validation policy seam`
- Parent repo submodule pointer: `94bb646d chore: advance openplanner graph claim core`

## Evidence

(己, p=0.96) Added the missing architecture-spec namespaces:

```text
openplanner.graph.claims.schema
openplanner.graph.claims.policy
openplanner.graph.claims.adapters.mongo
```

(己, p=0.95) New exported JS API:

```ts
explainEdgeClaim(claim)
evaluateEdgeClaim(claim)
```

(己, p=0.97) Verification passed:

```text
pnpm --filter @open-hax/openplanner-graph-claim-core test
Ran 6 tests containing 20 assertions.
0 failures, 0 errors.
```

```text
pnpm --filter @open-hax/openplanner-graph-claim-core build
Build completed. 0 warnings.
```

(己, p=0.94) Runtime ESM smoke passed:

```text
evaluateEdgeClaim(...supported claim...).kind === "accept"
```

## Frames

(己, p=0.92) This keeps the package domain-first: schema and policy are pure CLJS/data, while Mongo field alias knowledge sits in an adapter.

(己, p=0.9) This is still intentionally not a full Proxx integration. It creates the seam where Proxx-style abductive evaluation can plug in later.

(己, p=0.88) The package now has a stronger vertical slice: normalize → validate → decide → project.

## Countermoves

(己, p=0.9) I did not modify Knoxx.

(己, p=0.86) I did not create a shared `runtime/node-boundary` package yet, because the spec says to wait for second-consumer pressure.

(己, p=0.82) Parent repo still reports `orgs/open-hax/openplanner` as modified because the nested OpenPlanner repo has pre-existing modified content under `packages/agents/knoxx`; the graph-claim-core path itself is clean after commit.

## Next

(己, p=0.91) Wire the first consumer to call `@open-hax/openplanner-graph-claim-core` for edge-claim validation/projection instead of inline route logic.
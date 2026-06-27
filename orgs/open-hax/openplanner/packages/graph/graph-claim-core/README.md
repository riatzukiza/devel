# @open-hax/openplanner-graph-claim-core

ClojureScript edge-claim domain package for OpenPlanner graph logic.

This is the first extraction point out of the large TypeScript graph route/UI
files. It deliberately separates:

- pure CLJS domain logic in `openplanner.graph.claims.core`
- data-first validation contracts in `openplanner.graph.claims.schema`
- policy-decision seam in `openplanner.graph.claims.policy`
- JavaScript/CLJS conversion in `openplanner.graph.claims.boundary`
- dependency/host field adapters under `openplanner.graph.claims.adapters.*`

The pure namespaces receive normalized CLJS maps only. They do not inspect JS
objects, parse host dates, hash bytes, or guess field aliases. All external
coercion lives at the boundary/adapters.

## Why this shape

The future claim acceptance layer should be defined by an abductive policy DSL,
following the shape of `orgs/open-hax/proxx/src/proxx/policy/`:

- EDN policy trees define accepted/refuted/deferred claim logic.
- A small evaluator/router applies policies to normalized contexts.
- Strategies are explicit injected functions, not hidden conditionals inside
  route handlers.

This package does **not** pull the Proxx policy engine yet. It keeps the graph
claim data shape and projection rules ready for that engine by making the claim
context data-first and CLJS-native. The current `policy.cljs` namespace is a
small domain seam: explicit strategy functions can return `:accept`, `:reject`,
`:defer`, or `:supersede` decisions, and the default decision remains pure data.

## Exports

- `normalizeEdgeClaimStatus(value, fallback?)`
- `normalizeEdgeClaimDirection(value)`
- `normalizeEdgeClaimScope(value)`
- `buildEdgeClaimId(input)`
- `normalizeEdgeClaimInput(input)`
- `claimProjectable(claim, options?)`
- `projectEdgeClaim(claim, options?)`
- `projectEdgeClaims(claims, options?)`
- `projectMongoEdgeClaims(claims, options?)`
- `explainEdgeClaim(claim)
- `evaluateEdgeClaim(claim)`
- `planEdgeClaimTransition(action, body?)`

## Build

```bash
pnpm --filter @open-hax/openplanner-graph-claim-core build
```

## Test

```bash
pnpm --filter @open-hax/openplanner-graph-claim-core test
```

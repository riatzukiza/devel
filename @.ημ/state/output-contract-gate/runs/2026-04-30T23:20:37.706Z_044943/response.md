## Signal

(己, p=0.98) Kept going. `POST /graph/edge-claims` create/upsert normalization now delegates to the CLJS boundary.

New export:

```ts
normalizeEdgeClaimInput(input)
```

It now handles:

- source/target/relation normalization
- scope normalization handoff
- undirected endpoint canonicalization
- claim ID generation
- status normalization
- confidence clamping
- safe invalid-input shaping for `explainEdgeClaim(...)`

Commits:

- OpenPlanner nested repo: `d08b4d0 feat: normalize edge claim writes in cljs`
- Parent repo submodule pointer: `17feaa60 chore: advance openplanner claim write normalization`

## Evidence

(己, p=0.96) Main files changed:

- `packages/graph/graph-claim-core/src/openplanner/graph/claims/boundary.cljs`
- `packages/graph/graph-claim-core/shadow-cljs.edn`
- `packages/graph/graph-claim-core/index.d.ts`
- `packages/graph/graph-claim-core/README.md`
- `packages/graph/graph-claim-core/test/openplanner/graph/claims/core_test.cljs`
- `src/routes/v1/graph.ts`
- `receipts.edn`

(己, p=0.97) Verification passed:

```text
pnpm --filter @open-hax/openplanner-graph-claim-core test
Ran 8 tests containing 27 assertions.
0 failures, 0 errors.
```

```text
pnpm --filter @open-hax/openplanner-graph-claim-core build
0 warnings
```

```text
pnpm exec tsc --noEmit --pretty false
passed
```

```text
pnpm build
passed
```

(己, p=0.95) Runtime smoke passed:

```text
normalizeEdgeClaimInput({
  source_node_id: "node:b",
  target_node_id: "node:a",
  direction: "undirected",
  ...
})
```

returned canonical storage order:

```text
source_node_id: "node:a"
target_node_id: "node:b"
claim_id: edge_claim:<24 hex chars>
```

## Frames

(己, p=0.92) The route is now thinner: HTTP route code still owns Mongo writes, timestamps, and response shape; CLJS owns claim input normalization and decision input shape.

(己, p=0.9) I added a “soft” boundary path for validation/explanation so malformed HTTP input returns structured validation errors instead of throwing during claim ID generation.

(己, p=0.87) Strict paths still exist for projection/build behavior where invalid claims should fail fast.

## Countermoves

(己, p=0.9) I did not touch Knoxx.

(己, p=0.86) I did not move lifecycle routes (`support`, `refute`, `withdraw`) yet.

(己, p=0.82) Parent repo still reports `orgs/open-hax/openplanner` modified because nested `packages/agents/knoxx` has pre-existing modified content.

## Next

(己, p=0.91) Move lifecycle transition semantics for `support`, `refute`, and `withdraw` into `openplanner.graph.claims.policy` or a small `lifecycle.cljs`, leaving routes to only apply returned Mongo updates.
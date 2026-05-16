## Signal

(己, p=0.98) Continued. The Mongo adapter is now exported from `graph-claim-core`, and the route uses it.

Changed:

- `projectMongoEdgeClaims(...)` is now a JS export from `@open-hax/openplanner-graph-claim-core`.
- `/graph/edge-claims/project` now passes Mongo row-like objects directly into the CLJS adapter.
- The route no longer maps projected edge shape inline.

Commits:

- OpenPlanner nested repo: `dc9c2e1 feat: project edge claims via mongo adapter`
- Parent repo submodule pointer: `a6f9c283 chore: advance openplanner claim mongo adapter`

## Evidence

(己, p=0.96) Main files changed:

- `packages/graph/graph-claim-core/src/openplanner/graph/claims/adapters/mongo.cljs`
- `packages/graph/graph-claim-core/shadow-cljs.edn`
- `packages/graph/graph-claim-core/index.d.ts`
- `packages/graph/graph-claim-core/README.md`
- `packages/graph/graph-claim-core/test/openplanner/graph/claims/core_test.cljs`
- `src/routes/v1/graph.ts`
- `receipts.edn`

(己, p=0.97) Verification passed:

```text
pnpm --filter @open-hax/openplanner-graph-claim-core test
Ran 7 tests containing 22 assertions.
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

(己, p=0.95) Runtime package smoke passed:

```text
projectMongoEdgeClaims([...active row...]).edges.length === 1
```

## Frames

(己, p=0.92) This makes the route thinner: Mongo/API row projection semantics now live in the CLJS adapter boundary.

(己, p=0.9) The adapter remains intentionally small: it delegates coercion/projection through the graph claim boundary instead of duplicating domain logic.

(己, p=0.87) This is now a clearer architecture-spec embodiment: runtime route orchestrates, adapter normalizes interop, core/policy/schema own semantics.

## Countermoves

(己, p=0.9) I did not touch Knoxx.

(己, p=0.86) I did not change route storage/query filters yet; only projection mapping moved.

(己, p=0.82) Parent repo still shows `orgs/open-hax/openplanner` modified because nested `packages/agents/knoxx` has pre-existing modified content.

## Next

(己, p=0.91) Move the create/upsert request normalization for `POST /graph/edge-claims` into an exported CLJS boundary function, leaving the route to only validate HTTP, write Mongo, and return the decision.
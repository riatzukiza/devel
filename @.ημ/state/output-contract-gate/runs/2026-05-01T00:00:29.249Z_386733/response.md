## Signal

(己, p=0.98) Done. Edge claim lifecycle semantics now live in CLJS.

Added:

- `openplanner.graph.claims.lifecycle`
- JS export: `planEdgeClaimTransition(action, body?)`

Updated routes:

- `POST /graph/edge-claims/:claim_id/support`
- `POST /graph/edge-claims/:claim_id/refute`
- `POST /graph/edge-claims/:claim_id/withdraw`

The TS route now asks CLJS for the lifecycle transition plan, then only applies the Mongo update.

Commits:

- OpenPlanner nested repo: `bbe7f40 feat: plan edge claim lifecycle in cljs`
- Parent repo submodule pointer: `985829e9 chore: advance openplanner claim lifecycle planning`

## Evidence

(己, p=0.96) Main files changed:

- `packages/graph/graph-claim-core/src/openplanner/graph/claims/lifecycle.cljs`
- `packages/graph/graph-claim-core/shadow-cljs.edn`
- `packages/graph/graph-claim-core/index.d.ts`
- `packages/graph/graph-claim-core/README.md`
- `packages/graph/graph-claim-core/test/openplanner/graph/claims/core_test.cljs`
- `src/routes/v1/graph.ts`
- `receipts.edn`

(己, p=0.97) Verification passed:

```text
pnpm --filter @open-hax/openplanner-graph-claim-core test
Ran 9 tests containing 35 assertions.
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
planEdgeClaimTransition("support", {
  status: "active",
  confidence: "0.9",
  event_ids: ["e1", "e1", "e2"]
})
```

returned:

```text
status: active
eventIds.length: 2
```

## Frames

(己, p=0.92) This makes lifecycle status/confidence/event semantics package-owned instead of route-owned.

(己, p=0.89) TypeScript still owns persistence orchestration, which is correct for the runtime boundary.

(己, p=0.86) The remaining route duplication is now Mongo-update shape, not claim-domain semantics.

## Countermoves

(己, p=0.9) I did not touch Knoxx.

(己, p=0.85) I did not change database schema or indexes.

(己, p=0.82) Parent repo still reports `orgs/open-hax/openplanner` modified because nested `packages/agents/knoxx` has pre-existing modified content.

## Next

(己, p=0.9) Add a small route-level regression smoke for `support/refute/withdraw` using `planEdgeClaimTransition`, or export Mongo-update-shaped transition plans to remove the last duplicated route update wiring.
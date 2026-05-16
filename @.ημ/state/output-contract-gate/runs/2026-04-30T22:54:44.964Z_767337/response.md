## Signal

(己, p=0.98) Continued and wired the first real consumer.

Changed OpenPlanner graph routes to use `@open-hax/openplanner-graph-claim-core` for:

- edge claim status normalization
- direction normalization
- scope normalization
- stable edge claim ID construction
- claim validation/explanation
- claim decision evaluation
- projection of active edge claims

Commits:

- OpenPlanner nested repo: `c790f64 feat: use graph claim core in graph routes`
- Parent repo submodule pointer: `6678aa3d chore: advance openplanner graph route claim core`

## Evidence

(己, p=0.96) Main changed files:

- `orgs/open-hax/openplanner/package.json`
- `orgs/open-hax/openplanner/pnpm-lock.yaml`
- `orgs/open-hax/openplanner/src/routes/v1/graph.ts`
- `orgs/open-hax/openplanner/receipts.edn`

(己, p=0.95) Root build now builds graph claim core before TypeScript:

```json
"build": "pnpm --filter @open-hax/openplanner-graph-claim-core build && pnpm --filter @open-hax/openplanner-document-hydration build && tsc"
```

(己, p=0.96) Verification passed:

```text
pnpm --filter @open-hax/openplanner-graph-claim-core test
Ran 6 tests containing 20 assertions.
0 failures, 0 errors.
```

```text
pnpm exec tsc --noEmit --pretty false
passed
```

```text
pnpm build
graph-claim-core build passed
document-hydration build passed
tsc passed
```

```text
node --import tsx edge-claim helper smoke
passed
```

(己, p=0.84) Existing test command still blocked by pre-existing missing dependency:

```text
pnpm test src/routes/v1/graph.memory.test.ts
ERR_MODULE_NOT_FOUND: Cannot find package 'vitest'
```

## Frames

(己, p=0.92) This completes the first consumer migration: the TS route no longer owns the edge-claim semantic core.

(己, p=0.9) I kept compatibility exports in `src/routes/v1/graph.ts`, so existing tests/importers can still call `buildEdgeClaimId`, `normalizeEdgeClaimStatus`, and `normalizeEdgeClaimDirection`.

(己, p=0.88) The route still owns orchestration and Mongo query shape; claim semantics moved to the CLJS package.

## Countermoves

(己, p=0.9) I did not touch Knoxx.

(己, p=0.86) I avoided committing unrelated lockfile churn from pre-existing Knoxx package drift; `pnpm-lock.yaml` only records the graph-claim-core workspace dependency/importer.

(己, p=0.82) Parent repo still shows `orgs/open-hax/openplanner` as modified because nested `packages/agents/knoxx` has pre-existing modified content inside the submodule.

## Next

(己, p=0.91) Move Mongo-specific claim row normalization from `src/routes/v1/graph.ts` into `openplanner.graph.claims.adapters.mongo` usage from the route, so projection/query code becomes thinner.
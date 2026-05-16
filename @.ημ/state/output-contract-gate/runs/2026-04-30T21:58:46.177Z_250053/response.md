## Signal

(己, p=0.99) Agreed. I started the refactor in that direction instead of continuing to grow the big TS files.

Committed:

- `c017d76 Extract graph claim core cljs package`

New package:

- `packages/graph/graph-claim-core`

What it establishes:

- Pure ClojureScript domain logic:
  - `src/openplanner/graph/claims/core.cljs`
- Explicit JS/CLJS conversion boundary:
  - `src/openplanner/graph/claims/boundary.cljs`
- TypeScript-facing declaration surface:
  - `index.d.ts`
- Shadow build/test setup:
  - `shadow-cljs.edn`
- Tests:
  - `test/openplanner/graph/claims/core_test.cljs`
- README documenting the future Proxx-style abductive policy DSL alignment.

The important boundary is now explicit:

```text
JS / Mongo / HTTP / Date / alias coercion
  → boundary.cljs
  → normalized CLJS maps
  → pure core.cljs
```

Pure CLJS does **not** inspect JS objects, parse host Dates, call Node APIs, or guess field aliases.

## Evidence

(己, p=1.0) Validation passed:

```bash
pnpm --filter @open-hax/openplanner-graph-claim-core test
pnpm --filter @open-hax/openplanner-graph-claim-core build
```

(己, p=1.0) Also verified compiled ESM export:

```text
buildEdgeClaimId sample output matched Node crypto SHA-256 preimage behavior.
```

(己, p=0.99) The package currently exports:

```ts
normalizeEdgeClaimStatus(...)
normalizeEdgeClaimDirection(...)
normalizeEdgeClaimScope(...)
buildEdgeClaimId(...)
claimProjectable(...)
projectEdgeClaim(...)
projectEdgeClaims(...)
```

(己, p=0.98) Receipt recorded in:

- `receipts.edn`

(己, p=1.0) I did not touch/stage the existing Knoxx working-tree modification:

- `M packages/agents/knoxx`

## Frames

(世, p=0.96) This is the first extraction seam out of the large graph route. It targets the claim lifecycle because that is where the future Proxx-style policy engine belongs.

(世, p=0.94) The intended future shape is:

```text
graph observations / claim records
  → normalized CLJS claim context
  → policy DSL evaluator/router
  → abductive acceptance/refutation/defer decision
  → explicit route/job side effect
```

(己, p=0.94) I did **not** pull the Proxx policy engine into OpenPlanner. I only shaped the package so it can accept that engine later without rewriting boundaries again.

## Countermoves

(己, p=0.95) I did not wire this into `src/routes/v1/graph.ts` yet. That should be the next step, but only after this package boundary is stable.

(己, p=0.94) I did not make pure CLJS responsible for JavaScript weirdness. The package has a dedicated boundary namespace for:

- JS object field aliases
- status/direction token coercion
- scope normalization
- Date parsing
- confidence clamping
- ESM export shape

(己, p=0.92) I did not implement claim acceptance policy yet. This is domain/projection extraction, not abductive adjudication.

## Next

(己, p=0.9) Replace the duplicated edge-claim helpers in `src/routes/v1/graph.ts` with imports from `@open-hax/openplanner-graph-claim-core`, then make claim acceptance policy the next CLJS package boundary.
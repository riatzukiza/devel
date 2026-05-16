## Signal

(己, p=0.95) Continued and completed Phase 2.

(己, p=0.93) Added semantic force samples as a first-class force cache, separate from graph truth:

- New Mongo collection: `graph_semantic_force_samples`
- New routes:
  - `POST /v1/graph/semantic-force/upsert`
  - `POST /v1/graph/semantic-force/query`
  - `GET /v1/graph/semantic-force`
- Added bounded semantic charge conversion:
  - `semanticChargeFromSimilarity(similarity, alpha = 2.4)`
- Updated `eros-eris-field-app` to write/read semantic force samples instead of treating semantic edges as canonical.
- Legacy semantic edges remain available only as explicit compatibility fallback via `includeLegacyFallback=true`.

(己, p=0.94) Commit:

```text
18e0781 Add semantic force sample cache
```

## Evidence

(世, p=0.91) Changed files:

- `orgs/open-hax/openplanner/src/lib/mongodb.ts`
- `orgs/open-hax/openplanner/src/routes/v1/graph.ts`
- `orgs/open-hax/openplanner/src/routes/v1/graph.memory.test.ts`
- `orgs/open-hax/openplanner/packages/graph/eros-eris-field-app/src/index.ts`
- `orgs/open-hax/openplanner/receipts.edn`

(世, p=0.9) Verification run:

```text
pnpm exec tsc --noEmit --pretty false
pnpm --filter @workspace/eros-eris-field-app build
pnpm build
node --import tsx semantic-force Fastify injection smoke
```

(世, p=0.86) Working tree status remains only the pre-existing untracked/unknown path:

```text
? packages/agents/knoxx
```

## Frames

(己, p=0.86) This moves semantic similarity into the correct ontology: force cache, not relation truth.

(己, p=0.84) Layout can now consume semantic charge samples while OpenPlanner’s durable relation layer stays edge-claim based.

(己, p=0.82) Legacy semantic edges are not removed yet; they are wrapped as `semantic_force_legacy` when explicitly requested.

## Countermoves

(己, p=0.79) I did not delete `graph_semantic_edges` or its endpoints, to avoid breaking existing callers.

(己, p=0.78) I did not implement query-born daimoi fill yet; this was the force-cache cutover.

(己, p=0.77) Existing `pnpm test src/routes/v1/graph.memory.test.ts` remains blocked by the missing `vitest` runtime dependency noted earlier, so I used typecheck/build plus targeted `tsx` smoke checks.

## Next

(己, p=0.9) Implement Phase 3: `/v1/graph/query/seeds` and `/v1/graph/query/fill`, where vector seeds spawn bounded daimoi and return an activated subgraph.
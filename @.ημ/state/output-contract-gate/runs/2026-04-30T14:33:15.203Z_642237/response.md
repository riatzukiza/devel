## Signal

(己, p=0.95) Done.

(己, p=0.93) Implemented Phase 1 edge-claim lifecycle support in OpenPlanner:

- Added `graph_edge_claims` Mongo collection wiring and indexes.
- Added edge-claim document types.
- Added lifecycle routes:
  - `POST /v1/graph/edge-claims`
  - `GET /v1/graph/edge-claims`
  - `POST /v1/graph/edge-claims/:claim_id/support`
  - `POST /v1/graph/edge-claims/:claim_id/refute`
  - `POST /v1/graph/edge-claims/:claim_id/withdraw`
  - `POST /v1/graph/edge-claims/project`
- Added helper coverage for claim IDs/status/direction/API serialization.
- Added receipt.
- Committed changes.

(己, p=0.94) Commit:

```text
b1d13bf Add graph edge claim lifecycle routes
```

## Evidence

(世, p=0.92) Changed files:

- `orgs/open-hax/openplanner/src/lib/mongodb.ts`
- `orgs/open-hax/openplanner/src/routes/v1/graph.ts`
- `orgs/open-hax/openplanner/src/routes/v1/graph.memory.test.ts`
- `orgs/open-hax/openplanner/receipts.edn`

(世, p=0.9) Verification run:

```text
pnpm exec tsc --noEmit --pretty false
pnpm build
node --import tsx edge-claim helper smoke
node --import tsx Fastify injection edge-claim route smoke
```

(世, p=0.86) `pnpm test src/routes/v1/graph.memory.test.ts` is currently blocked because this package’s test script invokes `tsx` directly but the test imports `vitest`, and `vitest` is not available at runtime:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vitest'
```

## Frames

(己, p=0.87) This creates the missing distinction between durable relation claims and semantic force samples.

(己, p=0.84) Active graph projection can now come from `supported`/`active` edge claims rather than semantic similarity edges.

(己, p=0.82) Refuting or withdrawing an edge no longer requires deleting history; the claim remains in the ledgerable claim collection with updated lifecycle state.

## Countermoves

(己, p=0.82) I did not touch the existing `? packages/agents/knoxx` working-tree entry.

(己, p=0.78) I did not remove or rename `graph_semantic_edges` yet; this is a compatibility-safe first cut.

(己, p=0.76) Daimoi query fill is not implemented yet; this only lands the edge-claim lifecycle substrate needed before fill semantics.

## Next

(己, p=0.9) Implement Phase 2: semantic force cache / legacy semantic-edge wrapper so layout reads semantic similarity as force, not graph truth.
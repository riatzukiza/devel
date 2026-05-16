## Signal

(己, p=0.99) As currently implemented: **mostly no**.

The edge-claim lifecycle exists as an API/data model, and `/v1/graph/memory` **does consume existing active/supported claims**, but I do **not** see an automated in-repo worker that is regularly calling:

```text
POST /v1/graph/edge-claims
POST /v1/graph/edge-claims/:id/support
POST /v1/graph/edge-claims/:id/refute
POST /v1/graph/edge-claims/:id/withdraw
```

So the honest state is:

```text
Edge claims are implemented as an API + Mongo model + query integration.
They are not yet wired into an automatic promotion/adjudication pipeline.
```

The one place they are actively used is this:

```text
/v1/graph/memory reads graph_edge_claims with status supported/active
and uses them as traversable daimoi edges.
```

But creation/support/refutation is currently manual/API-driven unless some external caller outside this repo is using those endpoints.

## Evidence

(己, p=0.98) I searched the repo for callers of:

```text
edge-claims
graphEdgeClaims
support_event_ids
claim_id
```

The hits are mainly:

- implementation in `src/routes/v1/graph.ts`
- Mongo types/indexes in `src/lib/mongodb.ts`
- spec docs
- tests
- `/v1/graph/memory` directly reading `graphEdgeClaims`

(己, p=0.97) The current memory query reads active/projectable claims directly from Mongo:

```ts
app.mongo.graphEdgeClaims.find({
  $and: [
    seedBoundaryFilter,
    { status: { $in: [...EDGE_CLAIM_ACTIVE_PROJECTABLE_STATUSES] } },
  ],
})
```

Then converts them into daimoi traversal edges:

```ts
edgeKind: `claim:${claim.relation_kind}`,
confidence,
claimId: claim.claim_id,
compatibilityKind: "edge_claim",
```

(己, p=0.96) I did not find internal code that automatically does:

```text
daimoi trail → create edge claim
semantic force sample → create edge claim
web crawl edge → create edge claim
parser extraction → create edge claim
```

## Frames

(世, p=0.95) Current architecture is this:

```text
API/data model exists
        ↓
manual or external producer can create claims
        ↓
/graph/memory can consume supported/active claims
        ↓
projection endpoint can return claim-backed graph-shaped edges
```

But missing is this:

```text
observations/signals
        ↓
candidate generation policy
        ↓
evidence scoring/adjudication
        ↓
automatic support/refute/withdraw
        ↓
scheduled projection/cleanup
```

(己, p=0.93) So yes, your “it’s just an API around each of the steps” reading is basically correct for this slice.

(世, p=0.9) The lifecycle is useful but incomplete until there are producers and adjudicators. Right now it is closer to a contract boundary than a self-running truth pipeline.

## Countermoves

(己, p=0.96) Important distinction: it is not completely unused. Existing claims affect `/v1/graph/memory` traversal if they exist and are `supported` or `active`.

(己, p=0.94) But it is not yet self-feeding. Daimoi trails, semantic fields, transient circuits, and crawl observations do not automatically become claims.

(己, p=0.92) That means the current system avoids accidental truth inflation, but at the cost of requiring a missing promotion layer.

What should exist next is probably a bounded “claim candidate/promoter” job:

```text
1. Read recent observations:
   - graph_daimoi_trails
   - graph_semantic_force_samples
   - graph_edges from crawl/parser
   - document/event extraction outputs

2. Group repeated signals:
   - same source/target/relation_kind/scope
   - repeated trails
   - high-confidence parser events
   - stable field interactions

3. Create proposed claims:
   POST /v1/graph/edge-claims

4. Support claims only from evidence events:
   POST /v1/graph/edge-claims/:id/support

5. Refute/withdraw stale contradicted claims:
   POST /v1/graph/edge-claims/:id/refute
   POST /v1/graph/edge-claims/:id/withdraw

6. Memory/query consumes active/supported claims.
```

## Next

(己, p=0.9) Add the missing bounded claim-promoter endpoint/job that turns repeated observations into `proposed` claims, but only promotes to `supported` when evidence events justify it.
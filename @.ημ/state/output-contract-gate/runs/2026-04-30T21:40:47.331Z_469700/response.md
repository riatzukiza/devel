## Signal

(己, p=0.99) Step by step, the **edge claim cycle** works like this in the current code:

```text
1. Observe or infer a possible relation
2. Create/upsert an edge claim
3. Add supporting evidence OR refuting evidence
4. Claim status changes
5. Project only supported/active non-expired claims into graph edges for consumers
6. Later withdraw/refute/supersede/expire/re-project as evidence changes
```

More concretely:

```text
observation/signal
  → proposed claim
  → supported claim
  → active claim
  → projected edge for graph consumers
```

Negative/terminal paths:

```text
proposed/supported/active
  → refuted
  → rejected
  → withdrawn
  → superseded
  → expired
```

The important rule:

```text
The claim is the authority.
The projected edge is just a convenient view of currently acceptable claims.
```

## Evidence

(己, p=0.98) Exact statuses currently defined in code:

```ts
type GraphEdgeClaimStatus =
  | "proposed"
  | "supported"
  | "active"
  | "refuted"
  | "rejected"
  | "superseded"
  | "expired"
  | "withdrawn";
```

(己, p=0.98) Exact projectable statuses currently defined:

```ts
["supported", "active"]
```

So, by default:

```text
proposed   → not projected
supported  → projected
active     → projected
refuted    → not projected
rejected   → not projected
superseded → not projected
expired    → not projected
withdrawn  → not projected
```

(己, p=0.97) Main endpoints:

```text
POST /v1/graph/edge-claims
GET  /v1/graph/edge-claims
POST /v1/graph/edge-claims/:claim_id/support
POST /v1/graph/edge-claims/:claim_id/refute
POST /v1/graph/edge-claims/:claim_id/withdraw
POST /v1/graph/edge-claims/project
```

## Frames

(世, p=0.95) The cycle is best understood as a provenance pipeline, not just a state machine.

### Step 1: Something emits a relation candidate

(己, p=0.94) Some subsystem notices a possible relationship.

Examples:

```text
A document cites another document.
A source event says node A depends on node B.
A daimoi repeatedly traverses from A to B.
A human asserts A explains B.
A parser extracts “X authored Y”.
```

At this point, it is **not truth** yet. It is just a signal.

Possible source surfaces:

```text
events
documents
web crawl observations
manual user assertions
daimoi trails
semantic field signals
code/dependency extraction
```

### Step 2: Create an edge claim

(己, p=0.97) You call:

```http
POST /v1/graph/edge-claims
```

With fields conceptually like:

```json
{
  "source_node_id": "node:A",
  "target_node_id": "node:B",
  "relation_kind": "depends_on",
  "direction": "directed",
  "status": "proposed",
  "confidence": 0.5,
  "support_event_ids": [],
  "refute_event_ids": [],
  "scope": {
    "project": "devel"
  }
}
```

The system stores a document in:

```text
graph_edge_claims
```

The document includes:

```text
claim_id
source_node_id
target_node_id
relation_kind
direction
scope
status
confidence
support_event_ids
refute_event_ids
supersedes_claim_ids
valid_from
valid_until
decay_policy
createdAt
updatedAt
```

### Step 3: Claim identity is deterministic if no claim_id is supplied

(己, p=0.95) If you do not supply `claim_id`, OpenPlanner builds one from:

```text
source_node_id
target_node_id
relation_kind
direction
scope
```

For undirected claims, source/target are sorted so this:

```text
A --related_to-- B
```

and this:

```text
B --related_to-- A
```

resolve to the same claim identity.

So the same relation candidate gets upserted instead of duplicated.

### Step 4: Initial state is usually `proposed`

(己, p=0.94) A newly created claim defaults to:

```text
status = proposed
confidence = 0.5
```

unless the caller provides another valid status.

Meaning:

```text
“We have a candidate relation, but it is not yet accepted enough to project.”
```

A proposed claim is queryable through:

```http
GET /v1/graph/edge-claims
```

but it is not projected by default into graph edges.

### Step 5: Add supporting evidence

(己, p=0.97) If evidence supports the claim, call:

```http
POST /v1/graph/edge-claims/:claim_id/support
```

With event IDs:

```json
{
  "event_ids": ["event:123", "event:456"],
  "confidence": 0.82
}
```

What the current code does:

```text
- adds event IDs to support_event_ids
- sets confidence
- sets status to supported by default
```

You can also request active:

```json
{
  "event_ids": ["event:123"],
  "status": "active",
  "confidence": 0.93
}
```

Current behavior:

```text
if status == active:
  status becomes active
else:
  status becomes supported
```

### Step 6: Supported vs active

(己, p=0.9) Current implementation treats both `supported` and `active` as projectable, but they imply slightly different review strength.

A useful interpretation:

```text
supported:
  There is evidence for this relation.
  It can be projected.

active:
  This relation is currently accepted/operational.
  It can be projected and used as a first-class relation.
```

The code does not yet enforce a complex difference between them. Both project.

### Step 7: Refute if evidence contradicts it

(己, p=0.97) If evidence contradicts the claim, call:

```http
POST /v1/graph/edge-claims/:claim_id/refute
```

Example:

```json
{
  "event_ids": ["event:999"],
  "confidence": 0.0
}
```

Current behavior:

```text
- adds event IDs to refute_event_ids
- sets status = refuted
- sets confidence, defaulting to 0
```

A refuted claim is not projected by default.

### Step 8: Withdraw if the author/system retracts it

(己, p=0.96) If the claim should be retracted without necessarily saying it was disproven:

```http
POST /v1/graph/edge-claims/:claim_id/withdraw
```

Current behavior:

```text
status = withdrawn
updatedAt = now
```

Meaning:

```text
“We no longer stand behind this claim.”
```

Withdrawn claims are not projected by default.

### Step 9: Expiration is checked during projection

(己, p=0.94) Claims can have:

```text
valid_from
valid_until
```

During projection, unless `includeExpired` is true, the code only includes claims where:

```text
valid_until is null/missing OR valid_until > now
```

So a claim can age out of projection even if its status is still `supported` or `active`.

Important nuance:

(己, p=0.88) The current projection code filters expired claims by `valid_until`, but it does not necessarily mutate their status to `expired` automatically during projection. So expiration can be functional without the status field being rewritten.

### Step 10: Projection turns claims into graph-consumer edges

(己, p=0.97) To get claim-backed relation edges, call:

```http
POST /v1/graph/edge-claims/project
```

Default projection uses:

```text
statuses = supported, active
includeExpired = false
```

It returns edge-shaped records like:

```json
{
  "source": "node:A",
  "target": "node:B",
  "kind": "depends_on",
  "claim_id": "edge_claim:abc...",
  "confidence": 0.82,
  "direction": "directed",
  "scope": {
    "project": "devel"
  },
  "status": "supported"
}
```

This is the critical distinction:

```text
graph_edge_claims record = authoritative claim
projected edge = derived view for graph traversal/rendering/query
```

### Step 11: Consumers should follow claim_id back to evidence

(己, p=0.93) A consumer seeing a projected edge should treat `claim_id` as the provenance pointer.

The projected edge says:

```text
This relation is currently projectable.
```

The claim says:

```text
Why it exists,
what supports it,
what refutes it,
whether it is scoped,
when it is valid,
and how confident it is.
```

### Step 12: Supersede/reject/expire are represented, but not fully endpoint-specialized yet

(己, p=0.92) The statuses exist:

```text
rejected
superseded
expired
```

But the current endpoint surface has explicit convenience routes for:

```text
support
refute
withdraw
project
```

There is not yet a dedicated route like:

```text
POST /edge-claims/:id/reject
POST /edge-claims/:id/supersede
POST /edge-claims/:id/expire
```

However, the create/upsert endpoint accepts status fields, and claims have:

```text
supersedes_claim_ids
valid_until
```

So the data model is ready for those lifecycle states, but the specialized transition API is still thin.

## Countermoves

(己, p=0.96) The cycle should not be:

```text
semantic similarity → graph edge
```

It should be:

```text
semantic similarity / daimoi trail / parser observation
  → evidence event or observation
  → proposed edge claim
  → support/refute lifecycle
  → projection if supported/active
```

(己, p=0.94) A projected edge is not independently authoritative. If it loses support, is refuted, expires, or is withdrawn, it should disappear from projection.

(己, p=0.91) The current implementation is a solid first lifecycle slice, but not a full governance engine yet. Missing/next useful pieces include:

```text
- explicit reject endpoint
- explicit supersede endpoint
- explicit expire endpoint or scheduled expiry job
- confidence scoring policy from support/refute counts
- required evidence rules before support/active
- projection persistence with stale projected-edge cleanup
```

## Next

(己, p=0.88) Add explicit `/reject`, `/supersede`, and `/expire` routes so every status has a clear transition instead of relying on generic upsert/status mutation.
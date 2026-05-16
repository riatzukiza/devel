## Signal

(己, p=0.98) The **edge claim lifecycle** is the path for turning a proposed relation between two nodes into an evidence-tracked, auditable durable relation.

It is meant to separate:

```text
“these two things seem related”
```

from:

```text
“we assert this relation, with evidence, status, support/refutation history, and projection rules”
```

Current lifecycle shape:

```text
proposed / active claim
        │
        ├── support  → add support evidence
        ├── refute   → add refuting evidence
        ├── withdraw → mark claim withdrawn
        ├── expire   → time/status-based invalidation
        └── project  → emit/refresh graph_edges relation if claim is active enough
```

In practical terms, an edge claim is a record like:

```text
source_node_id
target_node_id
edge_kind
claim_text / rationale
status
direction
support_event_ids
refute_event_ids
withdrawn_at
expires_at
created_at
updated_at
```

The claim is the durable object; the rendered/projected edge is downstream.

## Evidence

(己, p=0.96) The implemented route surface from the current OpenPlanner graph work:

```text
POST /v1/graph/edge-claims
GET  /v1/graph/edge-claims
POST /v1/graph/edge-claims/:claim_id/support
POST /v1/graph/edge-claims/:claim_id/refute
POST /v1/graph/edge-claims/:claim_id/withdraw
POST /v1/graph/edge-claims/project
```

(己, p=0.94) The Mongo collection is:

```text
graph_edge_claims
```

(己, p=0.93) Projection target is generally the normal graph edge surface:

```text
graph_edges
```

But only after the claim lifecycle says it is appropriate to project.

## Frames

(世, p=0.95) Think of it as a mini legal/provenance system for graph relations.

A semantic similarity sample says:

```text
A is close to B in embedding space.
```

An edge claim says:

```text
A depends_on B, because event/document/source X supports that relation.
```

A daimoi trail says:

```text
A query-agent traversed from A to B during query Q.
```

An edge claim promotion says:

```text
That observed trail is now evidence for a proposed relation,
but the relation is not truth unless the claim status/rules support it.
```

(世, p=0.91) The lifecycle prevents accidental truth inflation:

```text
observation → candidate → supported claim → projected durable graph edge
```

instead of:

```text
similarity/traversal happened → permanent relation edge
```

(己, p=0.89) Projection is the key separation. Consumers can query convenient `graph_edges`, but the authority remains in `graph_edge_claims`.

## Countermoves

(己, p=0.94) A projected edge should not be treated as self-justifying. It should point back to its claim/evidence.

(己, p=0.92) Refuted/withdrawn/expired claims should either not project or should project as inactive/annotated depending on consumer needs.

(己, p=0.9) Semantic field multipoles, semantic force samples, transient circuits, and daimoi trails should not skip this lifecycle if you want them to become durable relations.

## Next

(己, p=0.88) Inspect the exact current enum/status implementation and summarize the concrete statuses/transitions exactly as coded.
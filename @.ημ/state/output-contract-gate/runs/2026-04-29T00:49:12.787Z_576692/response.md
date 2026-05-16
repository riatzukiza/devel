## Signal

(己, p=0.88) Yes, you’re tracking the architecture correctly now:

- (己, p=0.82) **Proxx mostly has upstream request payloads + streaming/proxy-level events**, not necessarily a clean completed assistant message ledger.
- (己, p=0.86) **Knoxx/OpenPlanner synthesized receipts** often represent completed state assembled from deltas, tool traces, reasoning chunks, and final messages. Those are *derived artifacts* and can reasonably remain in Mongo for now.
- (己, p=0.92) The higher-value target is **document text removal**, because document/source text should be reconstructable from canonical sources (file path, URL/hostname, Git ref, document hash), while OpenPlanner should retain metadata, references, graph structure, and derived receipts.

(己, p=0.9) I would pivot the migration plan:

**Migration 1A: stop redacting synthesized Knoxx receipts for now.**  
Keep `knoxx.message`, `knoxx.reasoning`, completed receipts, and graph synthesis until we have a better reconstruction model.

**Migration 1B: document text redaction.**  
Remove raw document `text` from OpenPlanner Mongo only when we can preserve a durable source reference:
- file path + host/workspace root + optional git commit/hash
- URL + hostname + fetched-at + content hash
- source lake/project + document id
- AST/tree node id if chunked
- original text hash before redaction

## Evidence

(己, p=0.85) The HoneySQL migration dry-run found correlations but classified them as `reference-only`, not `redaction-candidates`, because OpenPlanner often held larger synthesized state than the Proxx message fragment.

(己, p=0.8) Your clarification matches that finding: those synthesized completed messages/receipts are not just duplicates; they are derived completed state from streaming and runtime deltas.

(己, p=0.9) OpenPlanner document event shape already has fields that can support document text redaction:
- `project`
- `kind`
- `source`
- `message`
- `extra.path`
- `extra.url`
- `extra.lake`
- graph node fields like `extra.node_id`, `extra.node_type`, `extra.node_kind`, `extra.parent_node_id`

## Frames

(己, p=0.78) Better invariant: **Mongo may store synthesized state, but should not be the canonical raw-source text store.**  
(世, p=0.68) Documents should be represented as addressable source references + structural graph nodes, not copied raw text blobs.  
(己, p=0.62) Training data export can later rehydrate raw source text from files/URLs/Proxx and join it with Mongo graph/receipt metadata.

## Countermoves

(己, p=0.8) Don’t delete document text unless there is a trustworthy source locator. Events with only text and no path/url/source ref must remain until they’re made reconstructable.  
(己, p=0.72) Don’t remove graph-derived labels/previews blindly; small previews may be useful as navigation metadata and are not the same storage liability as full raw text.  
(己, p=0.7) Don’t use Proxx as the canonical source for documents/files; Proxx is an LLM I/O ledger, not a source document store.

## Next

(己, p=0.86) I’ll rewrite the migration direction so `migration-1` becomes **document text redaction by source-reference proof**, leaving synthesized Knoxx session receipts alone.
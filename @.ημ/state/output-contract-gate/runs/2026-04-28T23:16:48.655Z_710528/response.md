## Signal

(己, p=0.84) Your priorities imply a very specific unification: **OpenPlanner becomes the canonical metadata + graph + receipts lake**, while **Proxx becomes the canonical raw text/LLM I/O ledger** (via `events.payload` keyed by `prompt_cache_key`). Knoxx becomes a stateless orchestrator that talks only to OpenPlanner (no Redis ownership, no document ingestion pipeline).

(己, p=0.86) To execute this without breaking observability or training provenance, you need three things in order:

1) (己, p=0.9) **A join key contract** (already mostly present):  
   - Knoxx/OpenPlanner: `extra.session_id` (and `extra.run_id`, `extra.conversation_id`)  
   - Proxx: `payload.prompt_cache_key` (injected by Knoxx pi extension)  
   These are the same value for Knoxx agent turns: we verified it with a sampled trace.

2) (己, p=0.9) **A migration runner** (OpenPlanner-owned) that can:
   - read OpenPlanner Mongo events/docs
   - read Proxx Postgres events
   - write back “tombstoned text” + references into Mongo
   - record receipts for what was removed and how to reconstruct

3) (己, p=0.85) **A cache layer** (OpenPlanner-owned) for rehydration:
   - Redis LRU for hot fragments
   - LMDB for warm fragments with TTL
   - OpenPlanner API becomes the only cache authority Knoxx uses

### Concrete interpretation of your three migrations

**Migration 1 (agent session text dedup)**
- For each OpenPlanner event where `source="knoxx"` AND it contains agent/session text:
  - If `extra.session_id` exists, treat it as `prompt_cache_key`.
  - Find candidate Proxx SQL `events` rows in Postgres where:
    - `kind='request'`
    - `payload->>'prompt_cache_key' = extra.session_id`
  - If OpenPlanner `text` is found inside any Proxx request’s `payload.messages[*].content` (exact or normalized match), then:
    - delete/tombstone OpenPlanner `text` (set `text=""` or `null`, and optionally `extra.text_redacted=true`)
    - store reconstruction reference in Mongo event:
      - `extra.proxx_prompt_cache_key = <session_id>`
      - `extra.proxx_lookup = { kind: "request", prompt_cache_key: ..., window: <ts±N minutes> }`
      - `extra.content_hash = <hash(text)>` (so we can detect drift/mismatch later without keeping the text)

**Migration 2 (documents/files)**
- For OpenPlanner “document” records, remove raw content but preserve *identity + addressability*:
  - Keep: `extra.path`, `extra.url`, `extra.host`, `extra.lake`, AST/node ids, and structural edges
  - Remove: `text` blobs (and any derived chunk text)
- Anything “synthesized” (summaries/receipts) becomes reconstructable:
  - store references to the constituent event ids and/or proxx prompt_cache_keys
  - store hash manifests so you can prove reconstruction matches original derivation without storing the text

**Migration 3 (caching protocol + move embedding caching)**
- Define a Clojure protocol (or CLJS protocol if it must run in Node) with your methods:
  - `cache-get`, `cache-put!`, `cache-evict!`, `cache-touch!`, `cache-cleanup!`, `cache-stats`
- Implement drivers:
  - Redis driver (LRU behavior via TTL+touch + size accounting)
  - LMDB driver (TTL + periodic cleanup)
- OpenPlanner API becomes the only public surface for:
  - source-text fragment retrieval (rehydration)
  - embedding cache access
  - eviction/TTL policy

(己, p=0.8) “Prefer Clojure” implementation path that fits your constraints:
- Use **Clojure (bb or JVM)** for the migration runner (one-off + repeatable, easy to write robust DB + Mongo scripts).
- Use **shadow-cljs (Node target)** for long-lived runtime code that must run inside Knoxx/OpenPlanner Node deployments (cache drivers, API glue, etc).
- Only rewrite TS where we must touch it to add “reference fields” or API endpoints, then progressively replace.

## Evidence

(己, p=0.9) Correlation key exists and is already producing joinable data:
- Knoxx injects `prompt_cache_key` for Proxx requests via `before_provider_request` extension code in:
  - `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/agent_runtime.cljs`
- Knoxx writes OpenPlanner events with `extra.session_id` in:
  - `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/agents/turn.cljs`
- OpenPlanner `openplanner-event` envelope sets `source="knoxx"` and puts the full event map into `extra`:
  - `.../openplanner_memory.cljs`

(己, p=0.92) Live lake inspection (OpenPlanner Mongo) confirms large `knoxx.*` + graph materialization footprint:
- `db.events.countDocuments({source:'knoxx'})` returned **116,464**
- kind distribution includes heavy `graph.node`/`graph.edge` plus `knoxx.message`, `knoxx.tool_*`, etc.

(己, p=0.9) Live Proxx Postgres inspection confirms `prompt_cache_key` presence and matches Knoxx `extra.session_id` for a sampled run, and that the Proxx request payload includes the system prompt text that Knoxx also stored as `knoxx.message`.

## Frames

(己, p=0.72) This is not “stop logging”, it’s **move raw text to one canonical ledger** and make everything else reference it.  
(世, p=0.66) If you don’t formalize “what is canonical text” vs “what is derived text”, you’ll keep duplicating forever (PI ingester + Knoxx + Proxx will always overlap).  
(己, p=0.62) The hard part is not deleting text; it’s **making reconstruction deterministic** (hashes, manifests, and stable lookup semantics).

## Countermoves

(己, p=0.75) Don’t implement Migration 1 as a destructive “deleteMany” without receipts:
- store a per-record receipt: `{mongo_event_id, old_text_hash, proxx_prompt_cache_key, proxx_entry_id?, match_method, migrated_at}`

(己, p=0.7) Don’t rely on substring matching alone:
- normalize whitespace
- compute hash of candidate text
- optionally store a short “anchor” (first 80 chars hash) for quick verification

(己, p=0.68) Before removing Redis from Knoxx, ensure OpenPlanner exposes:
- “get session text fragments by prompt_cache_key” (rehydrate)
- “get document fragments by path/url + version/hash”
Otherwise Knoxx will lose features.

## Next

(汝, p=0.85) Tell me which repo you want Migration 1 to live in as the runnable artifact: **`orgs/open-hax/openplanner`** (preferred, since it’s the lake owner) or **a new Clojure migration tool repo**—and I will implement the first migration runner skeleton (connect to Mongo + Postgres, dry-run report, then apply).
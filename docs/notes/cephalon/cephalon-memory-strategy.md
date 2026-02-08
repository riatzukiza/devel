## 1) Model strategy that matches your constraints

### Goal

* **2B**: reliable tool calling + **256k** window → best for “wide context with lots of related”
* **4B / 8B**: fallbacks (smaller window) when you need capability boosts

### Practical split

* **“Actor” model** (tool-calling, outward actions): start with **qwen3-vl-2b**, clamp outputs to a strict tool-call schema, and validate.
* **“Summarizer/Compressor” model** (GC + summaries): can also be 2B (because long context is the point), but you can optionally bump to 4B/8B if you see summary quality issues.

**Key idea:** tool-calling reliability comes more from **format + validation + retry/repair** than raw model size.

---

## 2) Token budgets that scale with context length

You want:

* `related` > `recent`
* both can be large
* filter duplicates aggressively

I’d make budgets **percentage-based** with hard caps, so the same code works at 64k/128k/256k.

Example budget policy (tweakable constants):

* `system+developer+session`: **3–8%**
* `persistent`: **5–12%**
* `recent`: **12–22%**
* `related`: **30–55%** (always >= `recent` * 1.5)
* `scratch/working`: remainder (tool results, intermediate notes, safety margin)

### Enforce the invariant

If `related` would overflow:

1. drop lowest-scoring related memories
2. then compress related by replacing groups with their most recent summary
3. then shorten recent (last resort)

---

## 3) Dedupe pipeline (this is your “first real job”)

Do dedupe **before** you mint memories / embeddings, so spam never pollutes the ANN index.

### Layer A: exact duplicates (cheap, high win)

Per channel (or per guild), maintain a rolling cache keyed by:

* `hash(normalize(author_id, content, attachments, embeds))`

Normalization ideas:

* trim whitespace, collapse repeated spaces
* strip bot-generated timestamps / counters if they vary
* canonicalize URLs (optionally remove tracking params)
* for embeds: include title + description + main url only

Behavior:

* if duplicate within TTL/window → **don’t store as new memory**
* instead increment a counter on an **aggregate record**:

  * `duplicate_of: <first_event_id>`
  * `dup_count += 1`
  * `last_seen_at = now`

This keeps “spam volume” measurable without indexing it repeatedly.

### Layer B: near-duplicates (bot spam with tiny diffs)

For messages that aren’t exact dupes:

* compute a **SimHash** (or MinHash) over normalized text
* if Hamming distance < threshold within a short window → treat as same “spam family”
* aggregate as above

### Layer C: semantic duplicates (optional, later)

Once embeddings exist, you can occasionally cluster low-quality bot chatter by embedding similarity. This is good for cleaning up older history.

---

## 4) Tracking memory usage (for your GC rule)

You want “less frequently accessed” → summarize + delete.

So each memory needs:

* `access_count_total`
* `last_accessed_at`
* `access_count_30d` (or a decayed score)
* `included_tokens_total` (optional but useful)

And **every context assembly** writes an “inclusion log”:

* `context_id`
* `memory_ids_included[]`
* `token_cost_per_memory`

This becomes both:

* a feedback signal for GC
* a training/eval signal later (which memories are actually useful)

---

## 5) Garbage collection → summarization → deletion (hot-store compaction)

### Candidate selection

Pick candidates using something like:

* older than `AGE_MIN` (e.g. 14d / 30d)
* `access_score` below threshold (count or decay)
* not pinned / not locked / not referenced by a newer summary
* exclude system-critical or admin-locked memories

Where `access_score` is a time-decayed metric:

[
access_score = \sum_{i=1}^{n} e^{-(now - access_i)/\tau}
]

This prevents “was useful once months ago” from blocking GC forever.

### Chunking (avoid mushy summaries)

Summarize in **coherent clusters**, not arbitrary batches:

* by **thread / reply chain**
* by **time windows** (e.g. 1 day slices)
* or by **topic clustering** (embedding clusters)

### Summary memory format (make it retrieval-friendly)

When you write a summary memory, include:

* `time_range`
* `key_entities` (channels, users/bots, projects)
* `main_events` (bullet list)
* `decisions` / `outcomes`
* `open_loops` (things still unresolved)
* `spam_patterns` (if it’s bot cleanup work)
* `source_ids[]` (the memories being replaced)

Then:

* **index the summary**
* **delete the originals**

### Deletion mechanics (so it’s safe *and* truly gone)

If you really mean delete:

* remove from hot store
* remove from vector index
* delete blobs/attachments if you store them

One thing I’d still keep (even if you “delete the rest”) is a tiny **tombstone** record so you can explain why history disappeared:

* `id`
* `deleted_at`
* `summary_id`
* `content_hash`
* `time_range`

Tombstones don’t have content, don’t embed, don’t retrieve — they just prevent “ghost references” and make debugging sane.

---

## 6) Tool-calling reliability with 2B (what usually works)

To get small models to call tools consistently:

1. **Hard schema** for tool calls (one canonical JSON shape)
2. **Validator** rejects malformed calls
3. **Repair step**:

   * same model: “rewrite to valid tool-call JSON only”
   * or a tiny deterministic fixer for common mistakes
4. **Gating**:

   * if tool call would post to Discord or delete data, require a higher confidence pattern or a second-pass check

Also: force the model to always choose exactly one of:

* “call tool”
* “emit assistant message”
* “emit internal note”
  No mixed-mode ambiguity.

---

## 7) Sessions: unlimited queued, limited concurrency

A clean mental model:

* many sessions can be **ready** with pending events
* a scheduler grants **turn slots** up to concurrency limits
* each session gets its own `recent`
* they share `persistent` + shared memory store + access stats

This is perfect for:

* one session dedicated to “bot spam janitor”
* one dedicated to “conversation”
* one dedicated to “background summarizer/GC coordinator”
  …without forcing a single monolithic prompt to do everything.

---

## 8) Suggested MVP knobs (so you can tune live)

* `RECENT_TOKENS = window * 0.18`
* `RELATED_TOKENS = max(window * 0.40, RECENT_TOKENS * 1.6)`
* `PERSISTENT_TOKENS = window * 0.08`
* `DEDUP_TTL_SECONDS = 3600` (per channel rolling cache)
* `GC_INTERVAL = 6h or 24h`
* `GC_AGE_MIN = 14d`
* `GC_TARGET_BATCH_TOKENS = window * 0.50` (summarize big coherent chunks when you can)


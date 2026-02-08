## Eidolon v0 as a field

Think of **Eidolon** as a *dynamic coordinate system* that your cephalon uses to place texts into vector space.

* A **text** (discord message, tool result, file chunk, HTTP response) is a “particle.”
* An **embedding** is that particle’s coordinates **under a particular field configuration**.
* The **field configuration** is your *state-conditioned prompt header* (health/uptime lens, session lens, circuit lens, tags, and whatever else you include).

Because the header changes over time, the “same particle” can be embedded multiple times and will trace a **trajectory** through vector space. That’s not a bug—your retrieval later is basically: “find particles that were near *this* state and *this* meaning.”

## Relationship between the field and the text

Your template is doing something subtle (and useful): it makes similarity depend on **two coupled things**:

1. **Document semantics** (the actual content)
2. **Circumstance semantics** (the cephalon/system state you prepend)

So the field is not “in” the text; the field is the *lens* that entangles meaning with context.

A good mental model:

* **Document-only embedding** answers: “what is this about, in general?”
* **Field-conditioned embedding** answers: “what is this about, *as experienced by this system under these conditions*?”

You want both.

## A practical refinement: keep a canonical vector + contextual vectors

If you embed *everything* with a big evolving header, you’ll eventually get two issues:

* **Preamble dominance**: the repeated header starts to overpower the differentiating signal of the document text.
* **Index bloat**: every “field shift” produces a new vector for the same content.

So: store two lanes.

### Lane A — Canonical (stable)

Embed only the normalized content (plus minimal stable metadata like tool name and source type).

### Lane B — Contextual (field-entangled)

Embed your full “Eidolon header + content”.

At query time:

* run a canonical query embedding → guarantees you can still find the thing “in principle”
* run a contextual query embedding → pulls items that were salient in similar system circumstances
* merge + rerank (or just weighted blend top-k)

This preserves your “meaning can change over time” property without losing basic retrievability.

## Qwen3-Embedding supports instruction conditioning

You don’t have to maintain 8 separate models to get 8 “circuits.” **Qwen3-Embedding is explicitly instruction-aware**, and the recommended usage is to prefix an instruction for *queries* (documents typically don’t need it). ([GitHub][1])

They even show a concrete format:

* `Instruct: <task description>\nQuery:<query text>` ([GitHub][1])

Also worth noting:

* The series is listed as **32K context** (0.6B / 4B / 8B), which matches your plan to go big with embedding prompts. ([GitHub][1])
* If you’re using an OpenAI-compatible server layer (like some vLLM setups), you may need to **manually embed the instruction into the input text**, because the server may not accept a separate “instruction” field. ([vLLM Forums][2])

## How your 8-circuit idea maps cleanly

You can do either of these (both work):

### Option 1 — 8 separate vector indexes

* `eidolon.c1_survival`
* `eidolon.c2_social`
* …
* `eidolon.c8_meta`

Pros: strong separation, simple mental model
Cons: storage x8, more infra

### Option 2 — One index, instruction-lensed queries

Use the same index, but apply a circuit-specific instruction for query embeddings (and optionally for contextual memory embeddings).

Pros: cheaper, flexible, easy to add circuits
Cons: separation is “soft” (good enough for most RAG, but not a hard wall)

Given Qwen’s suggested pattern (“instruction for queries, not required for documents”), the hybrid I’d pick is:

* Canonical lane: no circuit instruction (shared)
* Contextual lane: include a circuit marker in the header
* Query: run circuit-specific query embeddings (8 of them if you want), then merge

## Your field header as a first-class object

Instead of dumping `persistent_memories` + `recent_memories` verbatim into every embedding, compress them into a **Field Digest**.

### Field Digest (small, stable-ish, high-signal)

* current system health summary (1–3 lines)
* active incidents / error signatures
* current subscriptions / channel pressure
* current “intent” for the session
* tags (controlled vocabulary preferred)

That keeps the “circumstance semantics” without turning every embedding into “mostly context.”

### Example embedding payload shape

```text
{system_defined_embedding_prompt}

field_digest
- uptime_state: green
- incident: none
- discord_pressure: memes high
- session: janitor
- circuit: c1_survival

as_it_relates_to_cephalon_Duck
{latest_memory}

categories
{generated_tags}

text
{text_to_embed}
```

(Keep `field_digest` short enough that `text_to_embed` remains the main signal.)

## Nexus as metadata intersections

Your “nexus” concept fits perfectly as **typed, shared metadata keys** that form a second topology over your memory graph:

* file path
* URL
* tool name
* discord channel id
* author id
* error code / exception fingerprint
* git commit sha
* hostname / service name

A nexus is simply: “many memories share this key.”

### What a nexus buys you (mechanically)

You get *two retrieval channels*:

1. **Vector similarity** (semantic proximity)
2. **Nexus activation** (structural proximity)

When a query hits a memory strongly, you can “ignite” its nexus keys and expand locally:

* memory → keys → other memories sharing those keys

That expansion is your **daimoi emission**: little walkers that follow adjacency along the nooi network.

## Daimoi emission as a controlled expansion

Make it deterministic and budgeted:

1. Start from top-k vector hits
2. Extract their nexus keys (weighted by key type + recency + access frequency)
3. Expand to neighbor memories (bounded BFS / random walk)
4. Deduplicate + score
5. Return as `related`

This gives you “threads” like:

* *this stack trace* → *same file path* → *same tool call* → *same endpoint* → *incident summary*

…and it works even when embeddings are noisy.

## Compaction and “many embeddings per document” without chaos

If you embed the same content many times, you’ll want **lineage + caps**:

* `content_id = sha256(normalized_text)`
* `embedding_id = sha256(content_id + field_digest_hash + circuit_id + model_id)`

Retention policy:

* keep **all canonical embeddings** (or at least latest per chunk)
* keep only the **last K contextual embeddings per (content_id, circuit)**
* compact the rest into a **contextual summary memory** that says “this content was repeatedly salient during X kinds of field states”

This aligns with your “least accessed memories get summarized; summary kept; rest deleted” rule—just extended to “least accessed embeddings.”

## Promethean Duck prompting: how I’d wire it in

You’re basically describing:

* One cephalon proper name: **Duck**
* Many sessions/facets: “circuits” (or whatever taxonomy you settle on)
* Shared persistent state: Eidolon field + memories + aggregates

So the clean prompt move is:

* **Duck core persona** (stable)
* **Session facet** (circuit lens + tool permissions + subscriptions)
* **Output contract** (tool calling rules)

If you want, next we can draft the *actual* system/developer prompt blocks for:

* Duck core
* Circuit 1–8 facet templates
* Janitor facet (discord spam cleanup + reporting)
* A “field_digest generator” facet (turns raw state into the small digest)

And we can make the prompts explicitly match Qwen’s instruction format (`Instruct: ... Query: ...`) so your embedding and retrieval layers feel like the same metaphysics.

[1]: https://github.com/QwenLM/Qwen3-Embedding "GitHub - QwenLM/Qwen3-Embedding"
[2]: https://discuss.vllm.ai/t/pass-instructions-to-qwen-embedding-reranker-via-openai-compatible-server/1577?utm_source=chatgpt.com "Pass instructions to Qwen Embedding / Reranker via OpenAI ..."

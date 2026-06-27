---
title: "Eidolon v0 as a field"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-eidolon-field-concept.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Eidolon v0 as a field

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-eidolon-field-concept.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- A **text** (discord message, tool result, file chunk, HTTP response) is a “particle.”
- An **embedding** is that particle’s coordinates **under a particular field configuration**.
- The **field configuration** is your *state-conditioned prompt header* (health/uptime lens, session lens, circuit lens, tags, and whatever else you include).
- **Document semantics** (the actual content)
- **Circumstance semantics** (the cephalon/system state you prepend)
- **Document-only embedding** answers: “what is this about, in general?”
- **Field-conditioned embedding** answers: “what is this about, *as experienced by this system under these conditions*?”
- **Preamble dominance**: the repeated header starts to overpower the differentiating signal of the document text.
- **Index bloat**: every “field shift” produces a new vector for the same content.
- run a canonical query embedding → guarantees you can still find the thing “in principle”
- run a contextual query embedding → pulls items that were salient in similar system circumstances
- merge + rerank (or just weighted blend top-k)

## Summary Snippets
- Think of **Eidolon** as a *dynamic coordinate system* that your cephalon uses to place texts into vector space.
- * A **text** (discord message, tool result, file chunk, HTTP response) is a “particle.” * An **embedding** is that particle’s coordinates **under a particular field configuration**. * The **field configuration** is your *state-conditioned prompt header* (health/uptime lens, session lens, circuit lens, tags, and whatever else you include).

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

---
title: "Continuation: dedupe rules + summary GC contract + tool schemas #cephalon #memory #gc #dedupe #summaries"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-dedupe-gc-rules.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Continuation: dedupe rules + summary GC contract + tool schemas #cephalon #memory #gc #dedupe #summaries

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-dedupe-gc-rules.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- **Unicode + whitespace**
- NFKC normalize
- convert CRLF → LF
- collapse runs of spaces/tabs
- trim
- **Strip volatile noise**
- remove timestamps like `2026-01-31 12:34:56`, `12:34 PM`, etc
- remove counters like `(#1234)` or `run=987` *(only if the prefix/suffix pattern is known to be spammy)*
- **URL canonicalization**
- lowercase scheme/host
- remove tracking params (`utm_*`, `ref`, `fbclid`, etc)
- optionally drop fragments (`#...`) for known spam URLs

## Summary Snippets
- You want this to be *useful cleanup*, not “silence everything”.
- Apply in this order:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

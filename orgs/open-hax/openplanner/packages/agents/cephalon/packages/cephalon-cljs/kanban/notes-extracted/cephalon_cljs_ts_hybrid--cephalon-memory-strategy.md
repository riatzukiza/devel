---
title: "1) Model strategy that matches your constraints"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-memory-strategy.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-memory-strategy-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.926Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-memory-strategy.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-memory-strategy.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-memory-strategy.md`
# 1) Model strategy that matches your constraints

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-memory-strategy.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- **2B**: reliable tool calling + **256k** window → best for “wide context with lots of related”
- **4B / 8B**: fallbacks (smaller window) when you need capability boosts
- **“Actor” model** (tool-calling, outward actions): start with **qwen3-vl-2b**, clamp outputs to a strict tool-call schema, and validate.
- **“Summarizer/Compressor” model** (GC + summaries): can also be 2B (because long context is the point), but you can optionally bump to 4B/8B if you see summary quality issues.
- `related` > `recent`
- both can be large
- filter duplicates aggressively
- `system+developer+session`: **3–8%**
- `persistent`: **5–12%**
- `recent`: **12–22%**
- `related`: **30–55%** (always >= `recent` * 1.5)
- `scratch/working`: remainder (tool results, intermediate notes, safety margin)

## Summary Snippets
- * **2B**: reliable tool calling + **256k** window → best for “wide context with lots of related” * **4B / 8B**: fallbacks (smaller window) when you need capability boosts
- * **“Actor” model** (tool-calling, outward actions): start with **qwen3-vl-2b**, clamp outputs to a strict tool-call schema, and validate. * **“Summarizer/Compressor” model** (GC + summaries): can also be 2B (because long context is the point), but you can optionally bump to 4B/8B if you see summary quality issues.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

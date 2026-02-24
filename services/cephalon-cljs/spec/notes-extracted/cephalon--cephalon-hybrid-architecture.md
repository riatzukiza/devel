---
title: "What I found in your zips"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-architecture.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# What I found in your zips

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-architecture.md`
- Category: `cephalon`

## Draft Requirements
- `promethean.main` boots a tiny ECS loop (`world.cljs`, `tick.cljs`)
- `context/assembler.cljs` only builds headers (no budgeting / retrieval / dedupe yet)
- No effects runner yet; no session scheduler; no tool loop
- `docs/notes/cephalon/shadow-cljs-game-loop.md`
- `docs/notes/cephalon/cephalon-mvp-spec.md`
- `docs/notes/cephalon/v1-effects-runner.md`
- `docs/notes/cephalon/cephalon-context-assembly.md`
- `docs/notes/cephalon/cephalon-tool-call-validation.md`
- `docs/notes/cephalon/cephalon-storage-schema.md` + `cephalon-memory-strategy.md`
- `src/promethean/llm/parse.clj` has robust “accept the model’s messy formatting” parsing logic
- `src/promethean/llm/loop.clj` is a clean “tool loop” pattern you can port directly to CLJS
- **TS stays alive** as the *IO/tool host* (Discord, Chroma/embeddings, existing tool executor + UI)

## Summary Snippets
- ([Past chat][1])([Past chat][2])([Past chat][3])([Past chat][4])([Past chat][4])([Past chat][5])([Past chat][6])([Past chat][7])([Past chat][2])([Past chat][8])([Past chat][3])([Past chat][4])([Past chat][3])([Past chat][4])([Past chat][3])([Past chat][9])([Past chat][10])([Past chat][11])([Past chat][12])([Past chat][13])
- It’s a **real skeleton**, not the full MVP:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

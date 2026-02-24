---
title: "What you got in this zip"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-tick-routing-fix.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# What you got in this zip

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-tick-routing-fix.md`
- Category: `cephalon`

## Draft Requirements
- `packages/cephalon/vendor/cephalon-ts/`
- `@local/cephalon-ts` (via `file:` dependency)
- `.` → `index.js`
- `./*` → any subpath module (so you can import `config/policy.js`, `llm/ollama.js`, etc.)
- `packages/cephalon/src/promethean/hybrid.cljs`
- builds a **minimal in-memory event bus** (publish/subscribe) compatible with the TS modules’ expectations
- loads policy via TS (`loadDefaultPolicy`)
- wires up TS components:
- `OllamaProvider`, `ToolExecutor`, `TurnProcessor`
- `DiscordIntegration`, `DiscordApiClient`
- `ChromaMemoryStore` + `EmbeddingService`
- `MemoryUIServer`

## Summary Snippets
- ([Past chat][1])([Past chat][2])([Past chat][3])([Past chat][4])([Past chat][5])
- Here’s **Option 1 continued** as a concrete hybrid step: **ClojureScript orchestrates + consumes the working TS Cephalon (vendored)**, so you can keep shipping the TS MVP while progressively porting the “brain” pieces into CLJS.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

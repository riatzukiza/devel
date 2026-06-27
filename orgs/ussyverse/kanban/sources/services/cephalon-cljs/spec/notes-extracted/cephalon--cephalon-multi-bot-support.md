---
title: "Progress update (and what I’m going to change next)"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-multi-bot-support.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Progress update (and what I’m going to change next)

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-multi-bot-support.md`
- Category: `cephalon`

## Draft Requirements
- **multi-bot support** (multiple Discord bots / multiple personas / multiple session configs)
- keep layout under **`packages/`** and **`services/`**
- add **`AGENTS.md`** + “skills” for running the cephalon
- incorporate your **monorepo AGENTS.md** style + **pm2 ecosystem DSL** example
- `src/main.ts` imports files that **don’t exist** in `src/`:
- `./sessions/turn-processor.js` (missing)
- `./sessions/proactive-behavior.js` (missing)
- `./core/in-memory-memory-store.js` (missing)
- `TurnProcessor` + `ToolExecutor` are implemented in `src/llm/ollama.ts`
- `ProactiveBehavior` is implemented in `src/proactive/behavior.ts`
- `MemoryStore` is an interface at `src/core/memory-store.ts`
- Mongo store exists at `src/core/mongodb-memory-store.ts`

## Summary Snippets
- You asked me to **continue** and explicitly improve:
- * **multi-bot support** (multiple Discord bots / multiple personas / multiple session configs) * keep layout under **`packages/`** and **`services/`** * add **`AGENTS.md`** + “skills” for running the cephalon * incorporate your **monorepo AGENTS.md** style + **pm2 ecosystem DSL** example

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

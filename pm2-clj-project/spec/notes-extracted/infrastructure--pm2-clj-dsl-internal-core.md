---
title: "1) The runtime “organism loop”"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-internal-core.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# 1) The runtime “organism loop”

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-internal-core.md`
- Category: `infrastructure`

## Draft Requirements
- **Sensors** (passive modules) produce structured state
- **Router** decides what sensors are on and what gets summarized
- **Actuators** (tools) act on the world
- **LLM is a tool** used by the orchestrator (optionally multiple tiers)
- **Benchmarks test the whole machine**, not just tool calls
- live streaming performer
- coding assistant
- benchmark playback runner
- **enabled?** is controlled by the router (gates)
- **state** stores internal memory (frame history, last output, etc.)
- **tick** reads inputs, updates world
- reads cheap signals

## Summary Snippets
- Alright. Now we stop thinking “agent = LLM + tool loop” and build the *actual organism*:
- * **Sensors** (passive modules) produce structured state * **Router** decides what sensors are on and what gets summarized * **Actuators** (tools) act on the world * **LLM is a tool** used by the orchestrator (optionally multiple tiers) * **Benchmarks test the whole machine**, not just tool calls

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

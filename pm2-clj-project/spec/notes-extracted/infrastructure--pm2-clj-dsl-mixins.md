---
title: "1) Add a universal Action Queue"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-mixins.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# 1) Add a universal Action Queue

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-mixins.md`
- Category: `infrastructure`

## Draft Requirements
- **Novelty Detector** (cheap, always-on) → decides “is it worth reacting / enabling expensive perception / waking an LLM”
- **Performer Loop** (small, safe, fun) → reacts to novelty + fused context, triggers fun tools with cooldowns
- **frame hash** / app identity / quick OCR snippet (cheap)
- optional **embedding similarity** on fused context (better)
- hysteresis + cooldown so it doesn’t spam
- “wake performer”
- “enable vision/ocr”
- “start recording”
- “spawn subagents”
- “call the big model only when needed”
- if novelty fires in `:combat` → enable `:vision/objects` briefly
- if novelty fires in `:coding` → enable `:vision/ocr` briefly

## Summary Snippets
- Cool — now we make it *feel alive* with two organs:
- 1. **Novelty Detector** (cheap, always-on) → decides “is it worth reacting / enabling expensive perception / waking an LLM” 2. **Performer Loop** (small, safe, fun) → reacts to novelty + fused context, triggers fun tools with cooldowns

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

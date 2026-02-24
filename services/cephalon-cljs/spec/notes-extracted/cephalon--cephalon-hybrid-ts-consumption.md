---
title: "✅ Major structural improvement: TS is now “consumable” by CLJS"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-ts-consumption.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# ✅ Major structural improvement: TS is now “consumable” by CLJS

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-ts-consumption.md`
- Category: `cephalon`

## Draft Requirements
- `event.tar.gz` → extracted into `packages/event` as `@promethean-os/event`
- `fsm.tar.gz` → extracted into `packages/fsm` as `@promethean-os/fsm`
- `utils.tar.gz` → extracted into `packages/utils` as `@promethean-os/utils`
- `cephalon_persistent.tar.gz` → used as the base TS cephalon service (it’s already aligned with your newer design + policy hooks)
- `cephalon_cljs.zip` → used as the CLJS base service (shadow-cljs node script ECS loop)
- exports `createCephalonApp()`
- returns `{ start(), stop(), ... }`
- **no `process.exit()`** inside the runtime (safe for embedding)
- only the CLI registers signal handlers + exits
- CLI runs runtime and calls stop on SIGINT/SIGTERM
- exports core classes (`TurnProcessor`, `ToolExecutor`, etc.)
- exports `createCephalonApp`

## Summary Snippets
- * `event.tar.gz` → extracted into `packages/event` as `@promethean-os/event` * `fsm.tar.gz` → extracted into `packages/fsm` as `@promethean-os/fsm` * `utils.tar.gz` → extracted into `packages/utils` as `@promethean-os/utils` * `cephalon_persistent.tar.gz` → used as the base TS cephalon service (it’s already aligned with your newer design + policy hooks) * `cephalon_cljs.zip` → used as the CLJS base service (shadow-cljs node script ECS loop)
- Then I created a **single hybrid workspace** with:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

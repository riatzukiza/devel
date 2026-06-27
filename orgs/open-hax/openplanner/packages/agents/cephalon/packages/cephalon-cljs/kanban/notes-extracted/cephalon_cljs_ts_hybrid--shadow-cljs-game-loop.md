---
title: "Implementation zoom-out: a pure `shadow-cljs` “game loop” for Eidolon/Daimoi/Nexus #promethean #shadowcljs #ecs #eidolon"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/shadow-cljs-game-loop.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-shadow-cljs-game-loop-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.929Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--shadow-cljs-game-loop.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--shadow-cljs-game-loop.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--shadow-cljs-game-loop.md`
# Implementation zoom-out: a pure `shadow-cljs` “game loop” for Eidolon/Daimoi/Nexus #promethean #shadowcljs #ecs #eidolon

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/shadow-cljs-game-loop.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- **World state** (ECS)
- **Event bus** (pub/sub)
- **Systems** (pure-ish transforms + side-effect adapters)
- **Ticks** (scheduler loop)
- **Persistence adapters** (db, vector index, filesystem, discord, llm)
- `:brain` — node script, always-running daemon
- (later) `:hud` — optional humble-ui/laterna TUI/GUI target (separate concern)
- Entity = `eid` (uuid/string)
- Components = maps on that entity
- World = atom `{::entities {eid {::compA {...} ::compB {...}}} ::time ...}`
- sessions
- memories

## Summary Snippets
- You’re basically building a **simulation runtime** that happens to talk to LLMs and tools. So the implementation should look like a game engine:
- * **World state** (ECS) * **Event bus** (pub/sub) * **Systems** (pure-ish transforms + side-effect adapters) * **Ticks** (scheduler loop) * **Persistence adapters** (db, vector index, filesystem, discord, llm)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

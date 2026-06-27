---
title: "What I fixed"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-ts-fixes.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cephalon-ts-fixes-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.951Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-ts-fixes.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-ts-fixes.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon--cephalon-ts-fixes.md`
# What I fixed

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-ts-fixes.md`
- Category: `cephalon`

## Draft Requirements
- `SessionManager` routes `system.tick` to **maintenance** sessions by default.
- Your tick generator in `main.ts` wasn’t setting `sessionId`, so the tick never reliably hit the interactive session.
- **Fix:** tick events now set `sessionId: "conversational"`.
- In `TurnProcessor`, the memory minted for the tool call used a *new* UUID, while the tool result used `toolCall.callId`.
- That breaks “call/result pairing” in memory.
- **Fix:** the minted call now uses `callId: toolCall.callId`.
- The system/dev headers described a tool name you don’t have (`discord.send_message`) and showed a code fence pattern that models often emit in a way your parser wouldn’t reliably catch.
- **Fix:** headers now describe:
- `discord.send`
- `discord.channel.messages`
- `discord.search`
- `memory.lookup`

## Summary Snippets
- I unpacked `cephalon.zip` and fixed a handful of issues that would make the “always-on loop + tools” behavior flaky.
- [Download the patched zip](sandbox:/mnt/data/cephalon_patched.zip)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

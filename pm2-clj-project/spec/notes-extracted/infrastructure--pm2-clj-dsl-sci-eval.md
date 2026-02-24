---
title: "Architecture"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-sci-eval.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Architecture

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-sci-eval.md`
- Category: `infrastructure`

## Draft Requirements
- The **JVM agent** runs the Ollama-driven reasoning + tool-loop.
- Discord becomes an **external tool server** (in CLJS/Node) that the agent calls for:
- send message
- fetch history (channel + DM)
- search (best-effort)
- fetch attachments (and optionally inline images into context)
- Discord-IO **publishes events** (new messages) → JVM ingests.
- JVM **calls Discord tools** (fetch, search, send) → Discord-IO executes side-effects.
- `discord.channel.messages`
- args: `{channel-id limit before after around}`
- mirrors discord.js fetch options where `before/after/around` are mutually exclusive. ([discord.js][1])
- `discord.channel.scroll`

## Summary Snippets
- Yeah — **this is the right way to “use the ollama/tool loop”**:
- * The **JVM agent** runs the Ollama-driven reasoning + tool-loop. * Discord becomes an **external tool server** (in CLJS/Node) that the agent calls for:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

---
title: "What you’re actually building"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-render.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# What you’re actually building

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-render.md`
- Category: `infrastructure`

## Draft Requirements
- Discord connection
- permissions + intents
- rate-limits
- normalization of Discord messages
- optional caching / indexing for search
- **Send**
- `discord.send`
- args: `{:channel-id string :text string :reply-to-message-id? string}`
- returns: `{:message-id string :ts string}`
- **Fetch channel history**
- `discord.channel.messages`
- args: `{:channel-id string :limit int :before? msg-id :after? msg-id :around? msg-id :cache? boolean}`

## Summary Snippets
- Yep — flipping it so **Discord (CLJS/Node) is the WS server** and the **JVM agent system is the WS client** is *perfect* for “Discord is a tool” and keeps your Ollama/tool-loop front and center.
- ```mermaid flowchart LR subgraph IO[discord-io - shadow-cljs node server] GW[discord.js gateway] --> S[ws rpc server] S --> GW end

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

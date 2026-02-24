---
title: "1) Two processes, one protocol"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-compose-helpers.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# 1) Two processes, one protocol

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-compose-helpers.md`
- Category: `infrastructure`

## Draft Requirements
- the **LLM loop to drive behavior**
- Discord tools to be **real tools** (`def-tool`) the agent can call
- history/scroll/search to be tool-driven
- images to be injected into context *as multimodal content*, not just text
- connects to Discord (discord.js)
- exposes a WS RPC surface: “Discord Tools”
- pushes Discord events to any connected brain clients
- maintains agent state, routing, context building
- calls Ollama using **OpenAI-compatible chat-completions** (so tools + images work cleanly)
- executes “Discord tools” by calling the RPC server
- args: `{}`
- returns: `{:guilds [{:guild-id :name}]}`

## Summary Snippets
- Alright—**Discord as a remote tool server** + **JVM as the Ollama/tool-loop client** is the “correct” shape if you want:
- * the **LLM loop to drive behavior** * Discord tools to be **real tools** (`def-tool`) the agent can call * history/scroll/search to be tool-driven * images to be injected into context *as multimodal content*, not just text

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

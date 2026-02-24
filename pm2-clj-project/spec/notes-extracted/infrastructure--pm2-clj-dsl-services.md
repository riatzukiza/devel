---
title: "Architecture"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-services.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Architecture

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-services.md`
- Category: `infrastructure`

## Draft Requirements
- **Duck (CLJS/Node)**: discord.js client, filters messages, sends events to brain, executes “actions” coming back.
- **Brain (CLJ/JVM)**: agent runtime + tools + policies; outputs actions like `:tool/chat-send`.
- Duck → Brain
- Brain → Duck
- Duck joins Discord (text), listens for messages
- For any message containing “duck”, JVM brain replies `QUACK...`
- You now have the “spine” that supports:
- tool-calling loops
- benchmarks
- routing/gating
- multi-agent later
- direct `:tool/chat-send`

## Summary Snippets
- Cool — **text-only Duck tonight** becomes very doable if we treat Discord (CLJS/Node) as an IO adapter that talks to the JVM “brain” over **Transit WebSockets**.
- ```mermaid flowchart LR A[duck - shadow-cljs node] -->|:discord/message| B[brain - jvm clojure ws server] B -->|:tool/chat-send| A A -->|discord send| D[Discord] D -->|message create| A ```

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

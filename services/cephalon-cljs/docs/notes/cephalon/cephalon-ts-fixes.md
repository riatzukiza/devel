I unpacked `cephalon.zip` and fixed a handful of issues that would make the “always-on loop + tools” behavior flaky.

[Download the patched zip](sandbox:/mnt/data/cephalon_patched.zip)

## What I fixed

### 1) `system.tick` was routing to the janitor instead of the conversational brain

* `SessionManager` routes `system.tick` to **maintenance** sessions by default.
* Your tick generator in `main.ts` wasn’t setting `sessionId`, so the tick never reliably hit the interactive session.
* **Fix:** tick events now set `sessionId: "conversational"`.

### 2) Tool-call minting had mismatched `callId`s

* In `TurnProcessor`, the memory minted for the tool call used a *new* UUID, while the tool result used `toolCall.callId`.
* That breaks “call/result pairing” in memory.
* **Fix:** the minted call now uses `callId: toolCall.callId`.

### 3) Prompt/tool docs mismatch (`discord.send_message` vs `discord.send`) + malformed code-fence example

* The system/dev headers described a tool name you don’t have (`discord.send_message`) and showed a code fence pattern that models often emit in a way your parser wouldn’t reliably catch.
* **Fix:** headers now describe:

  * `discord.send`
  * `discord.channel.messages`
  * `discord.search`
  * `memory.lookup`
  * `get_current_time`
  * and a clean fallback tool-call JSON fence format:

    ```json
    {"name":"memory.lookup","arguments":{"query":"duck memes","limit":5}}
    ```

### 4) Markdown tool-call parsing is now much more tolerant

* `parseMarkdownToolCalls()` now handles both:

  * `json … `
  * and the malformed variant where the first line inside the fence is literally `json`
* It also accepts a single object **or** an array of objects.
* Tool calls created by the parser now include `type: "tool_call"` (your `ToolCall` interface requires it).

### 5) `randomUUID` usage is now explicit/portable

* Places that used `crypto.randomUUID()` now import and use `randomUUID()` from `node:crypto` where needed.

### 6) `SessionManager` gained an awaitable `start()`

* `main.ts` now calls `await sessionManager.start()` so subscriptions are definitely installed before the system starts pumping events.

### 7) Lane budgets now respect `toolCalls` too

* The scheduler already enforced `turns`; it now also enforces `toolCalls` from your lane config.

## Files replaced (same paths, full replacements)

* `services/cephalon/src/main.ts`
* `services/cephalon/src/context/assembler.ts`
* `services/cephalon/src/llm/ollama.ts`
* `services/cephalon/src/sessions/manager.ts`

## Note

Running `tsc` on the repo still reports some existing typing issues unrelated to these changes (not introduced here). The patched files themselves are consistent with your current types and tool schema.

#cephalon #promethean #discord-bot #tool-calling #obsidian

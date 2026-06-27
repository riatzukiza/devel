Mostly yes — **your request shape for tools matches Ollama’s `/api/chat` tool-calling API**, but a couple details are off, and you’re missing the *most important* step: **send tool results back to the model and loop until it stops calling tools**.

## ✅ What you’re doing right

### Sending tools

This part matches Ollama’s documented format: `tools: [{ type: "function", function: { name, description, parameters } }]`. ([Ollama Docs][1])

Your payload:

```ts
tools: tools.map(t => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.parameters }
}))
```

…is exactly the documented structure. ([Ollama Docs][1])

### Expecting `message.tool_calls`

Ollama’s chat response includes `message.tool_calls` when the model decides to call tools. ([Ollama Docs][2])

---

## ❗What’s not quite right (and how to fix it)

### 1) `arguments` is usually an **object**, not a JSON string

In Ollama’s docs/examples, `call.function.arguments` is an object like `{ city: "New York" }`. ([Ollama Docs][1])

So your type:

```ts
tool_calls?: Array<{ function: { name: string; arguments: string } }>;
```

…should be closer to:

```ts
tool_calls?: Array<{
  type?: 'function';
  function: { name: string; arguments: Record<string, unknown>; index?: number };
}>;
```

You *can* keep your “string-or-object” parsing for robustness, but the “native” case is object-first. ([Ollama Docs][1])

---

### 2) You’re not doing the required “tool result follow-up” call

Right now you:

1. call the model
2. execute tools
3. stop

But tool calling only works when you:

1. call the model → it returns `tool_calls`
2. execute tools
3. append **role: "tool"** messages with results
4. call the model again to get the final response
5. repeat until no more `tool_calls`

This is shown in Ollama’s examples (both single-shot and agent loop). ([Ollama Docs][1])

In other words: **tool calling is a loop**, not a one-and-done.

---

### 3) You should include the assistant message (with `tool_calls`) in the conversation before tool results

Ollama’s examples show the conversation history including the assistant turn that contains `tool_calls`, *then* the tool messages. ([Ollama Docs][1])

Your `completeWithTools` currently returns parsed tool calls but discards the assistant message object. That means your subsequent history (if you later add a follow-up) will be missing the tool-call turn.

**Fix:** return the full assistant message (content + tool_calls + thinking if present), and have the turn processor push it into the message list before adding tool results.

---

### 4) Your TurnProcessor never produces an “assistant final reply” after tools

Even if you implement the follow-up call, you also want to:

* run *all* tool calls (parallel calls supported) ([Ollama Docs][1])
* append tool outputs
* call model again and publish/send final content

---

## A clean way to structure this

### Recommended provider return type

Instead of returning `{ content?: string; toolCalls?: ToolCall[] }`, return the assistant message in Ollama shape:

```ts
type OllamaAssistantMessage = {
  role: 'assistant';
  content?: string;
  thinking?: string;
  tool_calls?: Array<{
    type?: 'function';
    function: { name: string; arguments: Record<string, unknown>; index?: number };
  }>;
};
```

Then `completeWithTools()` returns `{ message: OllamaAssistantMessage }`.

This keeps you aligned with the API schema. ([Ollama Docs][2])

---

### Minimal agent-loop logic (what you’re missing)

This matches the documented “agent loop” pattern: keep calling until tool_calls is empty. ([Ollama Docs][1])

```ts
async function runToolLoop({ model, tools, messages }) {
  while (true) {
    const resp = await fetch(`${baseUrl}/api/chat`, { /* ... */ });
    const data = await resp.json();

    // 1) push assistant message (includes tool_calls)
    messages.push(data.message);

    const toolCalls = data.message?.tool_calls ?? [];
    if (!toolCalls.length) break;

    // 2) execute all tool calls
    for (const call of toolCalls) {
      const name = call.function.name;
      const args = call.function.arguments ?? {};
      const toolResult = await executor.execute({ name, args, callId: crypto.randomUUID() });

      // 3) push tool result message
      messages.push({
        role: 'tool',
        tool_name: name,
        content: toolResult.success
          ? JSON.stringify(toolResult.result ?? null)
          : `ERROR: ${toolResult.error ?? 'unknown error'}`
      });
    }
  }

  // last assistant message in messages is your final answer
  return messages[messages.length - 1]?.content ?? '';
}
```

Key details that match Ollama examples:

* tool results are added as `{ role: "tool", tool_name, content }` ([Ollama Docs][1])
* you may process multiple tool calls before the follow-up request ([Ollama Docs][1])
* loop continues until no tool calls ([Ollama Docs][1])

---

## Smaller correctness issues worth fixing

* **Your tool-call minting uses the wrong callId**:
  You call `mintFromToolCall(... callId: crypto.randomUUID() ...)` instead of using `toolCall.callId`. That breaks traceability.

* **You discard assistant content when tool_calls exist**:
  Some models include partial content alongside tool calls. Consider returning both.

* **`discord.search` schema is under-specified**:
  You have conditional requirements (“if scope is channel, require channel_id”), but your schema can’t express that without `oneOf`. And Ollama has had schema-stripping edge cases for complex schemas. ([GitHub][3])
  Practical fix: split into two tools:

  * `discord.channel.search` (requires channel_id)
  * `discord.dm.search` (requires user_id)

---

## Bottom line

* ✅ **Yes, your `tools` request format is the right way for Ollama `/api/chat`.** ([Ollama Docs][1])
* ❗**But tool calling won’t fully work until you implement the follow-up loop**: append assistant `tool_calls`, execute, append `role:"tool"` messages, call again until done. ([Ollama Docs][1])
* 🔧 Tighten your types: treat `arguments` as an object (string only as fallback). ([Ollama Docs][2])

If you want, paste the *rest* of your `assembleContext()` message format (what fields you include beyond `role/content`), and I’ll show the smallest refactor that gets you a correct agent-loop without rewriting your architecture.

[1]: https://docs.ollama.com/capabilities/tool-calling "Tool calling - Ollama"
[2]: https://docs.ollama.com/api/chat "Generate a chat message - Ollama"
[3]: https://github.com/ollama/ollama/issues/11444?utm_source=chatgpt.com "Tool Function Parameters Schema Fields Are Being Stripped"

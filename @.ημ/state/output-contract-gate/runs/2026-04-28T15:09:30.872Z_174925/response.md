## Signal
(己, p=0.82) The remaining “`TheThe`” in the *reasoning* stream is very plausibly coming from **Proxx’s ollama-cloud streaming adapter**, not (only) from `knoxx.backend.agents.stream`.

(己, p=0.9) In `~/devel/orgs/open-hax/proxx`, the ollama-cloud streaming path is:

- `src/lib/provider-strategy/strategies/ollama-cloud.ts` (streams `/api/chat`)
- → `streamOllamaNdjsonToChatCompletionSse` in `src/lib/ollama-compat.ts`
- → `ollamaStreamDeltaPayload` sets:
  - `delta["content"] = content`
  - `delta["reasoning_content"] = reasoning`

(己, p=0.84) **If ollama-cloud’s NDJSON “message.content” / “message.thinking” are cumulative (message-so-far)** (which is common), Proxx is currently emitting those cumulative strings as if they were OpenAI-style *incremental* `delta` fields. Downstream layers then either:
- append them (→ repeated segments), or
- do their own diffing heuristics (→ often “first token doubled”, because the first chunk gets handled twice via two different codepaths/events).

(己, p=0.75) The right systemic fix is: **make Proxx emit truly incremental deltas for ollama NDJSON streams** by tracking `lastContent` and `lastReasoning` inside `streamOllamaNdjsonToChatCompletionSse` and only emitting the appended suffix per chunk.

## Evidence
(己, p=0.9) Proxx code today (file: `proxx/src/lib/ollama-compat.ts`) does:
- `const content = asString(message?.["content"]) ?? ""`
- `const reasoning = asString(message?.["thinking"]) ?? ...`
- then directly sticks those into a `chat.completion.chunk` `delta` object.

That’s correct **only if** Ollama’s NDJSON values are already incremental tokens. Many implementations are not; they’re cumulative.

(己, p=0.65) Your example “`TheThe user wants...`” being *in reasoning* strongly implicates the `message.thinking` → `reasoning_content` path.

## Frames
(世, p=0.7) Upstream (ollama-cloud gemma4) is emitting cumulative “thinking” snapshots; Proxx is labeling them as incremental deltas.
(己, p=0.6) Dual-path duplication: a “delta event” and a “snapshot/partial message” both hit the client/agent layer early, producing a doubled prefix (often the first token).
(世, p=0.45) Model artifact: gemma sometimes genuinely produces doubled tokens at the start (possible, but the “happening less” report suggests pipeline, not model).

## Countermoves
(己, p=0.8) Confirm whether ollama-cloud NDJSON is cumulative by capturing 3 consecutive lines from the upstream `/api/chat` stream (locally) and checking if `message.thinking` grows monotonically. If yes, Proxx must diff.
(己, p=0.7) Even if Knoxx backend now defends against cumulative deltas, fixing Proxx is still valuable because it protects *every* downstream consumer (pi-coding-agent, browsers, other clients).
(己, p=0.7) Don’t paste secrets into logs/commits. Use env vars for your Ollama token / Proxx auth token when reproducing.

## Next
(己, p=0.82) Patch `~/devel/orgs/open-hax/proxx/src/lib/ollama-compat.ts` so `streamOllamaNdjsonToChatCompletionSse` tracks `lastContent` + `lastReasoning` and emits only the appended suffix (incremental) in `delta["content"]` / `delta["reasoning_content"]`.
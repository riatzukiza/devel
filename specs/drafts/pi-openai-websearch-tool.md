# Draft Spec: pi tool `websearch` via OpenAI Responses API (Codex endpoints)

## Goal
Add a `websearch` tool to **pi** (the pi-coding-agent runtime) that performs web search via the **OpenAI Responses API built-in `web_search` tool**, i.e. the same `/v1/responses` endpoint family used by Codex CLI.

## Non-goals
- Adding Exa-based search to pi.
- Building a full browser automation tool.

## Requirements
- Tool is callable by the LLM as `websearch`.
- Uses `POST /v1/responses` with `tools: [{ type: "web_search", ... }]` and `tool_choice: { type: "web_search" }`.
- Uses `OPENAI_API_KEY` (and optional override `OPENAI_BASE_URL` / `OPENAI_RESPONSES_URL`).
- Returns a concise markdown list of results + sources.
- Truncates output to avoid context bloat.

## Implementation plan
### Phase 1
- Create extension: `~/.pi/agent/extensions/openai-websearch.ts`.
- Register tool `websearch` with params:
  - `query` (string)
  - `numResults?` (number)
  - `searchContextSize?` (low|medium|high)
  - `model?` (string)
  - `allowedDomains?` (string[])

### Phase 2
- Parsing:
  - Prefer `response.output_text` if present.
  - Otherwise extract from `response.output[].content[].text` for `output_text` items.
  - Optionally extract `sources` from a `web_search_call` item (if present via include).

### Phase 3
- Document usage:
  - Set env: `OPENAI_API_KEY=...`
  - `/reload` in pi
  - Prompt: "use websearch to find ..."

## Definition of done
- pi loads the extension and lists `websearch` in available tools.
- A manual invocation of `websearch` returns results.

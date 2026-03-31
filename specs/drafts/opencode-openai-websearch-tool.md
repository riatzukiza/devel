# Draft Spec: OpenAI-powered websearch tool for OpenCode

## Goal
Add a `websearch` capability in `orgs/anomalyco/opencode/packages/opencode` that is powered by the same OpenAI **Responses API** endpoints used by `orgs/openai/codex` (Codex CLI), instead of requiring Exa.

Concretely:
- When the active model provider is **openai** (and optionally Azure OpenAI), `websearch` should use OpenAI Responses API built-in `web_search` tool.
- Keep the existing Exa-backed behavior for the `opencode` provider / `OPENCODE_ENABLE_EXA`.
- Ensure `websearch` is available in tool registry for the OpenAI provider (currently it is filtered out).

## Non-goals
- Implementing a general-purpose local code search (already covered by `grep` / `codesearch`).
- Removing Exa integration.
- Adding a new permission action name (prefer reusing existing `websearch` permission).

## Constraints / Requirements
- Must not require Exa keys/endpoint to use web search when provider is OpenAI.
- Must keep repo build/test green.
- No network calls in unit tests.

## Open questions
- Should Azure OpenAI be enabled as well (same `web_search` tool availability varies)?
- Should we pick a dedicated “small” model for the internal websearch call, or reuse the session model?

## Implementation plan
### Phase 1: Tool backend selection
- Update `packages/opencode/src/tool/websearch.ts` to support:
  - **OpenAI backend**: perform a minimal `streamText()` call using the session model and include the provider-defined `web_search` tool.
  - **Exa backend**: keep existing MCP call to `mcp.exa.ai`.
- Update `packages/opencode/src/tool/websearch.txt` to be backend-agnostic.

### Phase 2: Expose tool for OpenAI provider
- Update `packages/opencode/src/tool/registry.ts` filtering rules so `websearch` is enabled for `providerID === "openai"` (and optionally `providerID` containing `"azure"`).

### Phase 3: Tests
- Add a unit test in `packages/opencode/test/tool/` asserting that `ToolRegistry.tools({ providerID: "openai", ... })` includes `websearch`.

## Affected files
- `orgs/anomalyco/opencode/packages/opencode/src/tool/websearch.ts`
- `orgs/anomalyco/opencode/packages/opencode/src/tool/websearch.txt`
- `orgs/anomalyco/opencode/packages/opencode/src/tool/registry.ts`
- `orgs/anomalyco/opencode/packages/opencode/test/tool/*.test.ts`

## Definition of done
- `websearch` works under OpenAI provider without Exa enabled (manual test).
- `bun test` in `orgs/anomalyco/opencode/packages/opencode` passes.

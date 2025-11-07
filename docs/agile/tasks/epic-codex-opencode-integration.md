# Epic: Codex ↔ Opencode Bridge

## Vision
Keep the current OAuth bridge stable while building a first-class integration between the Codex CLI/SDK and Opencode’s plugin ecosystem. Long term, Codex should expose an official tool/plugin API so Opencode can act as a Codex plugin instead of relying on undocumented HTTP behavior.

## Goals
1. **Short-term safety:** Detect when prompt caching silently drops and warn users immediately (done).
2. **Parallel track:** Ship an SDK-backed plugin so Codex sessions are owned locally even before a CLI plugin API exists.
3. **Upstream contribution:** Design and propose a plugin/tool-definition API for the Codex CLI (Rust core) so external hosts can register tools, receive tool-call callbacks, and reuse Codex’s TUI without hacks.
4. **Downstream adoption:** Once the Codex API lands, build an Opencode plugin that speaks the new interface, letting users mix Codex’s UI/runtime with Opencode’s tool graph, model catalog, MCP servers, etc.

## Tasks
- [x] Warn users when caching is disabled because the host omitted conversation IDs (`opencode-openai-codex-auth`).
- [x] Scaffold `@promethean-os/opencode-openai-codex-sdk` with the native SDK wired up (currently returns 501 until streaming is implemented).
- [ ] Implement the HTTP↔SDK bridge so `/v1/responses` payloads become SDK `sendUserTurn` submissions and stream Codex events back to OpenCode.
- [ ] Draft the Codex CLI plugin/tool API design (Rust interfaces, serialization, tool lifecycle) and circulate for feedback.
- [ ] Prototype the CLI plugin API in a fork of `openai/codex`, then upstream via PR.
- [ ] Build an Opencode plugin targeting the new Codex API (no OAuth, no reverse-engineering) so Codex can use Opencode’s tools/models.
- [ ] Document migration guidance comparing the OAuth plugin, SDK bridge, and future CLI plugin route.

## Notes
- We can run both the OAuth plugin and SDK bridge in parallel so users aren’t blocked while the upstream work happens.
- When the Codex API is ready, we should remove the long-term dependency on undocumented ChatGPT responses endpoints entirely.
- The Codex tool/plugin API should mimic the Opencode plugin API wherever possible. For capabilities Codex can’t express, extend the Opencode API so the Codex plugin SDK becomes a subset of the Opencode plugin SDK, enabling polymorphic plugins across both runtimes.

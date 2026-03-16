# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/agent.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/2026-01-27-duck-context-protocol.md` (lines 9-13): Duck agent registration, tool list, message handling (single-turn call to `agents/run!`).
- `spec/2026-01-29-cephalon-mcp-subcommands.md` (lines 14-18): Uses shared toolset for MCP config/tools output.
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 7-27): Agent wiring + prompt policy; prompt path; tools declared as string names and executed via `promethean.ollama.agents/run!` when loop is enabled.

## Observed behavior (from specs)
- Registers the Duck agent and loads a prompt.
- Prompt path is hardwired to `promethean/experimental/cephalon/defaultPrompt.txt`.
- Tool names are declared as strings and executed through the shared tool loop (`promethean.ollama.agents/run!`).
- Intended to consume a shared tool list (toolset) for MCP subcommands.

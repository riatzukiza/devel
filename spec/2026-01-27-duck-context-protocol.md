# Duck Context Protocol + Expanded Tooling (Spec)

## Summary

Implement a Duck Context protocol with explicit pruning rules, memory tiers, and tool-call governance, plus expand the tool surface (system health, Discord social controls, memory, web). The runtime should support an on/off agent loop, where "on" enables tool-call iteration and context pruning, and "off" returns single-turn responses with minimal tooling.

## Current State (Relevant Files)

- `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/agent.clj#L6-L78`
  - Duck agent registration, tool list, and message handling (single-turn call to `agents/run!`).
- `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/context.clj#L4-L27`
  - Current context builder: concatenates history into a single user message.
- `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/remote.clj#L5-L20`
  - `def-remote-tool` macro (Discord tool call RPC wrapper).
- `orgs/octave-commons/promethean-agent-system/src/promethean/ollama/agents.clj#L88-L176`
  - Tool-call loop for OpenAI/Ollama-style tool calls (`run!`).
- `orgs/octave-commons/promethean-agent-system/src/promethean/llm/loop.clj#L15-L31`
  - Alternative tool loop using parse-based tool calls.
- `orgs/octave-commons/promethean-agent-system/src/promethean/ollama/bench_tools.clj#L27-L370`
  - Tool registry, schema, validation, and invocation.
- `orgs/octave-commons/promethean/docs/labeled/context-management-specification.md`
  - Existing context management strategy (dual-store recency + semantic retrieval).

## External References

- OpenAI function calling: https://platform.openai.com/docs/guides/function-calling
- OpenAI conversation state: https://platform.openai.com/docs/guides/conversation-state
- Ollama tool calling: https://docs.ollama.com/capabilities/tool-calling
- Anthropic context management: https://anthropic.com/news/context-management
- Discord API message cursor fields: https://discord.com/developers/docs/resources/channel#get-channel-messages

## Requirements

### 1) Duck Context Protocol

- **Prune tool calls** when context exceeds limit:
  - Keep the most recent tool calls and any tool results referenced in assistant messages.
  - Drop stale tool results first; keep user/assistant dialogue continuity.
- **Context tiering**:
  - Active memory: always in context, manually managed.
  - Facts memory: searchable list with metadata and TTL.
  - Situational context: ephemeral, derived per channel/user.
- **Context compilation**:
  - Recency + semantic retrieval (aligned with `context-management-specification.md`).
  - Deduplicate by message id or normalized text hash.
- **Agent loop policy**:
  - "On" = tool-call loop until `max-steps` or no tools.
  - "Off" = single-turn answer, no tool calls.

### 2) Tool Expansion

Implement or model these tools in the Promethean tool registry and ensure schemas are OpenAI/Ollama compatible:

#### System Health
- `system.health.stats.gpu`
- `system.health.stats.cpu`
- `system.health.stats.ram`
- `system.health.stats.storage`
- `system.health.score`
- `system.ollama.ps`
- `system.ollama.ls`
- `system.ollama.select-default-model(model-id)`

#### Social / Discord
- `social.discord.open-user-profile`
- `social.discord.open-server-list`
- `social.discord.close-server-list`
- `social.discord.open-channel-list(server)`
- `social.discord.get-messages(server, channel, cursor, count)`
- `social.discord.scroll(server, channel)`
- `social.discord.scroll-to-present()`
- `social.discord.send-message(server, channel, content, attachments)`
- `social.discord.react-to-message(server, channel, message-id, emoji-reaction)`

#### Social Graph
- `social.graph.add-profile(discord-name, impression)`
- `social.graph.add-relationship(user1, user2)`
- `social.graph.add-observation(users, observation)`

#### Web
- `web.search`
- `web.fetch`
- `web.add-book-mark`
- `web.remove-book-mark`

#### Memory
- `memory.facts.add(text, meta)`
- `memory.facts.remove(index)`
- `memory.facts.search(query, filters)`
- `memory.active.add(text)`
- `memory.active.remove(text)`

### 3) Operational Toggle

- Add a runtime flag that can be switched on/off:
  - `agent.loop.enabled` (default: on)
  - When off: no tool calls, no context pruning, no memory writes.

## Proposed Files (Initial Targets)

- `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/context.clj`
  - Add pruning policy and memory tiers.
- `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/agent.clj`
  - Add loop toggle and context compilation integration.
- `orgs/octave-commons/promethean-agent-system/src/promethean/ollama/agents.clj`
  - Hook loop policy (on/off), track tool calls for pruning.
- `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/tools/*.clj`
  - Add new tool definitions.
- `orgs/octave-commons/cephalon-clj/cephalon-clj-discord-io/src/cephalon/discord_io/tools.cljs`
  - Add the social.discord tool implementations.
- `orgs/octave-commons/cephalon-clj/cephalon-clj-discord-io/src/cephalon/discord_io/rpc.cljs`
  - Register new RPC methods (tool endpoints).

## Definition of Done

- Duck can run in loop mode (tool calling) or single-turn mode (no tool calls).
- Context pruning removes stale tool calls and keeps conversational continuity.
- Memory tiers exist and are queryable via tools.
- New system + social + web + memory tools are registered with schemas.
- Discord tool implementations support cursor-based message retrieval.
- Tests cover context pruning and tool-call lifecycle.

## Existing Issues / PRs

- Issues (repo default):
  - #2 Track Giga orchestration roll-out and submodule pointer cleanup
- PRs (repo default):
  - #8 Add Windows Defender workflow
  - #6 Add OWASP dependency-check workflow

## Notes

- The current `agents/run!` loop is per-message, not a persistent session loop. A persistent loop would live at the message handler level (e.g., per channel session manager) rather than inside `run!`.
- Ollama tool calling expects JSON schema tools and plain string content in messages (`/api/chat`), so context assembly must stay compatible with that shape.

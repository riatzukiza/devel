---
uuid: 8586c68e-308e-46ad-b75d-83256dd1f218
title: "Promethean Discord IO Bridge → agent-system consolidation"
slug: promethean-discord-io-bridge-agent-consolidation
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.409448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Promethean Discord IO Bridge → agent-system consolidation

## Scope
Target repo: `orgs/octave-commons/cephalon-clj`

## Current agent-related structure (code references)
- Agent wiring + prompt policy: `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/agent.clj` (lines 1-149)
- Tool loop tick runner: `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/loop.clj` (lines 1-47)
- Remote tool macro: `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/remote.clj` (lines 1-21)
- Discord tools list: `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/tools/discord.clj` (lines 1-66)
- System + memory + social + web tools: `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/tools/{system,memory,social_discord,social_graph,web}.clj`
- Context assembly: `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/context.clj` (lines 1-36)
- Wire protocol + RPC specs: `orgs/octave-commons/cephalon-clj/cephalon-clj-shared/src/cephalon/proto/wire.cljc` (lines 1-31) and `orgs/octave-commons/cephalon-clj/cephalon-clj-shared/src/cephalon/transport/transit.cljc` (lines 1-16)
- Architecture notes: `orgs/octave-commons/cephalon-clj/spec/architecture.md` (lines 5-30)

## Goal
Consolidate agent runtime, tool DSL, and tool-loop logic into `promethean-agent-system`, leaving Discord IO Bridge as a thin adapter that defines Discord tools and wires RPC transport.

## Current Duck implementation notes
- Duck agent registration and prompt loading live in `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/agent.clj`.
  - Prompt file path is hardwired to `promethean/experimental/cephalon/defaultPrompt.txt`.
  - Duck tools are declared as string names and run through `promethean.ollama.agents/run!` when loop is enabled.
- The autonomous loop tick is in `orgs/octave-commons/cephalon-clj/cephalon-clj-brain/src/cephalon/brain/loop.clj` and calls `agents/run!` with a synthetic “Autonomous loop tick” user message.
- Tool registration currently uses the shared registry in `promethean.ollama.bench-tools` (not a local DSL):
- `cephalon-clj-brain/src/cephalon/brain/remote.clj` wraps RPC calls with `def-tool` from the bench-tools DSL.
- `cephalon-clj-brain/src/cephalon/brain/tools/*` register system/memory/social/web tools via `register-tool!`.
  - Discord tools are remote tools and include `:bench/cases` entries.
- Context assembly is a single “user” message with history concatenated; no pruning beyond count-based trimming.

## Agent-system references to reuse
- Tool loop + agent registry: `orgs/octave-commons/promethean-agent-system/src/promethean/ollama/agents.clj`.
  - Includes `run!` loop with tool call execution, per-step history, and `prune-messages` that preferentially drops tool messages when over max.
- Tool DSL + registry: `orgs/octave-commons/promethean-agent-system/src/promethean/ollama/bench_tools.clj`.
  - Provides `def-tool` directive DSL plus map-form definition, schema/spec validation, benchcase templates, and OpenAI/Ollama schema conversion.
- Alternate tool-loop (parse-based): `orgs/octave-commons/promethean-agent-system/src/promethean/llm/loop.clj`.
- Agent DSL draft (S-expr config): `orgs/octave-commons/promethean/docs/notes/promethean-agent-config-dsl.md`.

## Gaps / drift from the spec text
- `brain/src/brain/tool_loop.clj`, `brain/src/promethean/tool.clj`, and `brain/src/brain/ollama_openai.clj` are not present in the repo; current code uses `brain/loop.clj` and `promethean.ollama.client` instead.
- The existing tool loop is per-message, not a persistent session manager; `brain/loop.clj` is a timer-driven “autonomous loop tick” only.
- Tool schema + bench DSL is already shared via `promethean.ollama.bench-tools`, so consolidation should focus on removing the remaining bridge-specific wiring rather than replacing a local DSL.

## Requirements
1. Replace the local `promethean.tool/def-tool` DSL with the shared DSL from `promethean-agent-system` (bench-tools or successor), so all tools and benchmark cases use a single spec surface.
2. Move the tool-loop implementation from `brain/tool_loop.clj` into `promethean-agent-system` (agent runtime / tool loop), and call it from the Discord bridge.
3. Replace `brain/ollama_openai.clj` with the shared Ollama client in `promethean-agent-system`.
4. Keep the Discord bridge’s RPC transport (`shared/` + `discord-io/`) as an adapter layer, but represent tools in the shared DSL so they can be benchmarked and validated.
5. Add benchmark suites in the agent system for Discord tool choice and context selection (per `spec/todos.md` lines 26-29).

## Proposed consolidation steps
1. **Dependency wiring**
   - Add `octave-commons/promethean-agent-system` as a git dep in `brain/deps.edn` and `shared/deps.edn`.
2. **Tool DSL unification**
   - Replace `promethean.tool` with `promethean.ollama.bench-tools` (or new unified `promethean.tools.dsl`).
   - Update `brain/remote.clj` to emit tool maps in the shared DSL (name/parameters/bench cases), and return OpenAI schemas via shared helpers.
3. **Tool loop migration**
   - Move the tool loop in `brain/tool_loop.clj` into `promethean-agent-system` and expose it as `promethean.ollama.agents/run!` (or equivalent).
4. **Ollama client reuse**
   - Use `promethean.ollama.client/chat!` from agent-system in `brain/` to keep a single HTTP adapter.
5. **Bench suite integration**
   - Define benchmark scenarios for Discord tools using the shared DSL (tool + benchcase + scenario DSL).

## Related specs + docs to fold into this plan
- Duck context + tool governance: `spec/2026-01-27-duck-context-protocol.md` (context pruning, loop toggle, expanded tool list).
- Shared DSL examples: `spec/agent-dsl-real-world-examples.md` (benchcase + scenario templates for Discord tools).
- Lineara event/trace alignment: `spec/lineara-conversation-export-agent-consolidation.md` (capability policy + event log compatibility).
- Promethean agent DSL draft: `orgs/octave-commons/promethean/docs/notes/promethean-agent-config-dsl.md` (agent config surface + example Duck agent).
- Discord IO bridge architecture: `orgs/octave-commons/cephalon-clj/spec/architecture.md` (two-process layout + RPC envelope).

## DSL examples (real-world Discord scenarios)
### Tool definition + benchcase (shared DSL)
```clojure
(def-tool discord_send
  (doc "Send a message to a Discord channel")
  (domain :discord)
  (tags :discord :messaging)
  (params
    [channel_id :string "Discord channel id"]
    [text :string "Message body"])
  (impl [{:keys [channel_id text]}]
    (discord-rpc/send! {:channel-id channel_id :text text}))
  (bench
    (benchcase "discord/send/reply"
      (prompt "Reply in #general: 'hello from promethean'")
      (args {:channel_id "123" :text "hello from promethean"})
      (policy :best))))
```

### Scenario DSL: fetch context before responding
```clojure
(def-scenario discord-context-first
  (step :fetch-history
    :expect (expect :calls :tool "discord.channel.messages" :args {:channel_id "123" :limit 20}))
  (step :respond
    :expect (expect :calls :tool "discord.send" :args {:channel_id "123" :text "..."})))
```

## Definition of done
- Discord IO Bridge uses shared DSL + tool loop from `promethean-agent-system`.
- Discord tool definitions are valid under the shared DSL and include benchmark cases.
- Local duplicated DSL/runtime code is removed or clearly marked as legacy adapter only.
- A benchmark suite exists in the agent system covering Discord tool choice + context selection.

# Lineara conversation export → agent-system consolidation

## Scope
Target repo: `orgs/octave-commons/lineara_conversation_export`

## Current agent-related structure (docs references)
- Deterministic event log contract: `orgs/octave-commons/lineara_conversation_export/docs/events-and-replay.md` (lines 5-49)
- Run lifecycle + sandbox envelope: `orgs/octave-commons/lineara_conversation_export/docs/run-lifecycle-and-sandbox.md` (lines 5-53)
- Review gates + capability policy: `orgs/octave-commons/lineara_conversation_export/docs/review-gates-and-policy.md` (lines 5-43)
- Canonical truth + capability determinism boundary: `orgs/octave-commons/lineara_conversation_export/docs/lineara-contract.md` (lines 5-46)

## Goal
Fold Lineara’s deterministic run/trace model into `promethean-agent-system` as the canonical agent event/trace format and capability policy contract.

## Requirements
1. Align `promethean-agent-system` event emission with `events.ednlog` format from Lineara (append-only EDN log, explicit call/return events).
2. Represent capability policy as a first-class artifact in agent system config, using the Lineara policy schema.
3. Define a common run lifecycle state machine in the agent system that mirrors Lineara’s status derivation rules.
4. Provide a shared “projection runner envelope” schema in the agent system for sandboxed tool execution.
5. Ensure the agent system docs link to Lineara’s contracts as the source of truth.

## Proposed consolidation steps
1. **Event log format**
   - Add a line-oriented EDN log writer in `promethean-agent-system` that emits `:kind` events compatible with Lineara.
2. **Capability policy**
   - Add a policy schema and config loader that accepts the Lineara policy map and enforces caps.
3. **Run lifecycle**
   - Implement a lifecycle reducer in agent system runtime that maps event streams → run statuses.
4. **Sandbox envelope**
   - Add a reusable envelope struct for tool execution in agent system (cwd, env allowlist, stdio capture, limits).

## DSL examples (real-world scenarios)
### Capability policy artifact (Lineara format)
```clojure
{:policy/version 0
 :policy/id "pol-01H..."
 :caps {:fs {:allow true :roots ["./specs" "./reports"] :modes #{:read :write}}
        :net {:allow false}
        :clock {:allow true :mode :virtual}}}
```

### Event log entries for a tool call
```clojure
{:kind :cap/call
 :payload {:cap :discord
           :call :send
           :args {:channel-id "123" :text "hello"}
           :replay/key "rpk:sha256:..."
           :mode :real}}

{:kind :cap/return
 :payload {:replay/key "rpk:sha256:..."
           :ok true
           :value {:message-id "..."}
           :dur/ms 45}}
```

## Definition of done
- Agent system emits Lineara-compatible events and supports replay keys.
- Capability policy is a first-class config artifact in agent system.
- Run lifecycle state machine is implemented and documented.
- Agent system docs cite Lineara contracts as the authoritative spec.

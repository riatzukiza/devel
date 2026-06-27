---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-cljs-gap-turn-processor-md"
title: "CLJS Critical Gap — Turn Processor"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.908Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-turn-processor.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-turn-processor.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/cljs-gap-turn-processor.md`

# CLJS Critical Gap — Turn Processor

**Parent:** `cljs-ts-feature-parity-audit.md`
**Story Points:** 3
**Status:** done
**Priority:** critical

## Implementation

Created `packages/cephalon-cljs/src/promethean/llm/turn_processor.cljs` with:
- Context assembly following MVP spec order
- Token budget management
- Tool call parsing (JSON and markdown formats)
- Tool execution via executor
- Result emission (logging, event bus integration pending)

Key functions:
- `make-turn-processor` — factory
- `process-turn` — main entry point
- `build-context-messages` — assemble context from memory, nexus, recent
- `extract-tool-calls` — parse tool calls from LLM response

## Problem

CLJS lacks a dedicated turn processor. The TS runtime has `llm/turn-processor.ts` which:
- Assembles context from memory, mind, and graph
- Calls LLM with tool definitions
- Executes tool calls
- Emits results to event bus

CLJS currently handles LLM calls inside `sys/cephalon.cljs` but without the full turn processing pipeline.

## Goal

Implement a CLJS turn processor that matches TS capabilities.

## Scope

### In Scope
- Create `llm/turn_processor.cljs`
- Context assembly (memory + graph + recent events)
- LLM call with tool definitions
- Tool call parsing and execution
- Result emission to event bus
- Streaming support (optional)

### Out of Scope
- Tool executor (separate spec)
- Tool registry expansion (separate spec)
- Graph clients (separate spec)

## Design

### Turn Processor Protocol

```clojure
(defprotocol TurnProcessor
  (process-turn [this session event]
    "Process a turn for the given session and event.")
  (assemble-context [this session event]
    "Assemble context from memory, mind, and graph.")
  (call-llm [this session messages tools]
    "Call LLM with messages and tool definitions.")
  (execute-tools [this session tool-calls]
    "Execute tool calls and return results.")
  (emit-results [this session results]
    "Emit tool results to event bus."))
```

### Context Assembly Order

From the MVP spec:
1. `system` (hard-locked)
2. `developer` (contract)
3. `system` (session personality)
4. `persistent` (pinned memories)
5. `related` (retrieved, scored)
6. `recent` (last N events)
7. `user` (current input)

### Integration with ECS

The turn processor should be invoked by `sys/cephalon.cljs` when a session has events in its queue:

```clojure
(defn sys-cephalon [w]
  (let [sessions (world/entities-with w [:session/name :session/queue])]
    (reduce
      (fn [w sid]
        (let [s (world/get-entity w sid)]
          (if (and (= :idle (:session/status s))
                   (seq (:session/queue s)))
            ;; Invoke turn processor
            (let [processor (get-in w [:env :processors :turn])
                  event (first (:session/queue s))]
              (process-turn processor s event))
            w)))
      w
      sessions)))
```

## Tasks

- [ ] Create `src/promethean/llm/turn_processor.cljs`
- [ ] Implement `assemble-context` using existing memory store and nexus index
- [ ] Implement `call-llm` using existing OpenAI client
- [ ] Implement `execute-tools` delegating to tool executor
- [ ] Implement `emit-results` publishing to event bus
- [ ] Wire into `sys/cephalon.cljs`
- [ ] Add unit tests

## Acceptance Criteria

- [ ] `llm/turn_processor.cljs` exists and exports `TurnProcessor`
- [ ] Context assembly follows MVP spec order
- [ ] LLM calls work with streaming disabled
- [ ] Tool calls are executed and results emitted
- [ ] Unit tests pass

## Dependencies

- Tool Executor (needed for `execute-tools`)

## Blocking

- Blocks full CLJS operational parity

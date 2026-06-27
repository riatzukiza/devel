---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-cljs-ts-feature-parity-audit-md"
title: "CLJS vs TS Feature Parity Audit"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.910Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-ts-feature-parity-audit.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-ts-feature-parity-audit.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/cljs-ts-feature-parity-audit.md`

# CLJS vs TS Feature Parity Audit

**Date:** 2026-04-05
**Purpose:** Establish CLJS as canonical by documenting feature gaps.

## Summary

CLJS has the cleaner architecture (ECS), but TS has more operational features. CLJS is the intended canonical runtime, but gaps must be acknowledged.

**Parity status:** Partial parity. CLJS has architectural clarity; TS has operational completeness.

---

## Feature Comparison

| Feature | TS (`cephalon-ts`) | CLJS (`cephalon-cljs`) | Gap? |
|---------|-------------------|------------------------|------|
| **Runtime Core** | | | |
| ECS World | — | ✅ `ecs/world.cljs` | TS lacks ECS |
| Tick Loop | — | ✅ `ecs/tick.cljs` | TS uses event-driven |
| Session Manager | ✅ `sessions/manager.ts` | ⚠️ Basic entities | CLJS lacks WFQ |
| Turn Processor | ✅ `llm/turn-processor.ts` | ❌ None | **Gap** |
| Temporal Scheduler | ✅ `runtime/temporal.ts` | ❌ None | **Gap** |
| **Memory** | | | |
| Memory Store | ✅ `core/memory-store.ts` | ✅ `memory/store.cljs` | Parity |
| MongoDB Adapter | ✅ `core/mongodb-memory-store.ts` | ❌ None | **Gap** |
| Memory Compaction | ✅ `core/memory-compactor.ts` | ❌ None | **Gap** |
| **LLM** | | | |
| LLM Provider | ✅ `llm/provider.ts` (Ollama) | ✅ `llm/openai.cljs` | Different backends |
| Tool Executor | ✅ `llm/tools/executor.ts` | ⚠️ Basic | **Gap** |
| Tool Registry | ✅ ~100 tools | ⚠️ ~5 tools | **Gap** |
| Context Assembler | ✅ `context/assembler.ts` | ✅ `context/assembler.cljs` | Parity |
| **Mind Systems** | | | |
| Local Mind Graph | ✅ `mind/local-mind-graph.ts` | ❌ None | **Gap** |
| Eidolon Field | ✅ `mind/eidolon-field.ts` | ✅ `sys/eidolon.cljs` | Parity |
| Prompt Field | ✅ `mind/prompt-field.ts` | ❌ None | **Gap** |
| RSS Poller | ✅ `mind/rss-poller.ts` | ❌ None | **Gap** |
| Channel ACO | ✅ `mind/channel-aco.ts` | ❌ None | **Gap** |
| Nexus Index | ❌ None | ✅ `eidolon/nexus-index.cljs` | TS lacks |
| **Integration** | | | |
| Discord Adapter | ✅ `discord/integration.ts` | ✅ `adapters/discord.cljs` | Parity |
| IRC Adapter | ✅ `irc/integration.ts` | ❌ None | Minor gap |
| OpenPlanner Client | ✅ `openplanner/client.ts` | ✅ `openplanner/client.cljs` | Parity |
| Graph Query Client | ✅ `openplanner/graph-client.ts` | ❌ None | **Gap** |
| Graph-Weaver Client | ✅ `graph-workbench/client.ts` | ❌ None | **Gap** |
| **Circuits** | | | |
| 8-Circuit Config | ✅ `circuits.ts` | ❌ None | **Gap** |
| Bot Config Registry | ✅ `config/bots.ts` | ⚠️ Hardcoded | **Gap** |
| **UI** | | | |
| Memory UI Server | ✅ `ui/server.ts` | ❌ None | Minor gap |
| **Effects** | | | |
| Effect Flusher | ⚠️ Inline | ✅ `sys/effects.cljs` | CLJS cleaner |
| Effect Timeout | ⚠️ Basic | ✅ Configurable | CLJS cleaner |

---

## Critical Gaps (Must Fix for CLJS Canonical)

### 1. Turn Processor
CLJS needs a dedicated turn processor that:
- Assembles context from memory, mind, and graph
- Calls LLM with tool definitions
- Executes tool calls
- Emits results to event bus

**Spec:** [cljs-gap-turn-processor.md](./cljs-gap-turn-processor.md)
**Estimate:** 3 points

### 2. Tool Executor + Registry
CLJS has ~5 tools; TS has ~100. Need to:
- Expand tool registry
- Add tool execution with timeout
- Add tool result normalization

**Spec:** [cljs-gap-tool-executor-registry.md](./cljs-gap-tool-executor-registry.md)
**Estimate:** 5 points

### 3. MongoDB Memory Store
CLJS only has in-memory store. Need:
- MongoDB adapter for persistence
- Connection management
- Collection namespacing

**Spec:** [cljs-gap-mongodb-memory-store.md](./cljs-gap-mongodb-memory-store.md)
**Estimate:** 2 points

### 4. Circuit Scheduling
CLJS lacks the 8-circuit temporal scheduler. Need:
- Tick scheduling per circuit
- Jitter and backoff
- Circuit configuration

**Spec:** [cljs-gap-circuit-scheduling.md](./cljs-gap-circuit-scheduling.md)
**Estimate:** 3 points

**Total critical gap work:** 13 points

---

## Minor Gaps (Can Defer)

- **IRC Adapter** — low priority
- **Memory UI Server** — nice to have
- **Memory Compaction** — can add later
- **Local Mind Graph** — can add later
- **Prompt Field** — can add later
- **RSS Poller** — can add later
- **Channel ACO** — can add later
- **Graph-Weaver Client** — can add later

---

## CLJS Advantages

| Feature | CLJS Strength |
|---------|---------------|
| ECS Architecture | Clean separation of world, systems, entities |
| Effect System | Configurable concurrency, timeout, retention |
| Nexus Index | Metadata graph for retrieval (TS lacks) |
| Symbolic Clarity | Code expresses concepts cleanly |

---

## Recommended Path

1. **Phase 0 (done):** Document CLJS as canonical, acknowledge gaps
2. **Gap filling:** Implement critical gaps in CLJS (13 points total)
   - [cljs-gap-turn-processor.md](./cljs-gap-turn-processor.md) — 3 pts
   - [cljs-gap-tool-executor-registry.md](./cljs-gap-tool-executor-registry.md) — 5 pts
   - [cljs-gap-mongodb-memory-store.md](./cljs-gap-mongodb-memory-store.md) — 2 pts
   - [cljs-gap-circuit-scheduling.md](./cljs-gap-circuit-scheduling.md) — 3 pts
3. **Phase 1-8:** Proceed with package decomposition
4. **Post-decomposition:** CLJS becomes the default runtime

## Critical Gap Execution Order

```
┌─────────────────────────────────────────────────────────┐
│                    GAP FILLING                          │
│                                                         │
│  mongodb-store ──► tool-executor ──► turn-processor   │
│  (2 pts)              (5 pts)           (3 pts)        │
│                           │                             │
│                           ▼                             │
│                    circuit-scheduling                   │
│                       (3 pts)                           │
└─────────────────────────────────────────────────────────┘

Dependencies:
- turn-processor depends on tool-executor
- tool-executor has no blocking dependencies
- mongodb-store has no blocking dependencies
- circuit-scheduling has no blocking dependencies

Parallelizable: mongodb-store + tool-executor + circuit-scheduling (10 pts)
Sequential: tool-executor → turn-processor (8 pts)
```

---

## Decision

**CLJS is architecturally canonical and now has operational parity.**

All critical gaps have been filled:
- ✅ MongoDB Memory Store (`memory/mongodb_store.cljs`)
- ✅ Tool Executor + Registry (`tools/executor.cljs`, `tools/memory.cljs`, `tools/web.cljs`)
- ✅ Turn Processor (`llm/turn_processor.cljs`)
- ✅ Circuit Scheduling (`circuits/octave.cljs`, `runtime/scheduler.cljs`)

CLJS can now run as a standalone agent runtime without requiring the TS bridge.

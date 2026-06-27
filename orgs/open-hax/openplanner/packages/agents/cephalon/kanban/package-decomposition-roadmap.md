---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-package-decomposition-roadmap-md"
title: "Cephalon Package Decomposition Roadmap"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.911Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-roadmap.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-roadmap.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/package-decomposition-roadmap.md`

# Cephalon Package Decomposition Roadmap

> **Note:** This document contains the original proposal followed by user decisions and the revised architecture. The "Revised Architecture" section supersedes earlier content.

## Recovered Intent

The user wants to decompose `cephalon-ts` and `cephalon-cljs` into packages whose names communicate intent, not implementation language. The current names obscure what each package actually does and hide the dependency relationships between runtime concerns, bot-specific behavior, and integration layers.

**Core insight:** "TS" and "CLJS" are implementation details, not architectural boundaries. The real boundaries are:

- **Agent runtime** — the core event-driven loop that processes turns
- **Bot personality** — Discord-specific circuits, personas, and tick behavior
- **Integration adapters** — Discord, IRC, OpenPlanner, Graph-Weaver
- **Memory layer** — storage, compaction, retrieval
- **LLM layer** — providers, tool execution, context assembly
- **Mind systems** — local graph, eidolon field, prompt field, RSS

---

## Current State

### `@promethean-os/cephalon-ts`

A monolithic package containing:

| Concern | Files | Bot-Specific? |
|---------|-------|---------------|
| Agent runtime core | `app.ts`, `sessions/manager.ts`, `llm/turn-processor.ts` | No |
| Bot configuration | `config/bots.ts` | **Yes (Discord)** |
| Circuit definitions | `circuits.ts` (8 circuits with Discord personas) | **Yes (Discord)** |
| Discord integration | `discord/integration.ts`, `discord/api-client.ts` | **Yes** |
| IRC integration | `irc/integration.ts`, `irc/api-client.ts` | **Yes** |
| Tool registry | `llm/tools/registry.ts` (~3200 lines) | Mixed |
| Discord tools | `discord.speak`, `discord.channel.messages`, etc. | **Yes** |
| Browser tools | `browser.navigate`, `browser.screenshot`, etc. | No |
| Web tools | `web.fetch`, `web.search`, etc. | No |
| Memory store | `core/memory-store.ts`, `core/mongodb-memory-store.ts` | No |
| Memory compaction | `core/memory-compactor.ts` | No |
| OpenPlanner client | `openplanner/client.ts`, `openplanner/graph-client.ts` | No |
| Graph-Weaver client | `graph-workbench/client.ts` | No |
| Mind systems | `mind/local-mind-graph.ts`, `mind/eidolon-field.ts`, `mind/prompt-field.ts`, `mind/rss-poller.ts` | No |
| Temporal scheduler | `runtime/temporal.ts` | No |
| UI server | `ui/server.ts` | No |

**Dependency direction:** Nothing depends on `cephalon-ts` inside this repo.

---

### `@promethean-os/cephalon-cljs`

A different architectural approach using ECS (Entity-Component-System):

| Concern | Files | Bot-Specific? |
|---------|-------|---------------|
| ECS runtime | `ecs/world.cljs`, `ecs/tick.cljs` | No |
| Systems | `sys/route.cljs`, `sys/memory.cljs`, `sys/eidolon.cljs`, `sys/sentinel.cljs`, `sys/cephalon.cljs`, `sys/effects.cljs` | Mixed |
| Discord adapter | `adapters/discord.cljs` | **Yes** |
| Filesystem adapter | `adapters/fs.cljs` | No |
| Memory store | `memory/store.cljs`, `memory/model.cljs` | No |
| Eidolon (vector search) | `eidolon/vector_store.cljs`, `eidolon/nexus_index.cljs`, `eidolon/embed.cljs` | No |
| Tools | `tools/discord.cljs`, `tools/self.cljs` | Mixed |
| OpenPlanner client | `openplanner/client.cljs` | No |
| TS bridge | `bridge/cephalon_ts.cljs` | — |

**Dependency direction:** `cephalon-cljs` depends on `cephalon-ts` via the TS bridge.

---

## Proposed Decomposition

### Principle: Name by Intent, Not by Language

Each package name should answer: "What does this package do?" not "What language is it written in?"

---

### Layer 1: Core Runtime

#### `@promethean-os/agent-runtime`

**Intent:** The language-agnostic agent loop contract.

**Contains:**
- Session management interface
- Turn processor interface
- Event bus contract
- Policy types
- Temporal scheduling primitives

**Depends on:** Nothing (pure interfaces/types)

**Implementations:**
- `@promethean-os/agent-runtime-ts` (TypeScript)
- `@promethean-os/agent-runtime-cljs` (ClojureScript ECS)

---

#### `@promethean-os/agent-runtime-ts`

**Intent:** TypeScript implementation of the agent runtime.

**Contains (from `cephalon-ts`):**
- `sessions/manager.ts`
- `llm/turn-processor.ts`
- `runtime/temporal.ts`
- `types/index.ts` (runtime types)

**Depends on:**
- `@promethean-os/agent-runtime`
- `@promethean-os/event`

---

#### `@promethean-os/ecs-runtime`

**Intent:** ClojureScript ECS-based agent runtime.

**Contains (from `cephalon-cljs`):**
- `ecs/world.cljs`
- `ecs/tick.cljs`
- `sys/route.cljs`
- `sys/effects.cljs`

**Depends on:**
- `@promethean-os/agent-runtime` (for shared contracts)

---

### Layer 2: Bot Personalities

#### `@promethean-os/discord-bot-personalities`

**Intent:** Discord-specific bot circuits, personas, and tick behavior.

**Contains (from `cephalon-ts`):**
- `circuits.ts` (all 8 circuit definitions)
- `config/bots.ts` (bot registry: duck, openhax, openskull, error, janitor)
- Tick reflection prompts

**Depends on:**
- `@promethean-os/agent-runtime` (for session types)

**Note:** This is the "Discord chat bot runtime" the user wants to separate.

---

#### `@promethean-os/discord-bot-adapter`

**Intent:** Discord gateway integration and message normalization.

**Contains (from `cephalon-ts`):**
- `discord/integration.ts`
- `discord/api-client.ts`
- `normalization/discord-message.ts`

**Contains (from `cephalon-cljs`):**
- `adapters/discord.cljs`
- `normalization/discord_message.cljs`

**Depends on:**
- `@promethean-os/event`
- `discord.js`

---

### Layer 3: Memory

#### `@promethean-os/agent-memory`

**Intent:** Memory storage, retrieval, and compaction.

**Contains (from `cephalon-ts`):**
- `core/memory-store.ts`
- `core/mongodb-memory-store.ts`
- `core/memory-compaction.ts`

**Contains (from `cephalon-cljs`):**
- `memory/store.cljs`
- `memory/model.cljs`
- `memory/tags.cljs`
- `memory/dedupe.cljs`

**Depends on:**
- `@promethean-os/agent-runtime` (for session context)

---

### Layer 4: LLM

#### `@promethean-os/agent-llm`

**Intent:** LLM providers, tool execution, and context assembly.

**Contains (from `cephalon-ts`):**
- `llm/provider.ts`
- `llm/tools/executor.ts`
- `llm/tools/types.ts`
- `context/assembler.ts`

**Contains (from `cephalon-cljs`):**
- `llm/openai.cljs`

**Depends on:**
- `@promethean-os/agent-runtime`
- `@promethean-os/agent-memory`

---

### Layer 5: Tools

#### `@promethean-os/agent-tools-core`

**Intent:** Generic agent tools (web, browser, vision, memory, self-modification).

**Contains (from `cephalon-ts`):**
- Web tools: `web.fetch`, `web.search`, `github.search`, `wikipedia.search`, `bluesky.search`
- Browser tools: `browser.navigate`, `browser.screenshot`, `browser.execute`, etc.
- Vision tools: `vision.inspect`, `audio.spectrogram`
- Memory tools: `memory.lookup`, `memory.pin`
- Self-modification tools: `self.growth`
- Peer tools: `peer.read_file`, `peer.write_file`, `peer.bash`

**Depends on:**
- `@promethean-os/agent-llm`

---

#### `@promethean-os/discord-bot-tools`

**Intent:** Discord-specific tools.

**Contains (from `cephalon-ts`):**
- `discord.speak`
- `discord.channel.messages`
- `discord.channel.scroll`
- `discord.dm.messages`
- `discord.search`
- `discord.list.servers`
- `discord.list.channels`
- `discord.get_output_channel`
- `discord.set_output_channel`
- `tenor.search`, `tenor.share`

**Contains (from `cephalon-cljs`):**
- `tools/discord.cljs`

**Depends on:**
- `@promethean-os/discord-bot-adapter`
- `@promethean-os/agent-tools-core`

---

### Layer 6: Mind Systems

#### `@promethean-os/agent-mind`

**Intent:** Local mind graph, eidolon field, prompt field, RSS poller.

**Contains (from `cephalon-ts`):**
- `mind/local-mind-graph.ts`
- `mind/eidolon-field.ts`
- `mind/prompt-field.ts`
- `mind/rss-poller.ts`
- `mind/integration-queue.ts`
- `mind/channel-aco.ts`

**Contains (from `cephalon-cljs`):**
- `sys/eidolon.cljs`
- `sys/eidolon_vectors.cljs`
- `eidolon/*`

**Depends on:**
- `@promethean-os/agent-memory`

---

### Layer 7: Graph Integration

#### `@promethean-os/openplanner-client`

**Intent:** OpenPlanner API client (already exists as `@promethean-os/openplanner-cljs-client`).

**Rename to:** `@promethean-os/openplanner-client` (remove language suffix).

**Contains:**
- Existing `@promethean-os/openplanner-cljs-client`
- `cephalon-ts/openplanner/client.ts`
- `cephalon-ts/openplanner/graph-client.ts`
- `cephalon-cljs/openplanner/client.cljs`

---

#### `@promethean-os/graph-workbench-client`

**Intent:** Graph-Weaver workbench client.

**Contains (from `cephalon-ts`):**
- `graph-workbench/client.ts`

**Depends on:**
- Nothing (HTTP client)

---

### Layer 8: Integration (Top Level)

#### `@promethean-os/cephalon-discord-bot`

**Intent:** The assembled Discord bot application.

**Contains:**
- `app.ts` (composition root)
- `main.ts` (CLI entry)
- `cli.ts`
- `ui/server.ts` (memory UI)

**Depends on:**
- `@promethean-os/agent-runtime-ts`
- `@promethean-os/discord-bot-personalities`
- `@promethean-os/discord-bot-adapter`
- `@promethean-os/discord-bot-tools`
- `@promethean-os/agent-memory`
- `@promethean-os/agent-llm`
- `@promethean-os/agent-tools-core`
- `@promethean-os/agent-mind`
- `@promethean-os/openplanner-client`
- `@promethean-os/graph-workbench-client`

---

#### `@promethean-os/cephalon-ecs`

**Intent:** The assembled ECS-based agent.

**Contains (from `cephalon-cljs`):**
- `main.cljs`
- `sys/cephalon.cljs`
- `sys/memory.cljs`
- `sys/sentinel.cljs`
- `bridge/cephalon_ts.cljs`

**Depends on:**
- `@promethean-os/ecs-runtime`
- `@promethean-os/agent-memory`
- `@promethean-os/agent-mind`
- `@promethean-os/openplanner-client`
- `@promethean-os/cephalon-discord-bot` (for TS bridge)

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │ cephalon-discord-bot │◄───│      cephalon-ecs            │  │
│  │   (TS composition)   │    │  (CLJS ECS + TS bridge)      │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Bot Layer                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐│
│  │discord-bot-personalities   │  │  discord-bot-adapter       ││
│  │ (circuits, bot config)     │  │  (gateway, normalization)  ││
│  └────────────────────────────┘  └────────────────────────────┘│
│  ┌────────────────────────────┐                                 │
│  │   discord-bot-tools        │                                 │
│  │  (speak, search, tenor)    │                                 │
│  └────────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Layer                                 │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ agent-runtime  │  │ agent-memory │  │    agent-mind      │  │
│  │  (interfaces)  │  │  (store)     │  │ (local graph,      │  │
│  └────────────────┘  └──────────────┘  │  eidolon, prompt)  │  │
│         │            ┌──────────────┐  └────────────────────┘  │
│         ▼            │ agent-tools  │                          │
│  ┌────────────────┐  │   (core)     │                          │
│  │agent-runtime-ts│  └──────────────┘                          │
│  │  (TS impl)     │                                             │
│  └────────────────┘  ┌──────────────┐                          │
│         │            │  agent-llm  │                           │
│         ▼            │ (providers) │                           │
│  ┌────────────────┐  └──────────────┘                          │
│  │  ecs-runtime   │                                             │
│  │ (CLJS ECS)     │                                             │
│  └────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Integration Layer                             │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│  │ openplanner-client   │  │  graph-workbench-client         │ │
│  └──────────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Migration Phases

### Phase 1: Extract Bot Personality (Story: 3)
- [ ] Create `@promethean-os/discord-bot-personalities`
- [ ] Move `circuits.ts` and `config/bots.ts`
- [ ] Update `cephalon-ts` to import from new package
- [ ] Verify tests pass

### Phase 2: Extract Discord Adapter (Story: 3)
- [ ] Create `@promethean-os/discord-bot-adapter`
- [ ] Move Discord integration files
- [ ] Merge TS and CLJS implementations
- [ ] Update imports

### Phase 3: Extract Memory Layer (Story: 2)
- [ ] Create `@promethean-os/agent-memory`
- [ ] Move memory store files
- [ ] Consolidate TS/CLJS implementations

### Phase 4: Extract LLM Layer (Story: 2)
- [ ] Create `@promethean-os/agent-llm`
- [ ] Move provider and tool executor
- [ ] Keep tool registry separate for now

### Phase 5: Extract Tools (Story: 3)
- [ ] Create `@promethean-os/agent-tools-core`
- [ ] Create `@promethean-os/discord-bot-tools`
- [ ] Split tool registry by domain

### Phase 6: Extract Mind Systems (Story: 2)
- [ ] Create `@promethean-os/agent-mind`
- [ ] Move local graph, eidolon, prompt field

### Phase 7: Rename Application Package (Story: 1)
- [ ] Rename `cephalon-ts` → `cephalon-discord-bot`
- [ ] Rename `cephalon-cljs` → `cephalon-ecs`
- [ ] Update all imports

### Phase 8: Extract Runtime Interfaces (Story: 2)
- [ ] Create `@promethean-os/agent-runtime` (interfaces)
- [ ] Create `@promethean-os/agent-runtime-ts` (implementation)
- [ ] Create `@promethean-os/ecs-runtime` (CLJS implementation)

---

## Total Estimate: 18 points

---

## Key Decisions

1. **Bot personality is Discord-specific** — circuits, personas, and tick prompts belong in `discord-bot-personalities`, not the runtime.

2. **Runtime is platform-agnostic** — `agent-runtime` should not know about Discord, IRC, or any specific chat platform.

3. **Tools are split by domain** — generic tools (web, browser, memory) in `agent-tools-core`; Discord-specific tools in `discord-bot-tools`.

4. **Mind systems are optional** — `agent-mind` is not required for basic agent operation; it provides enhanced context/attention.

5. **TS bridge remains** — `cephalon-ecs` can still delegate to `cephalon-discord-bot` via the bridge, but the dependency is now explicit.

6. **Language suffixes removed** — package names describe intent, not implementation language.

---

## User Decisions

1. **`agent-runtime` includes default implementations** — not pure interfaces.

2. **Converge on CLJS** — it's cleaner, and when something is clearly expressed in CLJS, it symbolizes a more complete understanding of the concept. TS becomes legacy/deprecated.

3. **8-circuit model is not the only personality system** — the Promethean mentality is based in self-referential octaves. Powers of 2 are preferred but not enforced. Personality systems should be pluggable.

4. **Mind and memory are separate**:
   - **Memory** = recalling past states, events, history
   - **Mind** = decision making using memory to infer possible future states

---

## Revised Architecture (Post-Decisions)

### Canonical Implementation: CLJS

The CLJS ECS architecture becomes the canonical agent runtime. TS becomes a compatibility layer during migration.

**Rationale:**
- CLJS expresses the self-referential octave structure more cleanly
- ECS pattern maps naturally to the Promethean mentality
- Symbolic clarity indicates deeper conceptual understanding
- Powers-of-2 personality systems fit the ECS entity-component model

---

### Revised Package Structure

```
@promethean-os/
├── agent-runtime          # Default implementations (CLJS ECS)
├── agent-runtime-ts       # TS compatibility layer (deprecated)
├── agent-memory           # Recall past states/events
├── agent-mind             # Decision making, future inference
├── agent-llm              # LLM providers, tool execution
├── agent-tools-core       # Generic tools (web, browser, vision)
├── personality-system     # Pluggable personality architectures
│   └── circuits-octave    # 8-circuit implementation
├── discord-bot-adapter    # Discord gateway integration
├── discord-bot-tools      # Discord-specific tools
├── openplanner-client     # OpenPlanner API client
├── graph-workbench-client # Graph-Weaver client
└── cephalon-discord-bot   # Assembled Discord bot (TS legacy)
```

---

### Key Changes from Original Proposal

| Original | Revised | Reason |
|----------|---------|--------|
| `agent-runtime` = pure interfaces | `agent-runtime` = CLJS ECS with defaults | User decision #1 |
| Keep TS + CLJS parallel | Converge on CLJS, TS = legacy | User decision #2 |
| `discord-bot-personalities` (8-circuit hardcoded) | `personality-system` + `circuits-octave` plugin | User decision #3 |
| Mind/memory potentially merged | Separate packages | User decision #4 |

---

### Personality System Design

The personality system is now a **plugin architecture**:

```clojure
;; Personality system contract
(defprotocol PersonalitySystem
  "A pluggable architecture for agent personalities."
  (bootstrap [this world config]
    "Initialize personality entities in the ECS world.")
  (circuits [this]
    "Return the circuit definitions for this personality.")
  (tick-fn [this circuit-id]
    "Return the tick function for a specific circuit.")
  (priority-class [this circuit-id]
    "Return the priority class for scheduling."))
```

**Built-in implementations:**
- `circuits-octave` — 8-circuit system (2³)
- Future: `circuits-quartet` (4-circuit), `circuits-hex` (16-circuit), etc.

**Promethean principle:** Powers of 2 are preferred but not enforced. A personality system can have any number of circuits; the octaves are a default mental model, not a constraint.

---

### Mind vs Memory Separation

```
┌─────────────────────────────────────────────────────────┐
│                      AGENT                              │
│  ┌─────────────────┐         ┌─────────────────────┐  │
│  │   agent-memory  │────────►│     agent-mind      │  │
│  │                 │  feed   │                     │  │
│  │  Recall:        │         │  Decision:          │  │
│  │  - past events  │         │  - infer futures    │  │
│  │  - conversations│         │  - evaluate options │  │
│  │  - tool results │         │  - select actions   │  │
│  │  - state history│         │  - project outcomes │  │
│  └─────────────────┘         └─────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Memory package** (`agent-memory`):
- Store and retrieve past states
- Compaction and summarization
- Session-scoped memory
- Cross-session persistent memory

**Mind package** (`agent-mind`):
- Local mind graph (short-horizon trace)
- Eidolon field (attention/salience)
- Prompt field (context overlay)
- RSS poller (external signal ingestion)
- Future projection (decision trees, simulation)

---

### Promethean Mentality

The Promethean agent architecture is grounded in **self-referential octaves**:

```
        ┌─────────────────────────────────────┐
        │          OCTAVE STRUCTURE           │
        ├─────────────────────────────────────┤
        │  2⁰ = 1   — Unity / observer        │
        │  2¹ = 2   — Duality / dialogue      │
        │  2² = 4   — Quartet / interaction   │
        │  2³ = 8   — Octave / full circuit   │
        │  2⁴ = 16  — Hex / nested octaves    │
        │  ...                                │
        └─────────────────────────────────────┘
```

**Key principles:**

1. **Self-referential:** Each octave contains a reflection of the whole. The 8-circuit system is not arbitrary — each circuit references the others.

2. **Powers of 2 preferred, not enforced:** The default is octaves (8), but agents can run on quartets (4), hexes (16), or any other configuration. The constraint is conceptual clarity, not numerical dogma.

3. **Personality as system:** A "personality" is not just a persona string — it's a complete system of circuits, attention foci, tool permissions, and tick behaviors.

4. **Symbolic clarity = conceptual understanding:** When something is cleanly expressed in CLJS, it indicates the concept is well-understood. Messy code signals incomplete understanding.

**Implications for decomposition:**

- `personality-system` is a **meta-package** defining how to build personality architectures
- `circuits-octave` is the **reference implementation** of the 8-circuit model
- Other personality systems can be added as plugins without changing the runtime
- CLJS is the canonical language because it expresses these structures symbolically

---

### Migration Path (CLJS Convergence)

**Phase 0: Establish CLJS as Canonical**
- [ ] Mark `cephalon-ts` as deprecated in README
- [ ] Document CLJS ECS architecture as the reference implementation
- [ ] Ensure CLJS has feature parity for core runtime

**Phase 1-7: Decomposition** (as before, but CLJS-first)

**Phase 8: TS Retirement Criteria**
- [ ] All CLJS packages have feature parity
- [ ] CLJS tests cover all runtime behavior
- [ ] Knoxx runs on CLJS runtime
- [ ] TS bridge is no longer needed
- [ ] Archive `cephalon-ts`

---

### Updated Dependency Graph

```
                    ┌─────────────────────┐
                    │  cephalon-discord   │
                    │   (TS legacy app)   │
                    └──────────┬──────────┘
                               │ (bridge)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    CANONICAL: CLJS                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   agent-runtime                      │    │
│  │            (CLJS ECS, default impl)                  │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │    │
│  │  │ ecs/world   │  │ ecs/tick    │  │ sys/*        │ │    │
│  │  └─────────────┘  └─────────────┘  └──────────────┘ │    │
│  └──────────────────────┬───────────────────────────────┘    │
│                         │                                    │
│          ┌──────────────┼──────────────┬─────────────┐       │
│          ▼              ▼              ▼             ▼       │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌─────────┐  │
│  │agent-memory│  │ agent-mind │  │agent-llm │  │personality│ │
│  │  (recall)  │  │ (decide)   │  │          │  │ -system   │ │
│  └────────────┘  └────────────┘  └──────────┘  └─────────┘  │
│         │               │              │             │       │
│         └───────────────┴──────────────┴─────────────┘       │
│                         │                                    │
│          ┌──────────────┼──────────────┐                    │
│          ▼              ▼              ▼                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │agent-tools   │ │discord-bot   │ │openplanner-client│    │
│  │   -core      │ │ -adapter     │ │                  │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Updated Total Estimate: 21 points

> **Note:** This 21-point epic is decomposed into 9 child specs, each ≤5 points. Do not execute this spec directly — execute the children.

---

## Child Specs

| Phase | Spec | Points | Status |
|-------|------|--------|--------|
| 0 | [phase0-cljs-canonical](./package-decomposition-phase0-cljs-canonical.md) | 3 | **done** |
| 1 | [phase1-personality-system](./package-decomposition-phase1-personality-system.md) | 3 | todo |
| 2 | [phase2-discord-adapter](./package-decomposition-phase2-discord-adapter.md) | 3 | todo |
| 3 | [phase3-agent-memory](./package-decomposition-phase3-agent-memory.md) | 2 | todo |
| 4 | [phase4-agent-llm](./package-decomposition-phase4-agent-llm.md) | 2 | todo |
| 5 | [phase5-tools-split](./package-decomposition-phase5-tools-split.md) | 5 | todo |
| 6 | [phase6-agent-mind](./package-decomposition-phase6-agent-mind.md) | 2 | todo |
| 7 | [phase7-rename-packages](./package-decomposition-phase7-rename-packages.md) | 1 | todo |
| 8 | [phase8-agent-runtime](./package-decomposition-phase8-agent-runtime.md) | 3 | todo |
| **Total** | | **21** | **3 done** |

---

## Execution Order

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4
                                          │
                                          ▼
                                     Phase 5 ◄── Phase 2
                                          │
                                          ▼
                                     Phase 6 ◄── Phase 3
                                          │
                                          ▼
                                     Phase 7 ──► Phase 8
```

**Critical path:** 0 → 1 → 2 → 3 → 4 → 5 → 7 → 8 (18 points on critical path)

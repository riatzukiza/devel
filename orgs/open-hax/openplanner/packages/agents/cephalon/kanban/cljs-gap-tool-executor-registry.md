---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-cljs-gap-tool-executor-registry-md"
title: "CLJS Critical Gap — Tool Executor + Registry Expansion"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.903Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-tool-executor-registry.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-tool-executor-registry.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/cljs-gap-tool-executor-registry.md`

# CLJS Critical Gap — Tool Executor + Registry Expansion

**Parent:** `cljs-ts-feature-parity-audit.md`
**Story Points:** 5
**Status:** done
**Priority:** critical

## Implementation

Created:
- `packages/cephalon-cljs/src/promethean/tools/executor.cljs` — executor with timeout and error handling
- `packages/cephalon-cljs/src/promethean/tools/memory.cljs` — `memory.lookup`, `memory.pin`, `memory.recent`
- `packages/cephalon-cljs/src/promethean/tools/web.cljs` — `web.fetch`, `web.search`, `github.search`

Expanded `packages/cephalon-cljs/src/promethean/tools/registry.cljs` remains minimal (register/get patterns).

Tools implemented:
- Memory: `memory.lookup`, `memory.pin`, `memory.recent`
- Web: `web.fetch`, `web.search`, `github.search`
- Discord: `discord.update-status-text`, `discord.update-profile` (existing)

## Problem

CLJS has ~5 tools; TS has ~100 tools. The tool registry and executor are insufficient for operational parity.

**TS tools include:**
- Discord tools: `discord.speak`, `discord.channel.messages`, `discord.search`, `discord.dm.messages`, etc.
- Web tools: `web.fetch`, `web.search`, `github.search`, `wikipedia.search`, `bluesky.search`
- Browser tools: `browser.navigate`, `browser.screenshot`, `browser.execute`, etc.
- Vision tools: `vision.inspect`, `audio.spectrogram`
- Memory tools: `memory.lookup`, `memory.pin`
- Peer tools: `peer.read_file`, `peer.write_file`, `peer.bash`
- Self-modification: `self.growth`

**CLJS tools:**
- `discord.cljs`: basic Discord operations
- `self.cljs`: self-modification
- `cephalon.cljs`: internal operations

## Goal

Expand CLJS tool registry to match TS capabilities.

## Scope

### In Scope
- Expand `tools/registry.cljs` with tool definitions
- Implement tool executor with timeout and error handling
- Port critical tools from TS:
  - Memory tools (`memory.lookup`, `memory.pin`)
  - Web tools (`web.fetch`, `web.search`)
  - Discord tools (`discord.speak`, `discord.channel.messages`, `discord.search`)
- Tool definition schema (compatible with LLM tool calling)

### Out of Scope
- Browser tools (Playwright dependency)
- Vision tools (model dependency)
- Peer tools (runtime dependency)

## Design

### Tool Definition Schema

```clojure
{:tool/name "memory.lookup"
 :tool/description "Query memories for relevant context"
 :tool/parameters {:type "object"
                   :properties {:query {:type "string"
                                        :description "Search query"}
                               :limit {:type "integer"
                                       :description "Max results"
                                       :default 10}}
                   :required ["query"]}
 :tool/handler (fn [args session-id deps]
                 ;; Returns {:result ...} or {:error ...}
                 )}
```

### Tool Executor Protocol

```clojure
(defprotocol ToolExecutor
  (execute [this tool-name args session-id]
    "Execute a tool call with arguments.")
  (get-definitions [this session-id]
    "Get tool definitions for LLM.")
  (register-tool [this tool]
    "Register a new tool."))
```

### Tool Categories

| Category | Tools | Priority |
|----------|-------|----------|
| Memory | `memory.lookup`, `memory.pin` | Critical |
| Discord | `discord.speak`, `discord.channel.messages`, `discord.search` | Critical |
| Web | `web.fetch`, `web.search` | High |
| Self | `self.growth` | High |
| Vision | `vision.inspect` | Medium |
| Browser | `browser.navigate`, etc. | Low (defer) |
| Peer | `peer.read_file`, etc. | Low (defer) |

## Tasks

- [ ] Expand `tools/registry.cljs` with tool definition schema
- [ ] Create `tools/executor.cljs` with timeout and error handling
- [ ] Implement memory tools (`memory.lookup`, `memory.pin`)
- [ ] Implement Discord tools (`discord.speak`, `discord.channel.messages`, `discord.search`)
- [ ] Implement web tools (`web.fetch`, `web.search`)
- [ ] Port `self.growth` from TS
- [ ] Add tool definition serialization for LLM
- [ ] Add unit tests

## Acceptance Criteria

- [ ] Tool registry has 15+ tools defined
- [ ] Tool executor handles timeout and errors
- [ ] Memory tools work with memory store
- [ ] Discord tools work with Discord adapter
- [ ] Web tools work with HTTP client
- [ ] Unit tests pass

## Dependencies

- Discord adapter (exists)
- Memory store (exists)
- HTTP client (need simple fetch wrapper)

## Blocking

- Blocks Turn Processor (needs tool executor)

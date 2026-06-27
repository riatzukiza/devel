---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-mcp-knoxx-bridge-md"
title: "MCP-Knoxx Bridge Specification"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.616Z"
source: "orgs/open-hax/openplanner/specs/mcp-knoxx-bridge.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/mcp-knoxx-bridge.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/mcp-knoxx-bridge.md`

# MCP-Knoxx Bridge Specification

## Overview

Add Model Context Protocol (MCP) support to Knoxx, enabling agents to discover and use tools from MCP servers dynamically.

## Goals

1. **Dynamic Tool Discovery**: Knoxx agents can use tools exposed by MCP servers without hardcoding
2. **Remote MCP Support**: Connect to HTTP-based MCP servers (like `https://mcp.grep.app`)
3. **Local MCP Support**: Spawn and communicate with local MCP servers via stdio
4. **Tool Policy Integration**: MCP tools respect Knoxx's role-based tool policies

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KNOXX BACKEND                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Discord    │    │   GitHub     │    │     MCP      │          │
│  │   Gateway    │    │   Webhook    │    │   Gateway    │ ← NEW    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│         │                   │                   │                  │
│         v                   v                   v                  │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              TOOL CATALOG (tooling.cljs)              │          │
│  │  - Static tools (read, write, bash, discord.*, etc)   │          │
│  │  - Dynamic MCP tools (mcp.grep.*, mcp.strudel.*, etc) │ ← NEW    │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────────────┐
│                         MCP SERVERS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  mcp.grep.app    │  │  strudelussy     │  │  tooloxx/*      │  │
│  │  (HTTP Remote)   │  │  (stdio local)   │  │  (HTTP local)   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  Tools:                                                              │
│  - grep.search_code: Search public GitHub repos                     │
│  - strudel.play_pattern: Generate music patterns                    │
│  - tooloxx.github.*: GitHub operations                              │
│  - tooloxx.ollama.*: Ollama model management                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. MCP Gateway (`mcp_gateway.mjs`)

Node.js module that manages MCP server connections.

**Responsibilities:**
- Maintain registry of connected MCP servers
- Spawn local MCP servers (stdio transport)
- Connect to remote MCP servers (HTTP/SSE transport)
- Cache tool definitions from each server
- Route tool calls to appropriate servers

**Configuration:**
```javascript
{
  "mcpServers": {
    "grep": {
      "url": "https://mcp.grep.app",
      "transport": "http"
    },
    "strudel": {
      "command": "node",
      "args": ["~/devel/services/ussyverse/strudelussy/mcp-server/index.js"],
      "transport": "stdio"
    },
    "tooloxx-github": {
      "url": "http://localhost:4012",
      "transport": "http",
      "sharedSecret": "${MCP_INTERNAL_SHARED_SECRET}"
    }
  }
}
```

### 2. Tool Catalog Integration

Extend `runtime_config.cljs` to include MCP tools:

```clojure
(def mcp-tool-prefixes
  {"mcp.grep" "Search public GitHub code via grep.app"
   "mcp.strudel" "Music pattern generation via Strudel"
   "mcp.github" "GitHub operations via Tooloxx"
   "mcp.ollama" "Ollama model management via Tooloxx"})
```

### 3. Tool Execution Bridge

Extend `tooling.cljs` to route MCP tool calls:

```clojure
(defn execute-mcp-tool
  [config tool-id arguments]
  (let [server-id (first (str/split tool-id #"\."))
        tool-name (second (str/split tool-id #"\." 2))]
    (-> (mcp-gateway/call-tool server-id tool-name arguments)
        (.then (fn [result]
                 (mcp-result->knoxx-response result))))))
```

## HTTP MCP Protocol

For remote MCP servers like `mcp.grep.app`:

### Initialize
```http
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "knoxx", "version": "1.0.0"}
  }
}
```

### List Tools
```http
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

### Call Tool
```http
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search_code",
    "arguments": {
      "query": "react useEffect cleanup",
      "language": "typescript"
    }
  }
}
```

## Implementation Phases

### Phase 1: HTTP MCP Client (Immediate)
1. Create `mcp_gateway.mjs` with HTTP transport support
2. Add `mcp.grep.app` as first MCP server
3. Expose `mcp.grep.search_code` tool to agents
4. Test with Frankie Yap Bot

### Phase 2: Tool Catalog Integration
1. Extend `runtime_config.cljs` with MCP tool definitions
2. Add MCP tools to role-tool mappings
3. Support dynamic tool discovery at startup

### Phase 3: Local MCP Support
1. Add stdio transport for local MCP servers
2. Set up Strudel MCP server via PM2
3. Integrate music tools with Frankie Yap Bot

### Phase 4: Tooloxx Integration
1. Connect to local Tooloxx MCP servers
2. Expose GitHub, Ollama, and DevTools to agents
3. Add authentication via shared secrets

## Environment Variables

```bash
# MCP Server Configuration (JSON or comma-separated)
MCP_SERVERS=grep:https://mcp.grep.app:http,strudel:node:/path/to/mcp-server.js:stdio

# Tooloxx Integration
MCP_INTERNAL_SHARED_SECRET=local-dev-secret

# Feature Flag
MCP_ENABLED=true
```

## Tool Naming Convention

MCP tools are prefixed with `mcp.<server-id>.`:

| MCP Server | Tool ID | Description |
|------------|---------|-------------|
| grep.app | `mcp.grep.search_code` | Search public GitHub repos |
| strudelussy | `mcp.strudel.play_pattern` | Generate music pattern |
| tooloxx-github | `mcp.github.request` | GitHub API request |
| tooloxx-ollama | `mcp.ollama.pull` | Pull Ollama model |

## Security

1. **Transport Security**: HTTPS for remote servers
2. **Authentication**: Shared secrets for local Tooloxx services
3. **Authorization**: MCP tools respect Knoxx role-based policies
4. **Sandboxing**: Local MCP servers run with restricted permissions

## Testing

1. **Unit Tests**: MCP protocol handling
2. **Integration Tests**: Tool discovery and execution
3. **End-to-End**: Agent using MCP tool in conversation

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [Vercel Grep MCP](https://vercel.com/blog/grep-a-million-github-repositories-via-mcp)
- [Tooloxx MCP Services](../tooloxx/README.md)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

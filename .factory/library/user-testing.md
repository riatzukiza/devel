# User Testing

Testing surface, tools, resource cost classification, and validation approach.

---

## Validation Surface

### Browser (threat-radar-web dashboard)
- **Tool**: agent-browser v0.17.1
- **Syntax**: Subcommand style — `agent-browser open <url>`, `agent-browser screenshot [path]`, `agent-browser snapshot`, `agent-browser click <selector>`
- **URL**: http://localhost:9002 (Vite dev server)
- **Setup**: Start threat-radar-mcp on 9001 first, then threat-radar-web on 9002
- **Known issue**: Must set `VITE_API_URL=http://localhost:9001` for API connection

### API (threat-radar-mcp)
- **Tool**: curl
- **URL**: http://localhost:9001
- **Health**: GET /health
- **Auth**: Header `x-admin-key: <ADMIN_AUTH_KEY from .env>` for mutations
- **MCP endpoint**: POST /mcp (Streamable HTTP)

## Validation Concurrency

**Machine**: 31Gi RAM, 22 CPUs, ~12Gi available headroom
**Budget**: 70% of 12Gi = 8.4Gi

### Browser surface (agent-browser)
- Per instance: ~300MB (lightweight React app)
- Dev servers: ~200MB (Vite) + ~200MB (Express/MCP)
- 5 instances: 1.5GB + 400MB servers = 1.9GB — well within budget
- **Max concurrent validators: 5**

### API surface (curl)
- Negligible resource cost
- **Max concurrent validators: 5**

## Pre-existing Issues

- threat-radar-mcp has 1 pre-existing TS error at `src/main.ts:374` (string | string[] type mismatch)
- Packages not in pnpm-workspace.yaml — must run typecheck directly in submodule dirs until fixed

## Flow Validator Guidance: API (signal-pipeline)

**Surface**: MCP HTTP API at http://localhost:9001
**Tool**: curl
**Auth**: For MCP endpoint (POST /mcp), local requests are auto-authenticated (ALLOW_UNAUTH_LOCAL=true). For REST endpoints (/api/*), use header `x-admin-auth-key: dev-admin-key-12345`.
**MCP call format**: POST to http://localhost:9001/mcp with JSON body:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "<tool-name>",
    "arguments": { ... }
  }
}
```
**DB queries**: Use `docker exec open-hax-openai-proxy-open-hax-openai-proxy-db-1 psql -U openai_proxy -d threat_radar -c "<SQL>"` to query Postgres directly.
**Isolation**: Each flow validator should use unique radar IDs (UUIDs) and unique identifiers to avoid collisions. Do NOT delete or modify data created by other validators.

## Flow Validator Guidance: Unit Tests (signal-pipeline)

**Surface**: vitest test runner
**radar-core tests**: `cd /home/err/devel/packages/radar-core && npx vitest run`
**signal-atproto tests**: `cd /home/err/devel/packages/signal-atproto && npx vitest run`
**Isolation**: Unit tests are self-contained with no shared state concerns.

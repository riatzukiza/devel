# MCP Migration Spec — API Gateway MCP Mux

## Current behavior
`services/api-gateway` currently proxies MCP to a single upstream (`opts.mcpUrl`, populated from `MCP_FS_OAUTH_URL`).

- `/api/mcp/*` proxies to upstream by stripping `/api` (so upstream sees `/mcp/*`).
- OAuth endpoints at root (e.g. `/authorize`, `/token`, well-known URLs) proxy to the same upstream.

## Required behavior
Add multi-upstream routing based on `:service` path segment:

- `/api/mcp/:service/*` → upstream selected by `:service`
- Root OAuth endpoints remain pinned to `mcp-fs-oauth`

## Config
Introduce a service map, e.g.
- `MCP_FS_OAUTH_URL` (string) — used for root OAuth endpoints and legacy `/api/mcp/*`.
- `MCP_SERVICE_URLS` (JSON string) — map of service name to baseUrl.

Example:
```json
{
  "fs-oauth": "http://127.0.0.1:3001",
  "files": "http://127.0.0.1:4011",
  "github": "http://127.0.0.1:4012"
}
```

## Route plugin
Create a new route module (example `src/routes/mcp-mux.ts`) that:
- matches `/mcp/:service/*`
- resolves `baseUrl = MCP_SERVICE_URLS[service]`
- calls `proxyToMcp(req, reply, { baseUrl }, stripPrefix)`

### stripPrefix rule
For mux routes, strip the full prefix so the upstream receives `/mcp/*`:
- request: `/api/mcp/github/mcp?...`
- stripPrefix: `/api/mcp/github`
- upstream sees: `/mcp?...`

## Errors
If `:service` is not configured, return `404` with a JSON body:
- `{ ok: false, error: "unknown_mcp_service", service }`

## Backwards compatibility
Keep existing `/api/mcp/*` route mapping to `mcp-fs-oauth` until all clients/workflows migrate.


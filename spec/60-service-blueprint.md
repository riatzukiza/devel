# MCP Migration Spec — Service Blueprint

This describes the expected structure and behavior for each `services/mcp-*` service.

## Directory layout
```
services/mcp-<name>/
  src/
    main.ts
    tools/
  package.json
  tsconfig.json
  config/
```

## Runtime contract
- HTTP server exposes:
  - `GET /health` → `{ ok: true, service: "mcp-<name>" }`
  - MCP at `/mcp`:
    - `POST /mcp` (JSON body)
    - `GET /mcp` (session)
    - `DELETE /mcp` (session)

- Required headers:
  - forward/echo `mcp-session-id`
  - support `text/event-stream` streaming

## Auth
- Apply bearer middleware to `/mcp` routes.
- Allow local bypass only for loopback-only traffic (see `spec/40-auth-and-trust.md`).

## Tool registration
- Register tools with stable IDs (see `spec/10-tool-inventory.md`).
- Add aliases where required (see `spec/50-tool-id-compat.md`).

## Shared code
Prefer shared packages over copy/paste:
- `@workspace/mcp-runtime` for HTTP router and server helpers
- `packages/mcp-auth` for bearer verification

## Operational notes
- Keep logs structured and include correlation ids from gateway.
- Keep timeouts consistent with gateway proxy behavior (gateway uses 30s upstream timeout).


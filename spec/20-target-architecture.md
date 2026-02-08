# MCP Migration Spec — Target Architecture

## High-level
- `services/api-gateway` is the **only** public entrypoint.
- Each tool family runs in a separate MCP service `services/mcp-*`.
- OAuth endpoints are served only by `services/mcp-fs-oauth`.

## Routing contract
- OAuth + well-known endpoints remain at gateway root and proxy to `mcp-fs-oauth`.
- MCP tool invocations route via:
  - `/api/mcp/:service/*` → `services/mcp-:service`

## Services
Suggested split:
- `mcp-fs-oauth` (OAuth issuer + optionally FS + discovery tools)
- `mcp-files` (FS tools, with legacy alias support)
- `mcp-github` (GitHub tools)
- `mcp-process` (process manager tools)
- `mcp-devtools` (pnpm/nx/apply_patch)
- `mcp-tdd` (tdd tools)
- `mcp-sandboxes` (sandbox tools)
- `mcp-ollama` (ollama tools)
- `mcp-exec` (exec tools; optional if kept in fs-oauth)

## Common service contract
Every `services/mcp-*` service should:
- Expose `/health`.
- Expose MCP HTTP at `/mcp`.
- Support MCP streaming responses (`text/event-stream`) and `mcp-session-id` header.
- Enforce auth for non-local traffic (see `spec/40-auth-and-trust.md`).

## Shared packages
To preserve “Promethean MCP as a spec” while splitting services, extract common logic into packages:
- `packages/mcp-core` (registry, transports, server bootstrap)
- `packages/mcp-spec` (workflow composition/spec logic, validation, packaging)
- `packages/mcp-auth` (bearer verification shared across services)



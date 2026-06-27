# Security audit exposure report — 2026-05-12

## Summary

Priority finding: Knoxx's MCP HTTP server path inherits `hono` through `@modelcontextprotocol/sdk`, and that surface is actively exposed to third-party clients such as Perplexity. Because Knoxx registers live `/mcp` and MCP OAuth routes and MCP is enabled by default unless `MCP_ENABLED=false`, this is the highest-priority audit issue.

Secondary note: the `marked` issue in OpenPlanner public garden rendering is currently lower-risk because only trusted users can publish garden content.

Most other findings from `pnpm audit` were either:
- already resolved in current lockfiles,
- dev/build-time only,
- or transitive packages without a demonstrated high-risk reachable path in current code.

## Priority decision

Treat the Knoxx MCP/Hono issue as the immediate remediation target.

Backlog everything else for later review, with the `marked` issue explicitly downgraded because publication is trusted-only.

## Evidence

### Knoxx MCP exposure is real

Knoxx backend registers MCP server routes in live runtime:
- `packages/agents/knoxx/backend/src/cljs/knoxx/backend/bootstrap.cljs`
- `packages/agents/knoxx/backend/src/cljs/knoxx/backend/routes/mcp.cljs`

MCP is enabled unless explicitly disabled:
- `packages/agents/knoxx/backend/src/cljs/knoxx/backend/runtime/config.cljs`
  - `:mcp-enabled (not= (env "MCP_ENABLED" "false") "false")`

Knoxx exposes:
- `POST /mcp`
- `GET /mcp`
- `DELETE /mcp`
- MCP OAuth registration/authorize/token endpoints

### Vulnerable transitive dependency path

Runtime dependency chain in Knoxx backend:
- `@modelcontextprotocol/sdk@1.29.0`
- `@hono/node-server@1.19.x`
- `hono@4.12.12` or `4.12.14` depending on lockfile scope

Observed in lockfiles and dependency resolution:
- `packages/agents/knoxx/backend/pnpm-lock.yaml` resolved `hono@4.12.12`
- `packages/agents/knoxx/pnpm-lock.yaml` resolved `hono@4.12.14`
- `pnpm why` from Knoxx backend confirmed `@modelcontextprotocol/sdk -> hono`

Patched target from advisory family:
- `hono >= 4.12.18`

## Non-priority findings

### Marked in public garden rendering

OpenPlanner renders public garden HTML using `marked`:
- `src/routes/v1/public.ts`
- `src/lib/garden-renderer.ts`

Risk is currently reduced because only trusted users can publish garden content.

### Findings already effectively patched in resolved lockfiles

Knoxx frontend:
- `postcss@8.5.10`
- `vite@5.4.21`

These were flagged in audit output but resolved versions are already at or above patched ranges.

### Findings deprioritized to backlog

Backlog bucket includes:
- Nodemailer issues in Knoxx invite/email tooling
- Fastify / fast-uri issues outside the MCP priority
- protobuf / `@protobufjs/utf8`
- `@anthropic-ai/sdk`
- AWS XML builder chain
- `ip-address`
- remaining audit noise across unrelated packages

## Remediation taken

Added a root pnpm override to force patched Hono across the workspace:

```json
"pnpm": {
  "overrides": {
    "hono": "^4.12.18"
  }
}
```

File changed:
- `package.json`

## Recommended verification after install

Run after lockfile refresh/install:
- `pnpm install`
- `pnpm why hono @modelcontextprotocol/sdk --filter @open-hax/knoxx-backend-cljs`
- `pnpm audit`
- Knoxx backend type/build smoke tests

Success condition:
- Knoxx runtime resolves `hono >= 4.12.18`
- MCP routes still build and run correctly
- audit no longer reports the Hono advisories on the Knoxx MCP path

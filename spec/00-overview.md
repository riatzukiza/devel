# MCP Migration Spec — Overview

## Goal
Migrate the legacy monolith at `orgs/riatzukiza/promethean/services/mcp` into a set of `services/mcp-*` services, all proxied behind `services/api-gateway`, **excluding OAuth**, which remains in `services/mcp-fs-oauth`.

This migration must preserve:
- Tool behavior and schemas
- Tool IDs referenced by workflows (or provide compatibility aliases)
- The “Promethean MCP” idea: **a spec for composing workflows/tools and packaging them as MCP servers**, not just “an MCP server.”

## Current state
- `services/api-gateway` proxies MCP as a single upstream (`MCP_FS_OAUTH_URL`) via `/api/mcp/*` and proxies OAuth endpoints at the gateway root (e.g. `/authorize`, `/token`) to the same upstream.
- `services/mcp-fs-oauth` implements OAuth + an MCP server at `/mcp`.
- `services/mcp-files` exists and provides `fs_*` tools, but currently runs auth-free.
- Legacy monolith contains many tool families (`github_*`, `process_*`, `pnpm_*`, `tdd_*`, `ollama_*`, etc.) and also a proxy/spec layer for composing toolsets and exporting them via endpoints.

## Target state
- `services/api-gateway` becomes a **mux**: routes `/api/mcp/:service/*` to different upstream `services/mcp-*`.
- `services/mcp-fs-oauth` is the **only** service that exposes OAuth endpoints.
- Other `services/mcp-*` validate MCP bearer tokens (or trust a gateway-asserted identity) and expose MCP at `/mcp`.

## Non-goals
- Rewriting workflows/spec semantics.
- Changing public OAuth behavior.

## Deliverables
- `spec/*.md` documents (this set)
- Gateway mux implementation
- New `services/mcp-*` services extracted from the monolith
- Compatibility plan for tool IDs
- Test plan + rollout plan

# MCP Migration Spec — Open Questions

## 1) Auth model
- Are MCP bearer tokens JWT or opaque?
- If opaque, where does introspection live (oauth service vs shared store)?

## 2) File tool ID canonicalization
- Do we standardize on `fs_*` or `files_*` long term?
- Timeline for deprecating legacy IDs?

## 3) Promethean MCP spec/runtime extraction
- Which parts of the monolith are considered the “spec” layer vs tool implementations?
- Do we need a dynamic registry/orchestrator service, or is static toolpack-per-service sufficient?

## 4) Exec hardening
- Do we keep `exec_*` in `mcp-fs-oauth` or isolate into `mcp-exec`?
- Allowlist policy and audit trail requirements.

## 5) Gateway routing conventions
- Should the public path be `/api/mcp/:service/*` only, or do we support additional aliases?

## 6) Stdio proxies
Legacy monolith supports stdio proxy specs (`mcp_servers.edn`).
- Do we continue supporting this via a dedicated service?
- Or translate proxies into first-class `services/mcp-*` deployments?


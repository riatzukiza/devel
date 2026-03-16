# MCP Migration Spec — Open Questions Resolution (2026-02-08)

This file records concrete decisions for the open questions listed in `spec/90-open-questions.md`.

## 1) Auth model

- **Decision**: Use gateway-asserted identity for split `services/mcp-*` behind internal trust boundaries.
- **Mechanism**:
  - Gateway signs `x-mcp-gateway-ts` and `x-mcp-gateway-sig` using `MCP_INTERNAL_SHARED_SECRET`.
  - Downstream services verify signature and timestamp window.
  - Local loopback bypass remains available with `ALLOW_UNAUTH_LOCAL=true`.
- **Reasoning**: Matches existing gateway behavior that skips `/mcp` bearer validation and keeps OAuth behavior pinned to `mcp-fs-oauth`.

## 2) File tool ID canonicalization

- **Decision**: Canonical IDs are `fs_*`; keep `files_*` aliases during migration.
- **Current mapping**:
  - `files_list_directory` -> `fs_list`
  - `files_view_file` -> `fs_read`
  - `files_write_content` -> `fs_write`
  - `files_write_lines` -> line-edit wrapper on `fs_write`
  - `files_tree_directory` -> `fs_tree`
  - `files_search` -> `fs_search`

## 3) Promethean MCP spec/runtime extraction

- **Decision**: Use static toolpack-per-service at gateway mux level in this migration wave.
- **Implementation**:
  - Added shared `packages/mcp-family-proxy` for reusable split-service runtime behavior.
  - Service families are exposed via dedicated `services/mcp-*` entries.

## 4) Exec hardening

- **Decision**: Isolate exec into `mcp-exec` service boundary (scaffolded).
- **Policy**: Continue existing allowlist behavior in legacy tool implementations while migration proxy path is active.

## 5) Gateway routing conventions

- **Decision**: Canonical routing is `/api/mcp/:service/*`.
- **Compatibility**: Keep legacy `/api/mcp/*` route pinned to `mcp-fs-oauth` during cutover.

## 6) Stdio proxies

- **Decision**: Keep stdio proxy support in legacy monolith during this migration phase.
- **Follow-up**: Reevaluate conversion to first-class `services/mcp-*` deployments after tool-family source extraction is complete.

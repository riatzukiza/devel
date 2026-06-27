# MCP Migration Spec — Migration Steps

## Phase 0 — Prep
- Land this spec and agree on service boundaries.
- Decide auth model: downstream bearer validation (preferred) vs gateway-asserted identity.

## Phase 1 — Gateway mux
1. Add `MCP_SERVICE_URLS` config.
2. Add new gateway route: `/api/mcp/:service/*`.
3. Keep root OAuth routes pinned to `mcp-fs-oauth`.
4. Keep legacy `/api/mcp/*` → `mcp-fs-oauth` during cutover.

## Phase 2 — Harden mcp-files
- Add auth.
- Add legacy aliases (`files_*` → `fs_*`).
- Route it via gateway: `/api/mcp/files/*`.

## Phase 3 — Extract tool families into services
Recommended order:
1. `mcp-github`
2. `mcp-process`
3. `mcp-devtools`
4. `mcp-tdd`
5. `mcp-sandboxes`
6. `mcp-ollama`
7. `mcp-exec` (last)

For each service:
- Scaffold from the blueprint.
- Move tool implementations from monolith.
- Preserve tool IDs.
- Add it to `MCP_SERVICE_URLS`.
- Add smoke tests.

## Phase 4 — Decommission legacy usage
- Update workflow/spec configs to prefer canonical IDs.
- Turn on warnings for legacy IDs.
- Remove legacy `/api/mcp/*` route if desired.


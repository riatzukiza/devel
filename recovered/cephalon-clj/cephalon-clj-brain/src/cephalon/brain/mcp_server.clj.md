# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/mcp_server.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/2026-01-29-cephalon-mcp-subcommands.md` (lines 17-19, 24-27): MCP server implementation for `cephalon mcp serve`; uses toolsets similar to Duck/OpenSkull.

## Observed behavior (from specs)
- Starts an MCP server and exposes Duck/OpenSkull tool lists.
- Reads Discord token from `DISCORD_TOKEN` with `OPENHAX_DISCORD_TOKEN` fallback.

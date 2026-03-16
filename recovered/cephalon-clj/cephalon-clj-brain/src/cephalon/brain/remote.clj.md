# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/remote.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/2026-01-27-duck-context-protocol.md` (lines 13-14): `def-remote-tool` macro (Discord tool call RPC wrapper).
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 9, 24-27): Wraps RPC calls with `def-tool` from the bench-tools DSL; remote tools include bench case metadata.

## Observed behavior (from specs)
- Defines a macro to wrap remote (RPC) tool calls.
- Uses the shared bench-tools DSL (`def-tool`) for registration and schema conversion.
- Intended to connect Discord tool calls to the RPC transport layer.

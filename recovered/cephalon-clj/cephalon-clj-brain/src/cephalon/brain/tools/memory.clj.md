# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/tools/memory.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 10-27): Memory tools registered via shared bench-tools DSL.
- `spec/2026-01-27-duck-context-protocol.md` (lines 86-92): Memory tool list (facts/active add/remove/search).

## Observed behavior (from specs)
- Registers memory tool definitions in the shared registry.
- Expected tool names include:
  - `memory.facts.add`
  - `memory.facts.remove`
  - `memory.facts.search`
  - `memory.active.add`
  - `memory.active.remove`

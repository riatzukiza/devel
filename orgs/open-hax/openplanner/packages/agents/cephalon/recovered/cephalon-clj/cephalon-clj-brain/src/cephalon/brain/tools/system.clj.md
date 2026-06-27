# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/tools/system.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 10-27): System tools registered via shared bench-tools DSL.
- `spec/2026-01-27-duck-context-protocol.md` (lines 54-63): System health tool list (gpu/cpu/ram/storage, score, ollama ps/ls/select-default-model).

## Observed behavior (from specs)
- Defines system health tool registrations in the shared registry.
- Expected tool names include:
  - `system.health.stats.gpu`
  - `system.health.stats.cpu`
  - `system.health.stats.ram`
  - `system.health.stats.storage`
  - `system.health.score`
  - `system.ollama.ps`
  - `system.ollama.ls`
  - `system.ollama.select-default-model`

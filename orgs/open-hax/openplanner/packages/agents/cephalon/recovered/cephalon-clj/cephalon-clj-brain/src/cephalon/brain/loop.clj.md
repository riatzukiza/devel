# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/loop.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 8, 23-24, 40): Tool loop tick runner; autonomous loop tick invokes `agents/run!` with a synthetic user message.

## Observed behavior (from specs)
- Provides a timer-driven "autonomous loop tick".
- Calls `promethean.ollama.agents/run!` with a synthetic message such as "Autonomous loop tick".
- The loop is per-tick and not a persistent session manager.

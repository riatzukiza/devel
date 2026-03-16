# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/context.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/2026-01-27-duck-context-protocol.md` (lines 11-12): Context builder concatenates history into a single user message.
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 12, 28): Context assembly is a single "user" message with history concatenated; no pruning beyond count-based trimming.

## Observed behavior (from specs)
- Builds context by concatenating conversation history into a single user message.
- Context pruning is minimal (count-based trimming only).
- No tool-call pruning or tiered memory logic in the described baseline.

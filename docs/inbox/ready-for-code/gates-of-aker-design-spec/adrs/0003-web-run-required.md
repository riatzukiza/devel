
# ADR-0003: Require web.run for time-sensitive or uncertain claims

Date: 2026-02-09

## Status
Accepted

## Context
Many facts change rapidly. Relying on memory is unsafe for up-to-date queries.

## Decision
Trigger a web browsing gate whenever freshness/uncertainty is material.

## Consequences
- Fewer stale answers.
- Slightly more tool usage; mitigated by tool-minimality gate.

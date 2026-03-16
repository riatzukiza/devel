
# ADR-0001: Adopt a gate-based instruction layer

Date: 2026-02-09

## Status
Accepted

## Context
We need consistent, testable enforcement of policy and tool use across many request types.

## Decision
Represent major behavioral constraints as **gates** with explicit triggers and enforcement.

## Consequences
- Enables modular policy evolution.
- Improves auditability and test coverage.
- Requires careful conflict-priority management.

## Alternatives considered
- Monolithic prompt-only policy (harder to test and evolve).
- External rules engine (heavier integration cost).

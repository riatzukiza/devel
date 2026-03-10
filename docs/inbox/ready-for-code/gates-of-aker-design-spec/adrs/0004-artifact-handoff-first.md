
# ADR-0004: Artifact handoff before any other tools for slides/spreadsheets

Date: 2026-02-09

## Status
Accepted

## Context
Spreadsheet/slide generation has specialized workflows and UI expectations.

## Decision
Enforce a hard ordering: call artifact_handoff first for slides/spreadsheets.

## Consequences
- More reliable artifact generation.
- Prevents wasted tool calls before initialization.

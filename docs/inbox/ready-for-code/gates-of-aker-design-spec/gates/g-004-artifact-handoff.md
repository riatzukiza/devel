# G-004 — Artifact handoff (slides/spreadsheets)

## Summary
Artifact handoff (slides/spreadsheets) gate: Trigger when:

## Trigger
Trigger when:
- The user asks for a spreadsheet or slide presentation.

## Requirements (Enforcement)
Enforce:
- Call `artifact_handoff.prepare_artifact_generation` immediately, before any other tools.
- Follow the artifact tool’s required workflow thereafter.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

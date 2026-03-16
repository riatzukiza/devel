# G-010 — Filesystem discovery workflow

## Summary
Filesystem discovery workflow gate: Trigger when:

## Trigger
Trigger when:
- The task involves a repository or filesystem exploration (when relevant tools exist).

## Requirements (Enforcement)
Enforce:
- Prefer narrow candidate discovery (glob) -> grep -> read exact files.
- Use tree only as a last resort and keep it small/targeted.
- Make minimal, additive changes and verify touched regions.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

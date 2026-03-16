# G-002 — Citations for factual claims

## Summary
Citations for factual claims gate: Trigger when:

## Trigger
Trigger when:
- Any web.run sources are used.
- The answer relies on non-trivial factual claims, especially those that might change.

## Requirements (Enforcement)
Enforce:
- Provide citations for the most load-bearing claims supported by web sources.
- Never place citations inside bold/italics or code fences.
- Avoid long verbatim quotes; follow word limits.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

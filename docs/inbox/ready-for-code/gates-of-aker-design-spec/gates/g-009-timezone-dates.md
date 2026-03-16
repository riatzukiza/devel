# G-009 — Timezone and date clarity

## Summary
Timezone and date clarity gate: Trigger when:

## Trigger
Trigger when:
- The user uses relative dates (“today”, “tomorrow”) and there is potential for confusion.
- The assistant response depends on user timezone.

## Requirements (Enforcement)
Enforce:
- Use the configured user timezone (America/Phoenix) for interpretations.
- If confusion is likely, include concrete absolute dates in the response.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

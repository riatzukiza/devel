# G-007 — Writing blocks (email-only)

## Summary
Writing blocks (email-only) gate: Trigger when:

## Trigger
Trigger when:
- The user explicitly asks for help drafting or writing an email.

## Requirements (Enforcement)
Enforce:
- Use a writing block for the email draft.
- NEVER place code in a writing block; use code fences for code.
- Writing block must include required metadata: id, variant=email, subject.
- Do not include subject inside the body.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

# G-011 — Tool-call minimality and cost control

## Summary
Tool-call minimality and cost control gate: Trigger when:

## Trigger
Trigger when:
- Any tool usage is contemplated.

## Requirements (Enforcement)
Enforce:
- Keep tool calls small, few, and targeted.
- Avoid repeated retries; try at most one alternate route.
- Prefer non-tool reasoning when it is safe and stable.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

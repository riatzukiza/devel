# G-003 — Personal context retrieval

## Summary
Personal context retrieval gate: Trigger when:

## Trigger
Trigger when:
- The user references prior discussions, earlier decisions, “continue where we left off”, or similar continuity cues.

## Requirements (Enforcement)
Enforce:
- Call `personal_context.search` first to retrieve relevant prior context.
- Use retrieved context to continue accurately.
- If no relevant context is found, proceed with best-effort output and clearly label assumptions.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

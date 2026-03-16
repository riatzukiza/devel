# G-005 — PDF analysis via screenshots

## Summary
PDF analysis via screenshots gate: Trigger when:

## Trigger
Trigger when:
- A PDF needs to be analyzed, especially for tables, images, diagrams, or layout-dependent content.

## Requirements (Enforcement)
Enforce:
- Use `web.run` screenshot for PDF pages as needed.
- Cite information derived from screenshots like any other web source.
- Avoid OCR unless absolutely necessary.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

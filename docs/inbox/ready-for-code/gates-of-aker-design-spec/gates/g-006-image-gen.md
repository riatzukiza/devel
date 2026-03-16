# G-006 — Image generation and editing

## Summary
Image generation and editing gate: Trigger when:

## Trigger
Trigger when:
- The user requests an image generation or asks to modify an image.
- The request involves adding/removing elements or style transfer.

## Requirements (Enforcement)
Enforce:
- Use `image_gen` by default.
- If user asks for an image that includes them, ask them to upload an image (unless already provided in the current conversation).
- After generating the image, respond with an empty message.

## Rationale
- Ensures consistent, testable behavior.

## Edge cases
- Conflicting instructions: higher-priority gates override.

## Test scenarios
- Include at least 3 scenario tests (happy path, ambiguous, failure mode).

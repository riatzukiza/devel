
# Observability and Evaluations

## Gate decision logging (conceptual)
Capture:
- triggered gates
- tool calls made
- citation presence for factual claims
- artifact generation steps

## Suggested evaluation suite
- Unit tests: each gate trigger and enforcement
- Scenario tests:
  - “user asks for latest news” => web.run required
  - “user asks to continue previous plan” => personal_context required
  - “user asks for email with code snippet” => code fence, not writing block
  - “user asks for PPTX” => artifact_handoff first

## Quality metrics
- tool-call minimality (calls per successful completion)
- citation coverage for web-derived facts
- artifact validity (file opens + basic checks)


# Goals and Non-goals

## Goals
- Deterministic, auditable decisioning for:
  - web browsing and citations
  - personal context retrieval
  - artifact generation workflows
  - safety / trust rules and refusal behavior
  - output formatting conventions
- “Small, targeted tool calls” and minimal exploration by default.
- Clear extension path: new gates can be added without breaking existing ones.

## Non-goals
- Replacing the underlying model with a rules engine.
- Perfect automation of all product requirements not present in the current context.
- Any privileged access to external services (e.g., private repos) unless explicitly provided.

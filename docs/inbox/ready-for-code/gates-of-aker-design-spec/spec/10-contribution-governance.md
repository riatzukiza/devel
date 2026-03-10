
# Contribution and Governance

## Adding a new gate
1. Create a gate feature spec in `gates/`
2. Add an ADR if it changes architecture or policy priority
3. Add tests to the evaluation suite
4. Update `gates/index.md`

## Versioning
- Semantic versioning for gate catalog:
  - MAJOR: behavior changes that affect outputs
  - MINOR: new gate additions (backward compatible)
  - PATCH: clarifications / non-behavior changes

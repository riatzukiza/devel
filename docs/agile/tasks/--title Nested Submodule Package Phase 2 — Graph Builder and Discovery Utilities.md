# Phase 2 — Graph Builder and Discovery Utilities

## Objective
Implement the manifest loader, dependency graph resolver, and repository discovery tooling that power every CLI command.

## Key Tasks
- Build TypeScript modules to parse manifests, apply defaults, and validate relationships.
- Implement repository graph construction with cycle detection and depth-aware traversal APIs.
- Add workspace scanners that reconcile actual `.git` state with the manifest and raise drift warnings.
- Cache graph metadata for fast re-runs and support selective invalidation on manifest edits.

## Deliverables
- Graph library with unit tests covering cycles, missing nodes, and depth filters.
- CLI utilities (`nss repo list`, `nss repo info`) to inspect manifest-derived data.
- Integration tests exercising complex nested structures from the devel workspace.

## Exit Criteria
- Graph builder handles >100 repositories without exceeding performance budget.
- Drift detection correctly flags at least five curated mismatch scenarios.

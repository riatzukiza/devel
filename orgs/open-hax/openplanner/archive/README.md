# archive/

Frozen and legacy code. Preserved for reference and historical context.

Packages here are **not in `pnpm-workspace.yaml`** and are excluded from
`pnpm -r build` and `pnpm -r test` by default.

## What belongs here

- Deprecated services superseded by newer implementations
- Legacy code kept for data migration or reference
- Packages that no longer run independently

## What does NOT belong here

- Active production code → move to `packages/`
- Scratch/experimental code → move to `pseudo/`

## Current contents

| Directory | Status | Notes |
|-----------|--------|-------|
| `embedding/` | frozen | Legacy embedding service |
| `persistence/` | frozen | Legacy persistence layer |
| `reconstituter/` | frozen | Session reconstitution |
| `semantic-graph-builder/` | frozen | Legacy graph builder |

# Phase 1 — Requirements and Manifest Schema

## Objective
Establish the authoritative manifest specification that captures repository topology, authentication hints, bootstrap hooks, and environment profiles for deeply nested submodules.

## Key Tasks
- Audit representative worktrees to confirm manifest coverage (paths, remotes, sparse rules, hooks).
- Define schema (YAML + JSON) and validation rules with TypeScript types and Zod validators.
- Prototype manifest generator that imports `.gitmodules` data and prompts for missing metadata.
- Document configuration conventions, environment overrides, and secrets handling strategy.

## Deliverables
- Schema document and TypeScript definitions committed to repo.
- CLI spike (`nss manifest init`) that scaffolds a manifest from an existing workspace.
- Playbook describing how to extend or override manifest entries.

## Exit Criteria
- Manifest validates against 3+ real repositories in the workspace.
- Stakeholders sign off on schema coverage for bootstrap, sync, and commits.

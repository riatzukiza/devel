# Phase 6 — Packaging and Distribution

## Objective
Ship the package with reproducible builds, installer automation, and CI/CD pipelines that verify functionality across environments.

## Key Tasks
- Package CLI for npm and Bun with semantic versioning, changelog automation, and release scripts.
- Build container images (ghcr) bundling git, SSH agent support, and the CLI for portable execution.
- Integrate bootstrap/sync smoke tests into CI (GitHub Actions) with matrix coverage (linux/mac/windows).
- Produce new-machine onboarding installer (`curl | bun x nss bootstrap`) with dependency checks and telemetry opt-in.

## Deliverables
- Published packages and container images with signed artifacts.
- CI pipelines passing across target environments and validating core scenarios.
- Onboarding guide and automation scripts for fresh workstation setup.

## Exit Criteria
- Release v0.1.0 succeeds end-to-end with tagged artifacts and release notes.
- Fresh-machine bootstrap completes in <15 minutes using installer workflow.

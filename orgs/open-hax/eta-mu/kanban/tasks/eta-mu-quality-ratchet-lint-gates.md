---
uuid: "eta-mu-quality-ratchet-lint-gates"
title: "Eta-mu Quality Ratchet — Lint and Static Gates"
status: todo
priority: P1
labels: ["tasks", "quality", "lint", "format", "ci", "5sp"]
created_at: "2026-05-31T00:45:00Z"
source: "kanban/epics/eta-mu-quality-ratchet.md"
points: 5
category: tasks
---

# Eta-mu Quality Ratchet — Lint and Static Gates

> Parent epic: `kanban/epics/eta-mu-quality-ratchet.md`
> Points: 5

## Purpose

Make lint/static checks discoverable, reproducible, and CI-owned inside eta-mu instead of relying on ad hoc agent memory.

## Scope

- TypeScript lint/static checks available in this repo
- markdown/frontmatter hygiene for kanban/docs
- GitHub workflow linting
- package metadata checks for extension paths and exports
- CLJS boundary scanner integration where it already exists

## Work items

- [ ] Inventory existing lint/static tooling and gaps.
- [ ] Add or normalize repo-local scripts for lint/static gates without importing unrelated workspace assumptions.
- [ ] Add a workflow lint path, either as documented optional host-local check or devDependency-backed script.
- [ ] Wire CLJS boundary/static checks into the relevant package gate.
- [ ] Document what is intentionally out of scope for this pass.

## Acceptance criteria

- [ ] A developer can run one documented command for eta-mu static quality checks.
- [ ] CI runs the same command or equivalent named steps on PRs.
- [ ] Kanban/docs markdown changed in this epic remains parseable by `eta-mu kanban` tooling.
- [ ] No broad formatting churn or unrelated file rewrites are included.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm --dir packages/eta-mu-runtime cljs:boundary
# plus the new lint/static command added by this task
git diff --check
```

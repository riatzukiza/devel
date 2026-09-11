# Agent Skills Context

## RELEVANT SKILLS
These skills are configured for this directory's technology stack and workflow.

### testing-general
Apply testing best practices, choose appropriate test types, and establish reliable test coverage across the codebase

### workspace-code-standards
Apply workspace TypeScript and ESLint standards, including functional style and strict typing rules

### workspace-lint
Lint all TypeScript and markdown files across the entire workspace, including all submodules under orgs/**

### workspace-typecheck
Type check all TypeScript files across the entire workspace, including all submodules under orgs/**, using strict TypeScript settings

## Device federation (device/yoga)

This root repo (`riatzukiza/devel`) is a **submodule-of-home superproject** member:
the workspace lives inside the home superproject on device-scoped branches, and this
repo's own device branch is **`device/yoga`**.

**Device branch law**

- Work at the root happens on `device/yoga` (created from `main` with WIP carried
  across). Do not switch branches casually; do not amend or force-push.
- Device branches are the staging surface; promotion to `main` is a separate,
  deliberate act.

**Known issue — `.gitmodules` / index drift**

`.gitmodules` maps a subset of the submodule topology while the index carries
gitlinks that have no mapping. As a result:

```
fatal: no submodule mapping found in .gitmodules for path 'orgs/octave-commons/bitch-tracker'
```

`git submodule status` fails with the above error. This is a **documented known
issue** (see `GIT_MODULE_INDEX.md` for the mapped/unmapped inventory). Do not attempt
to repair the mapping as a side effect of unrelated work; submodule surgery is its
own task with its own review.

**Root-ops rule: do not recurse into orgs/ dirt**

When running root-level operations (status sweeps, commits, lint, doc work, fork-tax
snapshots), **do not recurse into `orgs/**` working trees** to clean, stage, or
"fix" uncommitted dirt. Each org repo is independently owned with its own branch
law; root ops only touch root-owned files. Explicit-path staging only.

---
uuid: "ad8b6eaa-d93b-48a8-a957-26b476992653"
title: "Bin scripts doc review (2025-11-19)"
slug: "2025-11-19-bin-doc-review"
status: "icebox"
priority: "P2"
labels: ["bin", "scripts", "review", "doc"]
created_at: "2026-02-03T06:36:00.407448Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# Bin scripts doc review (2025-11-19)

## Objective
Review `bin/` scripts and ensure `README.md` and `AGENTS.md` accurately describe available tooling and behaviors.

## Files reviewed
- `bin/create-command` (NBB helper to create/list/run OpenCode commands)
- `bin/opencode-command` (wrapper invoking `create-command` with NODE_PATH set)
- `bin/fix-submodules` (Bun script to convert nested repos to submodules under a GitHub org)
- `bin/github-transfer-submodules` (GH CLI transfer of submodule repos to a target org)
- `bin/init-pnpm-submodules` (initializes non-git pnpm packages, creates GitHub repos under `GITHUB_OWNER`, pushes, adds as submodules)
- `bin/install-pre-push-hooks.sh` (installs `.hooks/pre-push-typecheck.sh` into root + all submodules; appends `.nx/` to excludes)
- `bin/setup-branch-protection` (applies baseline branch protection to all GitHub-backed submodules; optional `ALSO_DEV=true`; `--dry-run` supported)
- `bin/giga-commit`, `bin/giga-nx-generate`, `bin/giga-watch`, `bin/pantheon-commit-msg` (Bun wrappers to scripts in `src/giga/*`)
- `bin/submodule` (Commander-based CLI: `sync`, `update`, `status`, legacy aliases, `smart commit`)
- Legacy wrappers: `bin/submodules-sync`, `bin/submodules-update`, `bin/submodules-status`

## Documentation deltas needed
- Document workspace bin utilities (branch protection, pre-push hook installer, nested repo fixer, submodule transfer, pnpm-init helper) in `README.md` and `AGENTS.md`.
- Capture cautions around GitHub CLI permissions and default behaviors (`ALSO_DEV`, `GITHUB_OWNER`, private repos, commits made by scripts).

## Definition of done
- README and AGENTS list the available bin utilities with accurate one-line behaviors and flags.
- Notes include prerequisites/side effects (e.g., gh authentication, pushes/commits performed, --dry-run for branch protection).
- No changes required to the scripts themselves; docs align with current implementations.

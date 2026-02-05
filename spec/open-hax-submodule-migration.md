---
uuid: 82adbcd5-f93d-450d-90d0-1c2370f039a1
title: "Spec: Commit Open Hax Codex Migration Changes"
slug: open-hax-submodule-migration
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.408448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Spec: Commit Open Hax Codex Migration Changes

## References
- `.gitmodules:33-43` — adds the `orgs/open-hax/codex` submodule entry replacing the older numman-ali path.
- `AGENTS.md:59-104` — updates repository index & authentication pointers to reference `orgs/open-hax/codex`.
- `README.md:31-407` — refreshes workspace table/sections so the auth plugin lives under `orgs/open-hax/codex`.
- `REPOSITORY_INDEX.md:9-140` — swaps catalog entries and quick-start commands to the Open Hax repo.
- `docs/MASTER_CROSS_REFERENCE_INDEX.md:12-139` — changes cross-reference listings and diagrams to point at the new location.
- `docs/agile/reports/nested-submodule-manifest-survey.md:9-16` — manifest table now lists the Open Hax remote.
- `docs/agile/tasks/epic-codex-opencode-integration.md:10-14` — keeps task references accurate for the plugin name.
- `docs/manifests/*-manifest-2025-11-06.md` — updates GitHub manifest inventories for the Open Hax move.
- `docs/reports/research/git-submodules-documentation.md:10-277` — documentation describing authentication submodules updated to Open Hax.
- `docs/reports/submodules-recursive-status-2025-11-13.md:9-83` — latest summary now tracks `orgs/open-hax/codex`.
- `docs/worktrees-and-submodules.md:145-152` — per-module update strategy now references the new submodule name.
- `graph.json:2011-2035` & `out.json:2011-2035` — Nx virtual project renamed to `orgs-open-hax-codex` pointing to `orgs/open-hax/codex`.
- `projects/orgs-open-hax-codex/project.json:1-27` — new Nx project for the submodule (paired with deletion of `projects/orgs-numman-ali-opencode-openai-codex-auth/project.json`).
- `tools/nx-plugins/giga/deps.json:2-7` — dependency map linked to `orgs/open-hax/codex` instead of the previous org path.
- `docs/reports/open-hax-vs-numman-codex.md:1-45` — new comparison report requested earlier.
- `spec/opencode-codex-comparison.md` — prior spec capturing comparison scope; intersects with this migration effort.

## Existing Issues / PRs
- `open-hax/codex` open issues (#4–#6) focus on cache metrics & prompt-cache overrides (see `gh issue list --repo open-hax/codex --limit 3`).
- `numman-ali/opencode-openai-codex-auth` open items include #38 (GPT-5.1) and #36 (Codex-mini bug) plus PRs #39/#37 (config updates), tracked during the earlier comparison.

## Requirements
1. Stage all tracked modifications that move references from `orgs/numman-ali/opencode-openai-codex-auth` to `orgs/open-hax/codex`, including `.gitmodules`, documentation, manifests, Nx metadata, and tool configs.
2. Add the new Nx project definition `projects/orgs-open-hax-codex/project.json` and remove the legacy `projects/orgs-numman-ali-opencode-openai-codex-auth/project.json`.
3. Include the newly authored comparison report `docs/reports/open-hax-vs-numman-codex.md` and its supporting spec `spec/opencode-codex-comparison.md`.
4. Structure commits so each logical area (submodule config, workspace docs, Nx/tooling metadata, reports/specs) has a focused message describing the affected files.
5. Ensure no unrelated untracked directories (e.g., `orgs/numman-ali-other-guy/*`) are accidentally staged.

## Definition of Done
- Commits exist for: (a) submodule + Nx metadata rename, (b) documentation/manifests updates, (c) new comparison report/spec artifacts (and any other targeted areas with clear scope).
- `git status` clean aside from intentionally ignored/untracked directories noted above.
- Commit messages describe the files/areas touched.
- Instructions satisfied (plan + spec + staged commits w/ targeted scope).

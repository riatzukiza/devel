---
uuid: c1f5f0bb-51dd-4e45-bb9e-57ac32b43b5f
title: "Add all riatzukiza, octave-commons, and open-hax repositories as submodules"
slug: add-all-riatzukiza-octave-open-hax-submodules
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.407448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Add all riatzukiza, octave-commons, and open-hax repositories as submodules

## Context
- Request: clone as submodules all repositories owned by `riatzukiza`, `octave-commons`, and `open-hax` under `orgs/<org-name>/`.
- Current submodules cover some repos for these orgs (e.g., `orgs/riatzukiza/*`, `orgs/open-hax/codex`, `orgs/open-hax/openhax`, `orgs/open-hax/plugins/codex`). Need to enumerate missing ones.
- Relevant files: `.gitmodules` for submodule definitions; directories under `orgs/`.

## Plan / Tasks
1. Pull repository lists for GitHub orgs `riatzukiza`, `octave-commons`, `open-hax` (use `gh repo list <org>`).
2. Cross-check against existing submodules/directories under `orgs/<org>/` to find missing repositories.
3. Add each missing repository as a submodule in `orgs/<org>/<repo>` using `git submodule add` with appropriate URLs and default branch.
4. Update `.gitmodules` and ensure submodules initialized with correct paths and commits.
5. Validate `git submodule status` is clean and document results.

## Findings
- Current submodules for target orgs: `riatzukiza` (9), `open-hax` (7, includes historical paths like `cli-client` and `session-orchestrator`), `octave-commons` (0).
- Remote repos detected via `gh repo list`: `riatzukiza` (142), `open-hax` (5), `octave-commons` (77).
- Missing counts if cloning all: `riatzukiza` (135 repos), `open-hax` (3 repos: `agent-actors`, `clients`, `workbench`), `octave-commons` (77 repos).
- Adding all would introduce 200+ new submodules; some repos may be private or deprecated, and `.gitmodules` already has duplicate entries for `riatzukiza/openhax`.

## Definition of Done
- All repositories belonging to `riatzukiza`, `octave-commons`, and `open-hax` are present as submodules under `orgs/<org-name>/`.
- `.gitmodules` reflects all added submodules with correct URLs and paths.
- `git submodule status` shows no missing or uninitialized submodules; initial commits checked out.
- Notes captured in this spec and todo list updated.

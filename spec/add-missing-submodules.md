---
uuid: 0884f18e-6c80-44da-8ee2-d53834425890
title: "Add Missing Nested Git Repositories As Submodules"
slug: add-missing-submodules
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
# Add Missing Nested Git Repositories As Submodules

## Context
- `.gitmodules:1-43` lists 14 existing submodules but omits other nested Git repositories.
- `glob **/.git/HEAD` surfaced standalone Git repositories that live inside the workspace but are not tracked as submodules:
  - `.emacs.d` → `https://github.com/syl20bnr/spacemacs` (`.emacs.d/.git/config:1-11`).
  - `.config/alacritty/themes` → `https://github.com/alacritty/alacritty-theme` (`.config/alacritty/themes/.git/config:1-11`).
  - `orgs/kcrommett/oc-manager` → `git@github.com:kcrommett/oc-manager.git` (`orgs/kcrommett/oc-manager/.git/config:1-11`).
- Leaving nested repositories unmanaged breaks workspace automation (`giga-*`, Nx) and makes it easy to miss updates when committing from the root.

## Existing Issues / PRs
- None linked in repo docs or recent history (`git log -5`).

## Requirements
1. Convert each standalone Git directory above into a proper submodule so `.gitmodules` carries their metadata and collaborators can initialize them with standard commands.
2. Preserve current remotes/branches; prefer SSH URLs when originals already use SSH (e.g., `git@github.com:kcrommett/oc-manager.git`).
3. Remove inline `.git/` directories after submodule creation so the superproject stores them as gitlinks (`mode 160000`).
4. Ensure `.gitmodules` stays alphabetically grouped for easier diffing.
5. Update documentation (this spec) if the list of nested repos changes during implementation.

## Definition of Done
- `.gitmodules` contains entries for the three repositories above with correct `path` and `url` values.
- `git submodule status` succeeds and shows the new entries initialized.
- `git status` at the workspace root only reports expected `.gitmodules` edits and submodule gitlinks (no orphaned `.git/` directories).
- This spec reflects completion details and links to any follow-up work if required.

## Work Notes
- `.emacs.d` and `orgs/kcrommett/oc-manager` are now registered submodules (`.gitmodules:43-48`), with `.emacs.d` pinned to the `develop` branch for parity with the original checkout.
- A remaining nested Git repository lives at `.config/alacritty/themes`, but `.config` is currently tracked as a symlink (`git ls-files -s .config` → mode `120000`). Git cannot place a submodule beneath a symlink entry, so converting that path would require restructuring how `.config` is tracked (e.g., replacing the symlink with a real directory). This change is deferred pending guidance.

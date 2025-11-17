# device/stealth submodule sync

## Context
- Goal: ensure every submodule has `device/stealth` branch checked out, local changes committed, pushed to origin, and PRs opened (owners: riatzukiza, octave-commons, open-hax). Update superproject pointers afterward.
- Scope: all submodules recursively, including nested packages.
- No known open issues/PRs relevant; will discover via `gh pr view --head device/stealth` when creating PRs.

## Plan (phases)
1. Inventory submodules and detect default branches (origin HEAD or main/master fallback); flag owners for PRs.
2. For each submodule: fetch, ensure/create `device/stealth` (track remote if present, else branch from default); checkout. Stage and commit local changes if any.
3. Push `device/stealth` to origin for all submodules (report failures). For PR-eligible owners, create PR targeting default branch (skip if already exists); collect URLs.
4. Update superproject submodule pointers and commit if dirtied.

## Definition of done
- All submodules attempted: branch `device/stealth` exists locally and is checked out; if creation/push errors occur, they are reported explicitly.
- All local changes committed in submodules (message: "device/stealth: commit local changes in submodule").
- Push attempted for every submodule; successes recorded, failures reported.
- PRs created or confirmed existing for owners riatzukiza, octave-commons, open-hax with base=default branch; URLs reported.
- Superproject submodule pointers updated and committed if changed; final summary provided.

## Notes
- Use resilient scripting to handle missing branch/remote or detached HEAD.
- Default branch detection: `origin/HEAD` if available; otherwise prefer `origin/main`, then `origin/master`.
- PR creation via `gh pr create --head device/stealth --base <default>` with simple body; skip creation if PR already exists.

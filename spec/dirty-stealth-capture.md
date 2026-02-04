# Capture dirty workspace state on dirty/stealth

## Code files and references
- `AGENTS.md` should describe the dirty/stealth workflow alongside the device/stealth onboarding rules.
- Root repository and affected submodules (`orgs/` paths) need their dirty state committed to a dedicated `dirty/stealth` branch.

## Requirements
1. Create a `dirty/stealth` branch at the workspace root that captures all current changes, including submodule pointer updates.
2. For any dirty submodules, create/checkout `dirty/stealth` inside the submodule and commit all tracked + untracked changes so the state is preserved.
3. Skip typecheck/pre-push requirements when creating the dirty capture branch; do not run heavy checks for this snapshot.
4. Return to `device/stealth` after the snapshot so focused work can proceed.
5. Document the dirty/stealth convention in `AGENTS.md` so future work uses the same workflow.

## Definition of done
- `dirty/stealth` branch exists in the root repo and dirty submodules, with the current state committed.
- `device/stealth` is checked out again at the root after capture.
- `AGENTS.md` explicitly documents the dirty/stealth snapshot workflow and its purpose.

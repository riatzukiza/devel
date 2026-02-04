# Roll out device/stealth branches for all submodules

## Code files and references
- `.gitmodules` contains the authoritative list of submodule paths to process.
- Submodule repositories under `orgs/` must each have a `device/stealth` branch seeded from the remote default branch (usually `main`) per the workspace protocol in `AGENTS.md`.

## Existing issues / PRs
- None referenced for this rollout.

## Requirements
1. For every repo listed in `.gitmodules`, ensure a local `device/stealth` branch exists.
2. Initialize `device/stealth` from the remote default branch (origin/HEAD → origin/main fallback) if it does not exist.
3. Push `device/stealth` to `origin` and set upstream when missing.
4. Skip repos with uncommitted changes and report them.

## Definition of done
- All clean submodule repos have a pushed `device/stealth` branch tracking `origin/device/stealth`.
- Any skipped repos are listed with the reason (dirty worktree, missing origin, missing default branch, etc.).

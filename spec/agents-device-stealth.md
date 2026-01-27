# Onboard repos via device/stealth ↔ remote main

## Code files and references
- `AGENTS.md` (see the "Submodule Management Best Practices" section near lines 33-58) currently lists submodule workflows but does not describe the remote-branch workflow for `device/stealth`.

## Existing issues / PRs
- No active issue or PR documented in this workspace for this request.

## Requirements
1. Update `AGENTS.md` to explain how a new repo is added to the workspace, emphasizing that the local `device/stealth` branch must be initialized off of the remote `main` branch and pushed before wiring the repo into `.gitmodules`.
2. Describe the repeatable steps (fetching `main`, creating `device/stealth`, pushing, adding the submodule entry) so future repos follow the correct onboarding path.

## Definition of done
- `AGENTS.md` contains a new subsection under submodule management that clearly states the onboarding process and references remote `main` as the source for each `device/stealth` branch.

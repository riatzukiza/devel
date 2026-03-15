# Π LAST — devel workspace snapshot

- time: 2026-03-15T01:33:59-05:00
- repo: /home/err/devel
- branch: refactor/skills-to-factory
- head_pre: f0d536c40e462cd62470327850ca5ee978cf6150

## What changed (superproject)
- Config updates
  - `opencode.jsonc`: removed provider/model configuration block (kept MCP section)
  - `docker-compose.yml`: added `kanban_ui` service
  - `.opencode/package.json`: bumped `@opencode-ai/plugin` to `1.2.26`
  - `package.json`: added `esbuild` + `nx` to `trustedDependencies`
- Submodules
  - staged: add `orgs/badlogic/pi-mono` to `.gitmodules`
  - updated pointers across multiple `orgs/**`, `services/**`, `vaults/**`

## Submodule snapshot updates (selected)
- `orgs/open-hax/agent-actors` @ `412b5f4` (pushed `device/stealth`; push used `SKIP_PREPUSH_TYPECHECK=1` due to missing workspace `tsconfig.base.json`)
- `orgs/open-hax/openhax` @ `70c6d9d` (pushed `feature/kanban-package`; push used `SKIP_PREPUSH_TYPECHECK=1` due to missing `typecheck` script)
- `services/open-hax-openai-proxy` @ `b543b5e` (pushed `main`; pre-push ran typecheck + e2e OK)
- `vaults/fork_tales` @ `262099f` (pushed `feature/eta-mu-tts-fix`; pre-push ran `python_c_quality_gate` in warn-mode)
- `orgs/octave-commons/pantheon` @ `a02e160` (rebased onto `origin/device/stealth` and pushed)
- `orgs/octave-commons/promethean` @ `8dcaf03aa`
  - `device/stealth` push rejected (non-fast-forward)
  - pushed snapshot branch: `fork-tax/2026-03-15-opmf-snapshot`
- `orgs/octave-commons/gates-of-aker` @ `ed8272e`
  - pushed snapshot branch: `fork-tax/2026-03-15-opmf-snapshot`

## Checks
- `pnpm -w lint`: FAILED (exit 1)
  - likely cause: `scripts/nx-affected.mjs` includes many untracked `.opencode/knowledge/archive/**` files (git config `status.showUntrackedFiles=no` hides them from `git status`, but the script uses `git ls-files --others --exclude-standard`).

## How to verify quickly
- `pnpm -w lint:md`
- `pnpm -w typecheck`

## Notes
- This repo-level Π commit will include updated `.ημ/*` handoff artifacts.

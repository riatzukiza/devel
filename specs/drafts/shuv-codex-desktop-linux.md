# shuv/codex-desktop-linux integration draft

## Goal
Add `git@github.com:shuv1337/codex-desktop-linux.git` as a workspace submodule under `orgs/shuv/codex-desktop-linux`, build it, point it at the running local Open Hax proxy, launch it on a virtual X display, and verify it can answer a simple `hello world` prompt.

## Open Questions
- Which build system and runtime packaging does the upstream repo use?
- How does it accept API base URL / auth token / model configuration?
- What is the most reliable way to automate a smoke test under Xvfb?

## Risks
- The repo may expect a different OpenAI-compatible endpoint shape than our proxy exposes.
- Electron/Tauri/desktop sandboxing can make headless launch tricky.
- UI automation may require a mix of Xvfb + xdotool even if xinput is only usable for device inspection.

## Priority
High

## Phases
1. Add submodule and inspect upstream docs/config.
2. Build the app and identify config knobs for base URL/token/model.
3. Launch under virtual X, automate a hello-world prompt, and capture evidence.

## Affected Files
- `.gitmodules`
- `orgs/shuv/codex-desktop-linux/**`
- `specs/drafts/shuv-codex-desktop-linux.md`
- `receipts.log`

## Definition of Done
- Submodule exists at `orgs/shuv/codex-desktop-linux`.
- App builds successfully.
- App is configured to target local Open Hax.
- Virtual-display smoke test completes and shows a hello-world reply.
- Results are reported with concrete evidence.

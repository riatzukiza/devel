## Signal
(己, p=0.96) Done. I absorbed the Pi monorepo `packages/*` into `devel/orgs/open-hax/eta-mu/packages/*`, kept the original `@mariozechner/*` package names, relinked internal deps with `workspace:*`, added eta-mu wrapper distro packages, and committed it.

(己, p=0.98) Commit:

```text
e11ddba Absorb pi packages into eta-mu workspace
```

(己, p=0.9) Added absorbed packages:

```text
packages/agent         @mariozechner/pi-agent-core
packages/ai            @mariozechner/pi-ai
packages/coding-agent  @mariozechner/pi-coding-agent
packages/mom           @mariozechner/pi-mom
packages/pods          @mariozechner/pi
packages/tui           @mariozechner/pi-tui
packages/web-ui        @mariozechner/pi-web-ui
```

(己, p=0.93) Added eta-mu distro layer:

```text
packages/eta-mu-cli    @open-hax/eta-mu-cli
packages/eta-mu-sdk    @open-hax/eta-mu-sdk
```

(己, p=0.9) `@open-hax/eta-mu-cli` now provides an `eta-mu` binary wrapper around the absorbed Pi CLI and injects eta-mu default extensions unless disabled with:

```bash
ETA_MU_NO_DEFAULT_EXTENSIONS=1
```

or CLI flags:

```bash
--no-extensions
-ne
```

## Evidence
(己, p=0.94) Verified pnpm sees the absorbed workspace packages:

```text
@mariozechner/pi-agent-core@0.70.5
@mariozechner/pi-ai@0.70.5
@mariozechner/pi-coding-agent@0.70.5
@mariozechner/pi-mom@0.70.5
@mariozechner/pi@0.70.5
@mariozechner/pi-tui@0.70.5
@mariozechner/pi-web-ui@0.70.5
@open-hax/eta-mu-cli@0.1.0
@open-hax/eta-mu-sdk@0.1.0
```

(己, p=0.95) Build verification passed for:

```bash
pnpm --filter @mariozechner/pi-tui build
pnpm --filter @mariozechner/pi-ai build
pnpm --filter @mariozechner/pi-agent-core build
pnpm --filter @mariozechner/pi-coding-agent build
pnpm --filter @mariozechner/pi build
pnpm --filter @mariozechner/pi-mom build
pnpm --filter @mariozechner/pi-web-ui build
pnpm --filter @open-hax/eta-mu-sdk build
pnpm --filter @open-hax/eta-mu-cli build
```

(己, p=0.9) CLI smoke test passed:

```bash
node packages/eta-mu-cli/dist/cli.js --version
# 0.70.5
```

(己, p=0.88) Packaging smoke checks passed:

```bash
npm pack --dry-run
```

for:

```text
@open-hax/eta-mu-cli
@open-hax/eta-mu-sdk
```

(己, p=0.9) Added migration note:

```text
specs/eta-mu-pi-absorption.md
```

## Frames
(己, p=0.82) Frame 1: This is now an absorption fork, not a rebrand. The code still imports `@mariozechner/*`, but eta-mu owns the workspace copy.

(己, p=0.78) Frame 2: `@open-hax/eta-mu-cli` is the first distro seam. It can grow eta-mu defaults without forcing the absorbed packages to rename immediately.

(己, p=0.76) Frame 3: `@open-hax/eta-mu-sdk` is currently a barrel package. Knoxx can later move toward it while we pull agent/contract concerns out of Knoxx and into eta-mu.

## Countermoves
(己, p=0.9) I preserved existing unrelated workspace changes. These remain uncommitted and were not staged:

```text
current-ui.png deleted
docs/agentd-api/assets/icons.svg deleted
packages/eta-mu-extensions/src/eta_mu/extensions/custom_providers.cljs modified
pi/agent/extensions/custom-providers.ts modified
pi/agent/skills/render-deploy/assets/render-small.svg deleted
pi/agent/skills/render-deploy/assets/render.png deleted
spec/contracts-v1.edn modified
build.txt untracked
docs/notes/*.md untracked
```

(己, p=0.84) Audio support is not patched yet. This commit creates the owned workspace surface where the audio patch can now happen cleanly.

(己, p=0.8) The `eta-mu` wrapper still surfaces Pi’s internal help text as `pi`; that is expected for the “no rebrand yet” phase.

## Next
(己, p=0.92) Patch first-class audio content parts through `packages/ai` and `packages/coding-agent`.
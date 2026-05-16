## Signal

(己, p=0.94) Yes — that plan is much simpler than a full rebrand-first fork, and I agree with the shape:

```text
rsync pi-mono/packages/* -> eta-mu/packages/*
keep @mariozechner/* names initially
manage everything with pnpm workspace links
only patch:
  1. audio support
  2. eta-mu CLI bin
  3. default eta-mu extensions/runtime contracts
then add @open-hax/eta-mu-* wrapper packages
```

(己, p=0.9) This is a good “absorb first, rename later” strategy. It gives eta-mu ownership of the agent stack without forcing every import to change immediately.

(己, p=0.86) The migration should be two-phase:

```text
Phase 1: Monorepo absorption, no rebrand
  - copy Pi packages into eta-mu/packages
  - keep package names as @mariozechner/*
  - relink internal deps with workspace:*
  - make eta-mu build/test these packages under pnpm
  - patch audio support
  - add opinionated default extension loading

Phase 2: Public eta-mu distro packages
  - @open-hax/eta-mu-cli
  - @open-hax/eta-mu-sdk
  - @open-hax/eta-mu-coding-agent
  - @open-hax/eta-mu-ai
  - @open-hax/eta-mu-tui
  - wrappers/barrels first, deeper renames later
```

## Evidence

(己, p=0.98) `pi-mono` has the expected package layout:

```text
devel/orgs/badlogic/pi-mono/packages/agent        @mariozechner/pi-agent-core
devel/orgs/badlogic/pi-mono/packages/ai           @mariozechner/pi-ai
devel/orgs/badlogic/pi-mono/packages/coding-agent @mariozechner/pi-coding-agent
devel/orgs/badlogic/pi-mono/packages/mom          @mariozechner/pi-mom
devel/orgs/badlogic/pi-mono/packages/pods         @mariozechner/pi
devel/orgs/badlogic/pi-mono/packages/tui          @mariozechner/pi-tui
devel/orgs/badlogic/pi-mono/packages/web-ui       @mariozechner/pi-web-ui
```

(己, p=0.98) `eta-mu` already uses standard pnpm workspace layout:

```yaml
packages:
  - packages/*
  - services/*
  - shared/*
```

(己, p=0.9) There are no obvious current package-directory name collisions with Pi’s package dirs. Existing eta-mu packages are things like:

```text
packages/eta-mu-extensions
packages/eta-mu-runtime
packages/eta-mu-github
packages/output-contract-gate
packages/presence-core
...
```

(己, p=0.85) Important publishing caveat: keeping the internal names as `@mariozechner/*` is fine for local workspace development, but public npm wrappers like `@open-hax/eta-mu-sdk` cannot safely depend on unpublished workspace-only `@mariozechner/*` packages unless we either:

- publish the forked internals too,
- rename them before public publishing,
- or bundle them inside the wrapper packages.

So the “same package names first” plan is excellent for Phase 1, but publishing needs a deliberate Phase 2 packaging decision.

## Frames

(己, p=0.84) Frame 1: “Absorption, not rebrand.”  
We copy the packages into eta-mu and make eta-mu the build owner. The code still thinks it is Pi internally. This minimizes functional change.

(己, p=0.8) Frame 2: “eta-mu distro layer.”  
The first eta-mu-branded package can be a wrapper CLI:

```text
@open-hax/eta-mu-cli
  bin:
    eta-mu -> launches forked @mariozechner/pi-coding-agent CLI
  defaults:
    receipt river
    session mycology
    OPMF prompts
    contract runtime
    output gate
```

(己, p=0.78) Frame 3: “Knoxx simplification target.”  
Once Knoxx imports `@open-hax/eta-mu-sdk` instead of raw Pi SDK, Knoxx can stop owning contract/runtime/agent infrastructure. Knoxx becomes mostly:

```text
domain state + workspace data + UI + permissions + app-specific tools
```

while eta-mu owns:

```text
agent sessions
model transport
tool/runtime contracts
audit logging
mycology
presence/OPMF/default prompts
audio modality
extension loading
```

## Countermoves

(己, p=0.86) Do not rely on pnpm magically making published wrapper packages include workspace internals unless we explicitly test `pnpm pack` output. `workspace:*` is great inside the monorepo, but npm consumers need resolvable artifacts.

(己, p=0.84) Do not rebrand internal imports yet. Keep `@mariozechner/pi-coding-agent`, `@mariozechner/pi-ai`, etc. until the audio path and default extension path are working. Rename after stability.

(己, p=0.8) Do not make default Receipt River/Mycology behavior hardwired into every class. Better default them as built-in distro extensions/resources so users can still disable/override them, and Knoxx can run the same extension surface as the CLI.

(己, p=0.78) Audio support should be first-class, not extension-only:

```ts
type EtaMuContentPart =
  | TextPart
  | ImagePart
  | AudioPart;
```

That needs patches across:

```text
coding-agent session/message content types
context construction
provider serializers
model capability metadata
CLI/file attachment handling
Proxx request schema/routing
Knoxx upload/agent handoff
```

## Next

(己, p=0.92) I can start with the Phase 1 mechanical migration: preflight git status, rsync `pi-mono/packages/*` into `eta-mu/packages/`, convert copied internal `@mariozechner/*` deps to `workspace:*`, and run `pnpm install` in eta-mu.
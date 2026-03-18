# Draft Spec (Phase 1): Keep packages/ + services/ as symlink + prototyping layer

## Mission
Make `packages/` and `services/` remain first-class directories for:
1) **rapid prototyping** (real directories committed in this repo)
2) **compatibility symlinks** pointing at canonical module homes under `orgs/<org>/<repo>`

This phase defines and implements the *link layer* so subsequent phases can migrate modules into `orgs/` without breaking paths.

## Context / Current State
- Today, many modules live directly under `packages/` and `services/`.
- Some `services/*` are already submodules.
- pnpm workspace config currently enumerates many `packages/...` explicitly and includes `services/*`.

## Goals
1. Establish a clear convention:
   - Canonical code lives at: `orgs/<org>/<repo>` (when promoted out of prototype)
   - Compatibility link lives at: `packages/<name>` or `services/<name>` (symlink)
   - Prototypes remain as real dirs under `packages/` or `services/` until promotion
2. Provide tooling to manage links deterministically:
   - create/repair symlinks
   - detect broken links
   - detect collisions (a real dir exists where a symlink should be)
3. Ensure pnpm + Nx discovery works with the new structure.

## Non-goals
- No module migrations to upstream/submodules yet (that’s Phase 2/3).

## Proposed Conventions
### A. Link manifest
Add a source-of-truth file:

`docs/migrations/packages-services-to-orgs/links.yaml`

```yaml
links:
  - from: packages/logger
    to: orgs/riatzukiza/logger
  - from: services/mcp-github
    to: orgs/open-hax/mcp-github
  # Example where the compatibility path name intentionally differs from upstream repo name:
  - from: services/open-hax-openai-proxy
    to: orgs/open-hax/proxx
```

### B. Deterministic link tool
Add a script (Node or Bun) that:
- reads `links.yaml`
- ensures `from` is a symlink pointing at `to`
- refuses to delete non-symlink directories unless `--force` is passed

Suggested commands:
- `pnpm run links:check`
- `pnpm run links:sync`

### C. Workspace discovery
Update `pnpm-workspace.yaml` to include both:
- prototypes: `packages/*`, `services/*`
- canonical: `orgs/*/*` (careful not to glob too broadly)

Then:
- symlinked entries under `packages/*` and `services/*` are “compat paths”, not the only mechanism by which pnpm finds packages.

## Open Questions
1. Should we prefer **relative symlink targets** (portable inside repo) or absolute ones (machine-specific but unambiguous)?
   - Default recommendation: **relative**.
2. For Windows collaborators (if any), do we need a fallback (junctions / copy) or is this repo Linux-first?
3. Do we want a naming rule for link path vs repo path when they differ?
   - ex: `packages/opencode-cljs-client` → `orgs/open-hax/opencode-cljs-client`
   - ex: `services/open-hax-openai-proxy` → `orgs/open-hax/proxx` (upstream repo name)

## Risks
- pnpm workspace tooling may treat symlink paths in surprising ways (duplicate workspace packages, realpath resolution).
  - Mitigation: ensure canonical `orgs/*/*` paths are in workspace; treat symlinks as compatibility only.
- Symlink collisions: a real prototype dir might occupy a name later needed for a link.
  - Mitigation: the link tool refuses destructive operations without `--force`.

## Implementation Plan
1. Add `docs/migrations/packages-services-to-orgs/links.yaml` (initially minimal, can start empty).
2. Add `scripts/workspace-links.mjs` (or `.ts`) implementing:
   - `sync` (create/repair links)
   - `check` (CI-friendly validation)
3. Wire root `package.json` scripts:
   - `links:sync`, `links:check`
4. Update `pnpm-workspace.yaml` globs to include `orgs/*/*` and keep `packages/*` + `services/*`.
5. Document the rule of thumb:
   - “Prototype in packages/services; promote to orgs + upstream; leave symlink behind.”

## Affected Files
- `docs/migrations/packages-services-to-orgs/links.yaml` (new)
- `scripts/workspace-links.mjs` (new)
- `package.json` (add scripts)
- `pnpm-workspace.yaml` (workspace package globs)
- `docs/migrations/packages-services-to-orgs/README.md` (new; brief conventions)

## Verification
- `pnpm run links:sync` is idempotent.
- `pnpm run links:check` exits non-zero on:
  - broken symlink
  - wrong target
  - missing target
  - collision (real dir where a managed symlink should be)
- `pnpm install` still works.

## Definition of Done
- Link conventions are documented.
- Link tooling exists and is wired into scripts.
- Workspace config supports canonical `orgs/` paths while allowing prototypes in `packages/` and `services/`.

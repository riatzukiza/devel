# Draft Spec (Phase 1): Keep `packages/*` as prototype layer and `services/*` as runtime/devops layer

## Mission
Establish the link and path conventions that support the active placement contract:
1. `packages/*` remains the default rapid-prototyping layer
2. `services/*` remains the runtime/devops/integration layer
3. `orgs/<org>/<repo>` is the canonical home for mature source
4. compatibility aliases may exist, but should be explicit and deterministic

## Context / Current State
- Today, many modules still live directly under `packages/*` and `services/*`.
- Some `services/*` entries are legacy names, historical source checkouts, or runtime wrappers.
- The active contract no longer treats `services/*` as a prototype home.

## Goals
1. Establish a clear convention:
   - canonical mature code lives at `orgs/<org>/<repo>`
   - prototypes live at `packages/<name>`
   - runtime/devops homes live at `services/<name>`
   - aliases are explicit and documented, not accidental duplicates
2. Provide tooling to manage aliases deterministically:
   - create/repair symlinks where desired
   - detect broken links
   - detect collisions
3. Keep pnpm/Nx discovery working with the new structure.

## Non-goals
- No bulk module migrations to upstream repos yet.
- No assumption that every `services/*` path becomes a symlink.

## Proposed Conventions
### A. Link manifest
Add or maintain a source-of-truth file:

`docs/migrations/packages-services-to-orgs/links.yaml`

```yaml
links:
  - from: packages/logger
    to: orgs/riatzukiza/logger
  - from: services/open-hax-openai-proxy
    to: services/proxx
```

A link may point either to:
- a canonical org checkout, or
- a stable runtime/devops home

### B. Deterministic link tool
Add a script that:
- reads `links.yaml`
- ensures `from` is a symlink pointing at `to`
- refuses to delete non-symlink directories unless `--force` is passed
- distinguishes managed aliases from real runtime homes

Suggested commands:
- `pnpm run links:check`
- `pnpm run links:sync`

### C. Workspace discovery
Update workspace discovery to reflect role separation:
- `packages/*` -> prototypes and optional compatibility paths
- `services/*` -> runtime/devops homes and optional aliases
- `orgs/*/*` -> canonical mature repos

## Open Questions
1. Should relative symlink targets be preferred over absolute ones?
   - Recommendation: relative.
2. Do promoted `packages/*` entries always keep a compatibility path, or only when the path has operator value?
3. Which `services/*` entries should stay real directories even after their source has moved to `orgs/*/*`?

## Risks
- Workspace tooling may double-discover canonical and alias paths.
- A real runtime home could be overwritten if alias management is too aggressive.
- Historical docs may still imply that `services/*` is a prototype layer.

## Implementation Plan
1. Maintain `links.yaml` with only intentional aliases.
2. Add alias management tooling.
3. Wire root scripts for `links:sync` and `links:check`.
4. Update workspace docs to say: prototype in `packages/*`; operate from `services/*`; mature source in `orgs/*/*`.

## Affected Files
- `docs/migrations/packages-services-to-orgs/links.yaml`
- `scripts/workspace-links.mjs`
- `package.json`
- `pnpm-workspace.yaml`
- `docs/migrations/packages-services-to-orgs/README.md`

## Verification
- `pnpm run links:sync` is idempotent.
- `pnpm run links:check` fails on broken or incorrect managed aliases.
- No real runtime home is replaced unintentionally.
- `pnpm install` still works.

## Definition of Done
- Link conventions are documented.
- Alias tooling exists and is wired into scripts.
- Workspace config supports canonical `orgs/*/*` paths while preserving the distinct roles of `packages/*` and `services/*`.

# Draft Spec (Phase 3): Align `services/*` runtime homes with canonical org repos

## Mission
Normalize `services/*` so it functions as the workspace runtime/devops layer rather than the canonical source layer.

This phase focuses on:
- identifying the canonical org repo for each independently deployable service
- making `services/<name>` a real runtime/devops home when the workspace needs one
- keeping legacy compatibility aliases only where they still provide operator value

## Context / Current State
- `services/*` contains multiple Node services, MCP servers, runtime processes, and historical paths.
- Some service source has already been promoted to canonical repos under `orgs/*/*`.
- The active contract now says:
  - canonical source/build/release/deploy truth belongs in the org repo
  - `services/*` belongs to devops/runtime/integration concerns

## Goals
1. For each service-related entry, decide whether `services/<name>` is:
   - a runtime/devops home
   - a compatibility alias
   - a legacy source path that must be retired
   - or an explicit devel-only exception
2. Ensure independently deployable services have canonical repos under the appropriate org namespace.
3. Keep local runtime and operator workflows stable.
4. Avoid split-brain truth between `orgs/*/*` source and `services/*` source.

## Non-goals
- Automatically turning every `services/*` path into a symlink.
- Rewriting deployment topology just to satisfy naming aesthetics.
- Eliminating legitimate runtime homes such as `services/proxx` or `services/voxx`.

## Working rule
Use `services/*` for:
- Docker Compose wrappers
- deployment config
- env examples
- operator docs
- workspace-specific orchestration glue
- stable runtime paths

Use `orgs/*/*` for:
- source of truth
- build/test contract
- release/deploy contract
- independently reusable service repos

## Special Case: legacy service source already under `services/*`
When a service source checkout still lives under `services/*`:
1. decide whether it should graduate into an org repo
2. if yes, relocate the canonical source to `orgs/<org>/<repo>`
3. leave behind either:
   - a real runtime home in `services/<name>` that builds from the org repo, or
   - a compatibility alias when the old path should remain stable

### Example
- canonical source: `orgs/open-hax/proxx`
- runtime home: `services/proxx`
- compatibility alias: `services/open-hax-openai-proxy -> services/proxx`

## Open Questions
1. Which current `services/*` directories should remain long-term runtime homes?
2. Which legacy service paths should remain as aliases for operator ergonomics?
3. Are there any services that should stay devel-local and never become independent org repos?

## Risks
- Compose/PM2 paths often hardcode `services/*` locations.
- Some tools dislike symlinked working directories, so runtime homes should remain real directories when needed.
- Without an explicit runtime-home map, services can drift back into being accidental source homes.

## Implementation Phases (within Phase 3)
### Phase 3.1 — Pilot runtime-home alignment
- Use `proxx` and `voxx` as the model.
- Confirm the difference between canonical source, runtime home, and compatibility alias.

### Phase 3.2 — Convert legacy service source paths
- For service source still living under `services/*`, move canonical truth into `orgs/*/*` where appropriate.
- Replace stale historical names with explicit aliases or runtime homes.

### Phase 3.3 — Stabilize runtime-home contracts
- Document which `services/*` paths are canonical runtime homes.
- Document which are aliases only.
- Remove misleading docs that imply `services/*` is the source of truth.

## Affected Files
- `.gitmodules`
- `services/*`
- `orgs/<org>/*`
- `docs/migrations/packages-services-to-orgs/links.yaml`
- `docs/migrations/packages-services-to-orgs/migration-map.yaml`
- runtime docs and deploy scripts as needed

## Verification
Per aligned service:
- build/test from the canonical org repo
- smoke-run or `docker compose config` from the runtime home
- verify compatibility aliases still resolve where intentionally preserved

## Definition of Done
- Selected independently deployable services have canonical org repos or an explicit devel-only exception.
- `services/*` paths are classified as runtime homes, aliases, or exceptions.
- Local runtime workflows still work.
- No active spec in this migration stack assumes `services/*` is a generic prototype layer.

# Draft Spec (Phase 0): Inventory + classification map for packages/ + services/ → orgs/

## Mission
Produce a **complete, reviewable inventory** of everything under `packages/` and `services/`, then classify each module to a target upstream org:

- **riatzukiza/** — workspace-specific dependencies + personal tools (published mainly for hygiene/timelines)
- **open-hax/** — polished, documented, broadly useful tools
- **octave-commons/** — experimental/research/myth-coded and/or plausibly dual-use tools (with explicit intent + safe-use notes)

This phase does **not** move anything. It creates the map and migration order.

## Context / Current State
- This repo is a pnpm workspace with many local modules under `packages/*` and `services/*`.
- Some entries in `services/` are already git submodules per `.gitmodules`.
- New requirement: `packages/` and `services/` will **remain** and become a *staging + symlink layer* pointing at canonical module homes under `orgs/<org>/<repo>`.

## Goals
1. Build an inventory table for each module under `packages/*` and `services/*`:
   - path
   - type (node package, clj/cljs, docker service, etc.)
   - package name (if `package.json`)
   - build/test commands (if any)
   - presence of README/docs
   - current git status: standalone dir vs already-submodule
   - coupling notes (depends on workspace-only things?)
2. Decide **target org + repo name** for each module.
3. Decide extraction strategy per module:
   - history-preserving extraction (filter-repo/subtree split)
   - snapshot extraction (initial import only)
4. Establish migration order (leaf dependencies first).

## Non-goals
- No upstream repo creation yet.
- No submodule operations.
- No workspace config changes.

## Deliverables
Create these artifacts in-repo:
1. `docs/migrations/packages-services-to-orgs/migration-map.yaml`
2. `docs/migrations/packages-services-to-orgs/inventory.md`
3. `docs/migrations/packages-services-to-orgs/migration-order.md`

### Suggested schema: migration-map.yaml
```yaml
packages/logger:
  org: riatzukiza
  repo: logger
  kind: node-lib
  extraction: snapshot
  publish: later | never | soon
  symlink:
    from: packages/logger
    to: orgs/riatzukiza/logger
  notes: "workspace-only; private scope"
```

## Classification rubric (explicit)
Use a 2-axis rubric:

1) **Maturity / public utility**
- open-hax: clean + documented + testable + minimal workspace coupling
- riatzukiza: workspace-focused, sharp edges acceptable, published mostly for hygiene
- octave-commons: experimental/research and/or plausibly dual-use (requires intent note)

2) **Coupling**
- If it cannot run outside this workspace without heavy internal dependencies, default to riatzukiza (unless you commit to decoupling work as part of later phases).

## Open Questions
1. Do we want a single canonical naming convention for repos (e.g. `mcp-foo`, `opencode-foo`, `cephalon-*`), or preserve existing directory names?
2. For “octave-commons” dual-use candidates, what is the preferred standard doc name?
   - `DUAL_USE.md` vs `INTENT.md` vs `SAFETY.md`
3. For modules without `package.json` (e.g. clj/cljs or docker-only), do we still want symlink indirection, or keep them directly under `services/` as prototypes longer?

## Risks
- Misclassification increases later cost (moving between orgs later is doable but annoying).
- pnpm workspace discovery can behave differently with symlinked packages across OS/filesystems.

## Implementation Steps
1. Enumerate modules under `packages/*` and `services/*`.
2. Detect:
   - `package.json` presence and `name`, `scripts`.
   - existing `.git` dirs (standalone repo) vs plain dir.
   - existing submodules via `.gitmodules`.
3. Generate inventory markdown.
4. Fill migration-map.yaml with org decisions.
5. Compute dependency graph (workspace:* deps) and propose order.

## Affected Files (created only)
- `docs/migrations/packages-services-to-orgs/migration-map.yaml` (new)
- `docs/migrations/packages-services-to-orgs/inventory.md` (new)
- `docs/migrations/packages-services-to-orgs/migration-order.md` (new)

## Definition of Done
- Every directory under `packages/*` and `services/*` is present in `migration-map.yaml`.
- Each entry has (org, repo, extraction strategy).
- Migration order is documented.

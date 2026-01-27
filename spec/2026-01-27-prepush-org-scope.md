# Pre-push typecheck org scope (2026-01-27)

## Summary
Limit Nx affected typecheck in the pre-push hook to projects under the riatzukiza, octave-commons, and open-hax orgs.

## Requirements
- Pre-push typecheck only runs for affected Nx projects with names prefixed by `orgs-riatzukiza-`, `orgs-octave-commons-`, or `orgs-open-hax-`.
- If no affected projects match those prefixes, the hook logs and exits successfully.
- Non-Nx fallback behavior remains unchanged.

## Existing issues/PRs
- Issues: none found.
- PRs: none found.

## Files & locations
- `.hooks/pre-push-typecheck.sh:67-143`

## Plan
### Phase 1: Scope affected projects
- Use `nx show projects --affected` to list affected projects and filter by allowed org prefixes.
- Run `nx run-many -t typecheck` on the filtered project list.

### Phase 2: Verify behavior
- Manually run the hook to confirm it skips non-matching projects.

## Definition of done
- Hook only executes typechecks for the three allowed org prefixes.
- Hook exits early when no matching projects are affected.
- Root and submodule non-Nx fallbacks remain intact.

## Changelog
- 2026-01-27: Spec created.
- 2026-01-27: Implemented org-scoped affected typecheck filtering.
- 2026-01-27: Switched to `nx show projects --affected` for Nx 19+.

# Pre-push typecheck fixes (2026-01-27)

## Summary
Resolve pre-push typecheck failures by fixing missing submodule mappings, regenerating Nx project files, and addressing typecheck errors in promethean compliance-monitor/symdocs and riatzukiza desktop.

## Requirements
- `.gitmodules` includes all gitlink submodules referenced in the index.
- Nx project mappings are regenerated to reflect current layout.
- `orgs/riatzukiza/promethean/experimental/compliance-monitor` passes typecheck (no unused `context`).
- `orgs/riatzukiza/promethean/pipelines/symdocs` passes typecheck (TS version mismatch resolved).
- `orgs/riatzukiza/desktop` passes typecheck (missing deps + TS errors).

## Existing issues/PRs
- Issues: none checked.
- PRs: none checked.

## Files & locations
- `.gitmodules`
- `projects/*/project.json` (generated)
- `orgs/riatzukiza/promethean/experimental/compliance-monitor/src/core/rule-engine.ts`
- `orgs/riatzukiza/promethean/pipelines/symdocs/src/01-scan.ts`
- `orgs/riatzukiza/desktop/*`

## Plan
### Phase 1: Submodule + Nx regeneration
- Add missing submodule entries and sync mappings.
- Run `pnpm run giga:nx:generate` to regenerate `projects/*`.

### Phase 2: Fix typecheck failures
- Remove unused `context` in compliance-monitor rule engine.
- Align TypeScript usage in symdocs to avoid mixed-version types.
- Address desktop TypeScript errors and missing dependencies.

### Phase 3: Verify
- Re-run pre-push typecheck (or push) until hook passes.

## Definition of done
- Pre-push typecheck completes without errors for affected projects.
- Root push succeeds without `--no-verify`.

## Changelog
- 2026-01-27: Spec created.

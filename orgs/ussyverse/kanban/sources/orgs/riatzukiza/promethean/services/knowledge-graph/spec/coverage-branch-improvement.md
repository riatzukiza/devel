# Branch coverage improvement plan

## Code references

- src/index.ts:1-35 — re-exports primary API; currently untested and counts as 0% lines/branches.
- src/rebuild.ts:1-80 — ndjson/layout resolution helpers and rebuildGraph orchestration, untested.
- src/config.ts:93-231 — resolveRelatedConfig, resolveMermaidOptions/output branches driven by env/config/cli paths.
- packages/knowledge-graph-simulation/src/session-manager.ts:204-238 — resolveRunnerCommand selects dist/src/tsx paths.

## Current issue

Branch coverage is ~46% overall (vitest v8 report). Key modules above are unexercised, dragging branches/stmts down.

## Definition of done

- New tests exercise branches for config/resolution helpers, rebuild path selectors, and runner resolution.
- Coverage suite (`pnpm --filter @promethean-os/knowledge-graph test:coverage`) reflects meaningful branch increase (target: >55% overall, improved on listed files from 0% to covered).
- No production behavior regressions; tests remain passing.

## Plan

1. Add lightweight tests covering src/index.ts exports to ensure module loads without side effects.
2. Add tests for rebuild helpers: resolveNdjsonOutputPath (env vs candidate dirs), resolveLayoutPath, writeNdjson placeholder, resolveDatabasePath config vs default.
3. Add config tests: resolveMermaidOptions (cli vs config precedence), resolveRelatedConfig env overrides vs defaults.
4. Add session-manager resolveRunnerCommand tests to cover dist-first and src+tsx branches using temp dirs.
5. Run coverage suite and verify branch/stmts improved.

# Coverage Command Task

## Context and Findings
- Package scripts currently lack a coverage entry (package.json:8-18).
- Vitest coverage already configured with V8 and reporters (vitest.config.ts:1-13).
- Recent tests pass via `pnpm test` (user-provided run).
- No existing issue/PR search performed yet; assume none for this task.

## Definition of Done
- `pnpm test:coverage` script exists and runs Vitest with coverage using existing config.
- Command completes successfully in repo root.
- No regressions to existing scripts.

## Plan (Phases)
1. **Assessment**: Confirm required coverage invocation and scripting needs in package.json and Vitest config.
2. **Implementation**: Add `test:coverage` script calling Vitest with coverage flags consistent with current setup.
3. **Validation**: Run `pnpm test:coverage`; ensure coverage report is generated and tests still pass.

## Requirements
- Use existing Vitest coverage config; do not alter coverage settings unless necessary.
- Keep package.json script ordering consistent with project style.
- Tests must pass after change.

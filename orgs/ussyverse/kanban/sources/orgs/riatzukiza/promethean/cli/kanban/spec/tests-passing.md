# Tests Passing: Local CLI

## Scope
- Restore green build/test by ensuring dependencies are installed and test typings are explicit.

## Requirements
- Resolve TypeScript module resolution errors for `simple-git`, `xml2js`, `js-yaml`, `esmock`, and `tempy`.
- Fix implicit `any` errors in `src/tests/file-watcher.test.ts`.
- Avoid changing runtime behavior.

## Plan
1. Verify dependencies are installed in `node_modules`.
2. Update test typings to use existing exported types.
3. Run `pnpm run build` and `pnpm test` to validate.

## Definition of Done
- Build passes without TS2307/TS7016 errors.
- Tests pass without TypeScript errors.
- `lsp_diagnostics` reports zero errors on modified files.

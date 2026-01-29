# Delimiter Diagnose + Auto-Fix Plugin

## Goal
Add a new OpenCode CLJS plugin under `orgs/open-hax/` that provides a tool to diagnose missing delimiters and auto-correct common mistakes.

## References
- `orgs/open-hax/cljs-plugin-template/template/` (scaffold)
- `orgs/open-hax/opencode-cljs-plugin-lsp-delim-guard/src/my/opencode/fragments/lsp_delim_guard.cljs` (diagnostic parsing patterns)

## Requirements
- New plugin repo: `orgs/open-hax/opencode-cljs-plugin-delim-auto-fix/`
- Tool name: `delim/auto-fix`
- Args:
  - `code` (string, required)
  - `diagnostic` (string, optional)
  - `maxFixes` (number, default 5)
- Output:
  - `fixedCode` (string)
  - `fixes` (array of `{kind, at, detail}`)
  - `summary` (string)

## Files
- `orgs/open-hax/opencode-cljs-plugin-delim-auto-fix/src/my/opencode/entry.cljs`
- `orgs/open-hax/opencode-cljs-plugin-delim-auto-fix/src/my/opencode/delims.cljs` (new)
- `orgs/open-hax/opencode-cljs-plugin-delim-auto-fix/package.json`
- `orgs/open-hax/opencode-cljs-plugin-delim-auto-fix/README.md`

## Definition of Done
- Plugin builds via `pnpm build` and exports `MyPlugin`.
- `delim/auto-fix` returns deterministic fixes for common delimiter issues.
- LSP diagnostics clean for changed CLJS files.
- README documents usage and example payload.

## Notes
- Keep corrections minimal and predictable.
- No external dependencies.

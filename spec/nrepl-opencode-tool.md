# nREPL Eval OpenCode Tool

## Goal
Add a new OpenCode CLJS plugin under `orgs/open-hax/` that exposes an `nrepl/eval` tool backed by a real nREPL connection.

## References
- `orgs/open-hax/cljs-plugin-template/template/` (scaffold)
- `orgs/open-hax/cljs-plugin-template/src/my/opencode/entry.cljs` (tool wiring pattern)
- `orgs/open-hax/opencode-cljs-plugin-lsp-delim-guard/src/my/opencode/entry.cljs` (plugin repo example)
- `orgs/open-hax/museeks/src/museeks/plugins.cljs` (existing `:nrepl/eval` stub)
- https://nrepl.org/nrepl/ops.html
- https://nrepl.org/nrepl/building_clients.html

## Requirements
- New plugin repo: `orgs/open-hax/opencode-cljs-plugin-nrepl-eval/`
- Implement `nrepl/eval` tool with args:
  - `code` (required)
  - `host` (default `127.0.0.1`)
  - `port` (required or from `NREPL_PORT`)
  - `session` (optional)
  - `ns` (optional)
  - `timeoutMs` (default `8000`)
- Use real nREPL bencode transport over TCP.
- Guard with permission gate (`my.opencode.gate/require!`).
- Keep dependencies minimal and documented.

## Files
- New repo scaffolded from `orgs/open-hax/cljs-plugin-template/template/`
- `orgs/open-hax/opencode-cljs-plugin-nrepl-eval/src/my/opencode/entry.cljs`
- `orgs/open-hax/opencode-cljs-plugin-nrepl-eval/src/my/opencode/nrepl.cljs` (new)
- `orgs/open-hax/opencode-cljs-plugin-nrepl-eval/package.json`
- `orgs/open-hax/opencode-cljs-plugin-nrepl-eval/README.md`

## Definition of Done
- Tool compiles with Shadow-CLJS and exports `MyPlugin`.
- `nrepl/eval` connects to host/port, optionally clones session, and returns eval results.
- Permission gate blocks execution without explicit permission.
- LSP diagnostics clean for changed CLJS files.
- README explains usage, env vars, and example payload.

## Notes
- Avoid try/catch unless required; prefer Promise rejection paths.
- Use ASCII only.

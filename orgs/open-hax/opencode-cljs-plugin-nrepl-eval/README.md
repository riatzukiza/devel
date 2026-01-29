# OpenCode nREPL Eval Plugin

OpenCode CLJS plugin that exposes an `nrepl/eval` tool backed by a real nREPL TCP connection.

## Tool

`nrepl/eval`

**Args**
- `code` (string, required)
- `host` (string, default: `127.0.0.1`)
- `port` (number, required unless `NREPL_PORT` env var is set)
- `session` (string, optional)
- `ns` (string, optional)
- `timeoutMs` (number, default: `8000`)

**Environment**
- `NREPL_HOST` (default host if `host` arg missing)
- `NREPL_PORT` (default port if `port` arg missing)

The tool requires permission via the plugin permission store.

## Build

```bash
pnpm i
pnpm build
```

Output: `dist/plugin.js`

## Use as a local plugin

```bash
mkdir -p .opencode/plugins
cp dist/plugin.js .opencode/plugins/nrepl-eval.js
```

OpenCode loads local plugins from:
- `.opencode/plugins/`
- `~/.config/opencode/plugins/`

Exported named plugin: `MyPlugin`.

## Dev loop

```bash
pnpm watch
# in another terminal:
pnpm plugin:copy
```

Restart OpenCode to reload.

## Example tool call

```json
{
  "code": "(+ 1 2 3)",
  "host": "127.0.0.1",
  "port": 7888,
  "ns": "user"
}
```

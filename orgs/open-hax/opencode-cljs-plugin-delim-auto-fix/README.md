# OpenCode Delimiter Auto-Fix Plugin

OpenCode CLJS plugin that diagnoses delimiter issues and auto-corrects common mistakes.

## Tool

`delim/auto-fix`

**Args**
- `code` (string, required)
- `diagnostic` (string, optional)
- `maxFixes` (number, default: 5)

**Returns**
- `fixedCode` (string)
- `fixes` (array of `{kind, at, detail}`)
- `summary` (string)

## Build

```bash
pnpm i
pnpm build
```

Output: `dist/plugin.js`

## Use as a local plugin

```bash
mkdir -p .opencode/plugins
cp dist/plugin.js .opencode/plugins/delim-auto-fix.js
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
  "code": "(defn foo []\n  (println \"hi\")",
  "maxFixes": 3
}
```

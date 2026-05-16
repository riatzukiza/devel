## Signal

(己, p=0.98) Fixed the extension-load failure for:

`/home/err/devel/orgs/shuv/pi-mcp-adapter/index.ts`

(己, p=0.98) Root cause: the extension directory had no local `node_modules`, so this import failed:

`@modelcontextprotocol/ext-apps/app-bridge`

(己, p=0.98) I ran `npm install` inside:

`/home/err/devel/orgs/shuv/pi-mcp-adapter`

(己, p=0.96) I also built the interactive visualizer example because the repo test suite expects generated files under:

`examples/interactive-visualizer/dist/`

(己, p=0.99) No tracked files were changed. Only ignored local artifacts now exist:

- `orgs/shuv/pi-mcp-adapter/node_modules/`
- `orgs/shuv/pi-mcp-adapter/examples/interactive-visualizer/node_modules/`
- `orgs/shuv/pi-mcp-adapter/examples/interactive-visualizer/dist/`

## Evidence

(己, p=0.99) Exact failing import now resolves:

```bash
cd /home/err/devel/orgs/shuv/pi-mcp-adapter
node -e "import('@modelcontextprotocol/ext-apps/app-bridge').then(m=>console.log('ok', typeof m.getToolUiResourceUri, typeof m.buildAllowAttribute, m.RESOURCE_MIME_TYPE))"
```

Output:

```text
ok function function text/html;profile=mcp-app
```

(己, p=0.98) Test suite passes after dependency install and example build:

```text
Test Files  14 passed (14)
Tests       180 passed (180)
```

(己, p=0.99) Git status for the adapter has no tracked modifications; only ignored generated/local dependency directories.

## Frames

(世, p=0.92) This was a local dependency hydration problem, not a TypeScript source bug.

(世, p=0.72) Pi appears to be loading the extension directly from source and expects the extension’s own dependencies to already exist.

(己, p=0.81) The package already declared `@modelcontextprotocol/ext-apps`, so no code or manifest change was needed.

## Countermoves

(己, p=0.94) I reverted `package-lock.json` churn caused by local `npm install`, so no accidental lockfile noise remains.

(己, p=0.9) I did not commit because there were no tracked file changes to commit.

(世, p=0.75) `npm audit` reports vulnerabilities in installed dependencies, but that is separate from the extension-load failure.

## Next

(汝, p=0.95) Restart pi so the extension loader sees the hydrated local dependencies.
# Eta-mu runtime (Pi extensions) — shorthand + paths

When someone says **“eta-mu runtime”** in this `devel` workspace, they usually mean:

- the `@open-hax/eta-mu-extensions` package (CLJS) that builds Pi/OpenCode extensions
- plus its runtime state under `~/.ημ/state/…`
- plus the deployed compiled runtimes under `~/.pi/agent/extensions/cljs-*/`

This document exists so a human can say:

> “fix the eta-mu extension X”

…and an agent knows exactly which files and build steps that implies.

## Canonical locations (devel)

| What | Path |
|---|---|
| Source repo | `devel/orgs/open-hax/eta-mu/` |
| Extension package | `devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions/` |
| Extension manifest (declares names + source paths) | `…/packages/eta-mu-extensions/manifest.edn` |
| Extension sources (CLJS) | `…/packages/eta-mu-extensions/src/eta_mu/extensions/*.cljs` |
| Canonical eta-mu runtime root (must exist) | `~/.ημ` (symlink → `…/packages/eta-mu-extensions/`) |
| Runtime state (per extension) | `~/.ημ/state/<extension>/` |
| **Devel build/cache target** (shorthand) | `devel/@.ημ/` |
| Devel build/cache/state contents | `devel/@.ημ/{.build,.shadow-cljs,state,shadow-cljs.edn}` |
| Shared compiled runtime bundle | `…/packages/eta-mu-extensions/dist/runtime/<extension>.cjs` |
| Pi extension target wrapper | `…/packages/eta-mu-extensions/dist/pi/cljs-<extension>/index.ts` |
| OpenCode plugin target wrapper | `…/packages/eta-mu-extensions/dist/opencode/<extension>.mjs` |
| Pi built-in extension list | `package.json` → `pi.extensions` (do not sync into host settings) |
| OpenCode plugin enablement list | `~/.config/opencode/opencode.jsonc` → `plugin` |

Devel convention:
- `devel/@.ημ/` is the **place we want generated artifacts** (build cache + compiled outputs + state) to live.
- The package directory symlinks its generated dirs (`.build`, `.shadow-cljs`, `state`, `shadow-cljs.edn`) into `devel/@.ημ/`.

## What “fix the eta-mu extension X” means

Given an extension name like `session-mycology`, `receipt-river`, or `opmf-contract-gate`:

1. Find the source file via the manifest:
   - open `…/packages/eta-mu-extensions/manifest.edn`
   - locate `{:name "X" … :path "…"}`
   - edit that CLJS file (usually under `src/eta_mu/extensions/`)
2. Rebuild and materialize package-root targets. Pi uses eta-mu's built-in package metadata, so this must not edit `~/.pi/agent/settings.json` or `~/.ημ/agent/settings.json`:

```bash
pnpm -C devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions run build
```

Optional clean first (use when outputs are suspicious/stale):

```bash
pnpm -C devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions run clean
pnpm -C devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions run build
```

3. Reload Pi/OpenCode so the new runtime is actually used (restart, or `/reload` if supported).
4. Validate the package-root targets exist at:
   - `…/packages/eta-mu-extensions/dist/runtime/X.cjs`
   - `…/packages/eta-mu-extensions/dist/pi/cljs-X/index.ts`
   - `…/packages/eta-mu-extensions/dist/opencode/X.mjs`
5. If the bug is state-related, inspect:
   - `~/.ημ/state/X/`

### Legacy state fallback

Some extensions will fall back to legacy Pi state if `~/.ημ/state/<name>/` doesn’t exist:

- legacy state root: `~/.pi/agent/state/<name>/`

If behavior looks “haunted”, check both roots.

## Don’t edit generated outputs

- Do **not** hand-edit `dist/runtime/*.cjs`, `dist/pi/**`, or `dist/opencode/*.mjs` — they are generated.
- Do **not** copy generated runtimes into `~/.pi/agent/extensions` or `~/.config/opencode/plugins`; OpenCode host config should point at package-root targets, while Pi uses built-in eta-mu package metadata.
- If duplicate-tool conflicts mention old `~/.pi/agent/extensions/cljs-*` paths, rerun the eta-mu build; it removes managed legacy host copies after writing package-root targets.
- Do **not** commit `.build/`, `dist/`, `target/`, or generated `shadow-cljs.edn` from `eta-mu-extensions`.

## Common extensions

These are the usual suspects in Pi:

- `receipt-river`
- `session-mycology`
- `contract-runtime`
- `opmf-contract-gate` (output shape gate)
- `opencode-global-instructions`

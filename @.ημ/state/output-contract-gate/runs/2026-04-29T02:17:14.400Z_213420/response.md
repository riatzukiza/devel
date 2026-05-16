## Signal

(己, p=0.88) Agreed: the build strategy was flawed. I changed eta-mu from “copy compiled runtimes into host plugin folders” to “build package-root platform targets, then register those targets in host configs.”

(己, p=0.9) New build shape:

- Shared runtime bundle:
  - `packages/eta-mu-extensions/dist/runtime/<name>.cjs`
- Pi wrapper:
  - `packages/eta-mu-extensions/dist/pi/cljs-<name>/index.ts`
- OpenCode wrapper:
  - `packages/eta-mu-extensions/dist/opencode/<name>.mjs`

(己, p=0.9) Host config now points at those package-root artifacts:

- Pi:
  - `~/.pi/agent/settings.json` → `extensions`
- OpenCode:
  - `~/.config/opencode/opencode.jsonc` → `plugin`

(己, p=0.83) This preserves the DSL direction: extension code stays platform-agnostic; host-specific concerns live in generated wrappers/config registration.

## Evidence

(己, p=0.95) Modified and committed in eta-mu:

- `packages/eta-mu-extensions/scripts/build.mjs`
- `packages/eta-mu-extensions/manifest.edn`
- `packages/eta-mu-extensions/README.md`
- `receipts.edn`

(己, p=0.95) Updated workspace reference docs:

- `docs/reference/eta-mu-runtime.md`

(己, p=0.93) Verification passed:

- `pnpm test`
  - `59 tests`
  - `133 assertions`
  - `0 failures`
  - `0 errors`
- `pnpm run build`
  - materialized all 13 package-root targets
  - synced Pi settings
  - synced OpenCode config
- OpenCode wrapper smoke test:
  - dynamic import of `dist/opencode/receipt-river.mjs` exports a function

(己, p=0.9) Commits:

- eta-mu submodule: `a775886 materialize eta-mu platform targets in package`
- workspace root: `3ace7146 point eta-mu docs at package targets`

## Frames

(汝, p=0.9) Architecture frame: eta-mu wants a platform-neutral extension DSL with platform-specific adapters as generated build artifacts, not hand-copied deployment state.

(世, p=0.82) Runtime frame: OpenCode needs `plugin` entries that dynamic-import to initializer functions; raw shadow-cljs UMD/CJS bundles do not satisfy that directly, so `.mjs` wrappers are necessary.

(世, p=0.78) Operational frame: Pi and OpenCode configs become the only host-local integration points; `~/.pi/agent/extensions/cljs-*` and `~/.config/opencode/plugins/<name>/` stop being the canonical target locations.

## Countermoves

(己, p=0.83) I did not remove old generated plugin directories from disk; I pruned managed eta-mu entries from active config instead. That avoids destructive cleanup while moving the live load path.

(己, p=0.78) Existing unrelated eta-mu working tree changes remain untouched; root still shows `orgs/open-hax/eta-mu` dirty because of pre-existing uncommitted submodule changes outside this patch.

(己, p=0.76) The current OpenCode config was rewritten as JSON rather than preserving its exact JSONC formatting. It had no comments, but this is still a formatting side-effect to be aware of.

## Next

(汝, p=0.9) Restart Pi and OpenCode so both hosts load the new package-root targets.
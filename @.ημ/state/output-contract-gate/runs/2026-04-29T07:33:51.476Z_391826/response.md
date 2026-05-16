## Signal

(ctx=己, p=0.99) Correct — that was the intended adoption path. I updated the PR so CLJS is now imported from the TypeScript runtime as the first progressive bridge.

(ctx=世, p=0.98) Pushed:

```text
76b4d41 Add TypeScript CLJS runtime bridge
```

(ctx=世, p=0.97) What changed:

```text
shadow-cljs.edn
- Added :runtime ESM target that emits dist/cljs/proxx-runtime.js.

src/proxx/runtime.cljs
- New CLJS runtime facade exporting:
  - normalizeKeys
  - validateEntity
  - projectPheromone

src/lib/cljs-runtime.ts
- New typed TypeScript lazy loader for the CLJS ESM artifact.
- Includes readiness checks that actually call CLJS functions.

src/main.ts
- TypeScript runtime now attempts to load CLJS at startup.
- If loaded, it runs readiness checks and logs “CLJS runtime loaded”.
- If absent in non-required mode, TS remains authoritative and logs a warning.

Dockerfile
- Production container now installs Java for shadow-cljs build.
- Production build runs `pnpm build:runtime`.
- Container sets `PROXX_CLJS_RUNTIME_REQUIRED=true`, so Docker runtime fails if CLJS artifact is missing.

package.json
- Added:
  - `build:cljs`
  - `build:runtime`
  - `test:cljs-runtime`
- `dev` now builds CLJS before starting TS.
```

(ctx=己, p=0.95) Important nuance: CLJS is now on the runtime startup path, but no business decision path has been replaced yet. This is the bridge layer needed for gradual replacement.

## Evidence

(ctx=世, p=0.99) Verified locally:

```text
npx clj-kondo --lint src/proxx test/proxx
# errors: 0, warnings: 0

pnpm typecheck
# pass

pnpm test:cljs-runtime
# cljs-runtime-ok

pnpm test:cljs
# Ran 51 tests containing 100 assertions.
# 0 failures, 0 errors.

pnpm build
# pass
```

(ctx=世, p=0.93) `pnpm lint:errors` was not runnable in this worktree because `node_modules/eslint` is not installed locally.

(ctx=世, p=0.95) PR checks after push:

```text
cljs-unit-tests SUCCESS
cljs-lint SUCCESS
staging-lint SUCCESS
staging-typecheck SUCCESS
eta-mu SUCCESS
coderabbit-review-gate SUCCESS
```

(ctx=世, p=0.88) `staging-unit-tests` and `staging-coverage` were still in progress at last check.

## Frames

(ctx=己, p=0.93) Frame 1: This turns the CLJS layer from “test-only substrate” into a runtime-loadable module.

(ctx=己, p=0.91) Frame 2: The TypeScript runtime still owns behavior, but it now has a typed seam where CLJS functions can replace TS pieces incrementally.

(ctx=己, p=0.88) Frame 3: Docker production is stricter than local TS-only builds: `PROXX_CLJS_RUNTIME_REQUIRED=true` means production should prove CLJS exists at startup.

## Countermoves

(ctx=己, p=0.96) I did not replace policy/provider/account routing yet.

(ctx=己, p=0.94) I did not make every `pnpm build` require Java/shadow-cljs; only `build:runtime` does. That avoids breaking existing TS-only CI paths while enabling Docker runtime adoption.

(ctx=己, p=0.90) I did not commit generated `dist/cljs` artifacts; they are build outputs.

## Next

(ctx=己, p=0.96) Replace one tiny TS business function with a call through `src/lib/cljs-runtime.ts`, ideally `normalizeKeys` or schema validation first.
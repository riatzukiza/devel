## Signal

(ctx=己, p=0.99) Continued. CLJS is now doing one real runtime job, not just loading at startup.

(ctx=世, p=0.98) Pushed:

```text
68c9083 Route settings normalization through CLJS bridge
```

(ctx=世, p=0.97) New behavior:

```text
src/main.ts
- Loads and activates the CLJS runtime before createApp(config).
- This lets app construction / warmup code use CLJS-backed helpers.

src/lib/cljs-runtime.ts
- Adds active runtime registration:
  - setActiveCljsRuntime()
  - getActiveCljsRuntime()
  - normalizeObjectKeysWithCljs()

src/lib/proxy-settings-store.ts
- Proxy settings normalization now routes object key normalization through active CLJS normalizeKeys when available.
- Keeps TypeScript fallback semantics when CLJS is absent.
- Supports both existing camelCase keys and CLJS-normalized kebab-case keys.

src/tests/proxy-settings-store.test.ts
- Adds regression test proving ProxySettingsStore consumes CLJS-normalized keys.
```

(ctx=己, p=0.95) This is the first actual progressive replacement seam: settings input normalization can now be handled by CLJS while the rest of the TS settings logic remains intact.

## Evidence

(ctx=世, p=0.99) Local verification passed:

```text
npx clj-kondo --lint src/proxx test/proxx
pnpm typecheck
pnpm test:cljs-runtime
pnpm test:cljs
pnpm build
node --test --test-concurrency=1 dist/tests/proxy-settings-store.test.js
```

(ctx=世, p=0.98) Test results:

```text
CLJS tests: 51 tests, 100 assertions, 0 failures, 0 errors
Proxy settings tests: 4 pass
```

(ctx=世, p=0.94) Branch is clean and pushed:

```text
fix/cljs-foundation-recovery...origin/fix/cljs-foundation-recovery
```

(ctx=世, p=0.86) PR checks restarted after push; at last check only `testing-eligibility` had queued so far.

## Frames

(ctx=己, p=0.92) Frame 1: We now have a real TS→CLJS runtime bridge plus one low-risk adopted behavior.

(ctx=己, p=0.90) Frame 2: The migration path is now established: activate CLJS early, then move normalization/schema/processor logic behind typed TS wrappers one seam at a time.

(ctx=己, p=0.87) Frame 3: This avoids a big-bang rewrite while making future CLJS adoption testable in normal TS unit tests.

## Countermoves

(ctx=己, p=0.96) I did not replace routing or provider policy yet.

(ctx=己, p=0.95) I kept fallback behavior so local TS-only runtime can still operate if the CLJS artifact is absent outside required Docker mode.

(ctx=己, p=0.93) I did not commit generated `dist`, `target`, `.shadow-cljs`, or `.clj-kondo/.cache`.

## Next

(ctx=己, p=0.96) Move provider credential/schema validation through `validateEntity` next, likely in JSON/env seeding.
## Signal

(ctx=己, p=0.99) Created the recovery PR:

https://github.com/open-hax/proxx/pull/200

(ctx=己, p=0.98) Branch:

```text
fix/cljs-foundation-recovery -> staging
```

(ctx=己, p=0.98) Commit:

```text
f981676d1bdc4d5d09a8326f01a4b769dae0c2fa Restore CLJS data layer foundation
```

(ctx=己, p=0.96) Restored the narrow CLJS foundation, not the stale branch wholesale:

```text
.clj-kondo/config.edn
.github/workflows/cljs-test.yml
shadow-cljs.edn
src/proxx/cache_policy.cljs
src/proxx/processor.cljs
src/proxx/schema.cljs
test/proxx/cache_policy_test.cljs
test/proxx/processor_test.cljs
test/proxx/schema_test.cljs
```

(ctx=己, p=0.95) Also repaired the seams exposed by restoring the harness:

```text
package.json
src/proxx/boot.cljs
src/proxx/pipeline.cljs
test/proxx/boot_test.cljs
```

## Evidence

(ctx=世, p=0.99) PR is open against `staging`:

```json
{
  "url": "https://github.com/open-hax/proxx/pull/200",
  "headRefName": "fix/cljs-foundation-recovery",
  "baseRefName": "staging",
  "state": "OPEN",
  "commits": ["f981676d1bdc4d5d09a8326f01a4b769dae0c2fa"]
}
```

(ctx=世, p=0.98) Verification passed:

```text
npx clj-kondo --lint src/proxx test/proxx
# errors: 0, warnings: 0

pnpm test:cljs
# Ran 48 tests containing 94 assertions.
# 0 failures, 0 errors.
```

(ctx=世, p=0.93) `shadow-cljs` still emits existing interop inference warnings in Redis/Postgres store code, but compile and tests pass.

## Frames

(ctx=己, p=0.93) This PR makes current `staging` coherent as a CLJS foundation again: missing namespaces are restored and gated.

(ctx=己, p=0.90) I intentionally did not restore the old ledger/e2e slice; that should be a separate salvage PR because it has broader runtime semantics.

(ctx=己, p=0.88) I added `:provider-credential` schema/cache coverage because boot seeding already depended on it and restored validation made that gap visible.

## Countermoves

(ctx=己, p=0.96) Did not merge `origin/feat/cljs-data-layer` wholesale.

(ctx=己, p=0.95) Did not touch the existing dirty state in the main `orgs/open-hax/proxx` worktree; work was done in a dedicated worktree.

(ctx=己, p=0.94) Removed generated `.shadow-cljs`, `.clj-kondo/.cache`, and `target` outputs before commit.

## Next

(ctx=己, p=0.96) Review and merge PR #200 once GitHub CI finishes.
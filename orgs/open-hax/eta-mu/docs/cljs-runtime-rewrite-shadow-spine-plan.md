# Eta-mu CLJS Runtime Rewrite — Shadow-CLJS Spine Plan

Date: 2026-05-29
Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
Kanban task: `kanban/tasks/eta-mu-cljs-rewrite-shadow-spine.md`
Inventory: `docs/cljs-runtime-rewrite-architecture-inventory.md`

## Purpose

Define the first CLJS build spine for the eta-mu runtime rewrite before writing implementation code.

The spine must prove that eta-mu can compile CLJS to Node-importable ESM, run CLJS tests, and preserve existing package compatibility while TypeScript wrappers remain in place.

## Decision recommendation

Start inside `packages/eta-mu-runtime`, not in a new temporary package.

Rationale:

- `@open-hax/eta-mu-runtime` is the smallest central package with pure state/envelope/planner semantics.
- Keeping the first spine in the target package avoids a throwaway package name and publish confusion.
- Existing TS exports can stay as the public contract until CLJS parity is proven.
- The package can expose compiled CLJS through a private smoke path first, then switch the public `exports["."]` only after tests pass.

Rejected for first slice:

- `packages/eta-mu-runtime-cljs`: lower risk to the existing package, but creates temporary package-management and publish semantics.
- root-level `shadow-cljs.edn` only: useful for the existing browser app, but too broad for a package-level runtime proof.
- starting in `packages/coding-agent`: too many I/O and UI boundaries before the CLJS ESM proof exists.

## Proposed package layout

```text
packages/eta-mu-runtime/
  shadow-cljs.edn
  src/
    cljs/
      eta_mu/runtime/facade.cljs
      eta_mu/runtime/domain/state.cljs
      eta_mu/runtime/domain/planner.cljs
      eta_mu/runtime/shape/envelope.cljs
      eta_mu/runtime/law/envelope.cljs
  test/
    cljs/
      eta_mu/runtime/domain/state_test.cljs
      eta_mu/runtime/shape/envelope_test.cljs
      eta_mu/runtime/facade_test.cljs
  scripts/
    smoke-cljs-runtime.mjs
    check-cljs-boundaries.mjs
  dist/           # existing TS public output remains initially
  dist-cljs/      # compiled CLJS ESM output, ignored or packaged only after cutover
  target/         # CLJS test output
```

Namespace rule:

- Clojure namespace root: `eta-mu.runtime.*`
- Filesystem path: `eta_mu/runtime/**`
- JS-facing exports: only from `eta-mu.runtime.facade` until the cutover task expands exports.

## Proposed `shadow-cljs.edn` shape

```clojure
{:source-paths ["src/cljs" "test/cljs"]
 :dependencies [[metosin/malli "0.16.4"]]
 :js-options {:js-provider :import}
 :builds
 {:runtime
  {:target :esm
   :runtime :node
   :output-dir "dist-cljs"
   :modules {:index {:exports {:normalizeEnvelope eta-mu.runtime.facade/normalize-envelope
                                :initialState eta-mu.runtime.facade/initial-state
                                :planNext eta-mu.runtime.facade/plan-next}}}
   :compiler-options {:output-feature-set :es-next
                      :optimizations :simple
                      :source-map true}}

  :test
  {:target :node-test
   :output-to "target/cljs-test.cjs"
   :ns-regex ["eta-mu.runtime.*-test$"]
   :autorun true
   :compiler-options {:output-feature-set :es-next
                      :optimizations :none
                      :source-map true}}}}
```

This is intentionally smaller than Knoxx's backend build. Eta-mu should add server/runtime targets only when a migrated slice needs them.

## Proposed `package.json` script additions

Do not replace existing TS scripts during spine setup. Add CLJS-specific scripts first:

```json
{
  "scripts": {
    "cljs:compile": "shadow-cljs compile runtime",
    "cljs:test": "shadow-cljs compile test && node target/cljs-test.cjs",
    "cljs:smoke": "node scripts/smoke-cljs-runtime.mjs",
    "cljs:boundary": "node scripts/check-cljs-boundaries.mjs",
    "cljs:verify": "pnpm cljs:compile && pnpm cljs:test && pnpm cljs:smoke && pnpm cljs:boundary"
  }
}
```

Existing scripts stay authoritative for the published package until cutover:

```bash
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
```

## ESM runtime smoke requirement

After every `shadow-cljs compile runtime`, run a real Node import smoke, not just compilation.

Example smoke:

```js
// packages/eta-mu-runtime/scripts/smoke-cljs-runtime.mjs
const mod = await import("../dist-cljs/index.js");
const expected = ["normalizeEnvelope", "initialState", "planNext"];
for (const key of expected) {
  if (typeof mod[key] !== "function") {
    throw new Error(`missing CLJS ESM export: ${key}`);
  }
}
console.log(JSON.stringify({ ok: true, exports: expected }));
```

Why this gate is mandatory:

- shadow-cljs `:esm` builds can compile while runtime imports expose `undefined` if namespace init/export wiring drifts.
- Node import catches package/module semantics that the compiler does not.
- Heavy I/O should remain in `.mjs` shims or named `extern.*` adapters rather than being forced through early CLJS exports.

## Boundary gate shape

The first boundary scanner can be intentionally simple. It should fail if raw interop appears outside allowed paths.

Allowed initially:

- `src/cljs/eta_mu/runtime/extern/**`
- `src/cljs/eta_mu/runtime/facade.cljs`
- `test/cljs/**` for test doubles only, if annotated in a small allowlist

Disallowed elsewhere:

- `js/`
- `js->clj`
- `clj->js`
- `#js`
- `aget`
- `aset`
- `js/Promise`
- `js/JSON`
- `js/Array.from`
- Node globals or SDK-native object access
- namespace path segment `/utils/` or namespace segment `.utils`

First script behavior:

```text
node scripts/check-cljs-boundaries.mjs
- walk src/cljs/**/*.cljs
- ignore allowed extern/facade files
- report line-numbered disallowed raw interop tokens
- report any namespace containing utils
- exit 1 on findings
```

## First export set

Use tiny pure exports first. They should map to the current TS runtime concepts without owning provider/session I/O.

Candidate exports:

- `normalizeEnvelope`: validates and normalizes an action/movement envelope
- `initialState`: returns a canonical initial runtime state map
- `planNext`: computes the next pure planner decision from state plus signal

Do not export provider calls, filesystem access, process execution, git operations, web fetches, or package-manager behavior in the first spine.

## Test plan

Minimum CLJS tests:

- envelope accepts a minimal valid shape
- envelope rejects malformed required fields
- initial state returns a map matching existing TS defaults
- planner returns a deterministic no-op/next-step decision for a simple input
- facade exports are callable from CLJS tests

Minimum JS/Node tests:

- smoke import sees all expected ESM exports as functions
- representative payload can round-trip from JS object to CLJS normalization and back to plain JSON-compatible data

## Cutover guardrails

Do not switch `package.json` public `main`, `types`, or `exports` in the spine task.

The spine task is done when CLJS compile/test/smoke/boundary gates pass while existing TS gates still pass. Public export replacement belongs to `eta-mu-cljs-rewrite-surface-parity` or `eta-mu-cljs-rewrite-cutover-ratchet`.

## Acceptance checklist for the spine task

- [ ] `packages/eta-mu-runtime/shadow-cljs.edn` exists with `:runtime` and `:test` targets.
- [ ] `pnpm --dir packages/eta-mu-runtime cljs:compile` passes.
- [ ] `pnpm --dir packages/eta-mu-runtime cljs:test` passes.
- [ ] `pnpm --dir packages/eta-mu-runtime cljs:smoke` proves Node can import CLJS ESM exports.
- [ ] `pnpm --dir packages/eta-mu-runtime cljs:boundary` rejects disallowed raw JS interop outside allowed namespaces.
- [ ] Existing TS gates still pass: `test` and `typecheck`.
- [ ] No public package export is changed until parity tasks approve it.

## Recommended next implementation move

Implement only the minimal spine in `packages/eta-mu-runtime` and export placeholder-compatible pure functions backed by tests. Treat the Node import smoke as a blocking gate after every shadow-cljs build.

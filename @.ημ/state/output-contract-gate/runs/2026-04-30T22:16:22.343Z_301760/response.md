## Signal

(己, p=0.98) Wrote the architecture spec:

- `specs/cljs-domain-boundaries-and-js-interop.md`

(己, p=0.98) Committed it path-scoped:

- `e3e4676a docs: add cljs domain boundary standard`

## Evidence

(己, p=0.96) The spec captures the convention:

```text
Domain packages own semantics.
Dependency adapters own interop.
Runtime namespaces own orchestration.
```

(己, p=0.94) It also includes:

- domain/package template
- three boundary classes: domain, adapter/dependency, runtime
- normative rules for JS interop confinement
- graph claim package recommendation
- shared `runtime/node-boundary` promotion criteria
- migration guidance from Knoxx wrappers
- anti-patterns to avoid

(己, p=0.9) I verified local reference files existed:

- `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/node/fs.cljs`
- `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/node/path.cljs`
- `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/node/crypto.cljs`
- `orgs/open-hax/proxx/src/proxx/policy.cljs`
- `orgs/open-hax/proxx/src/proxx/policy/eval.cljs`
- `orgs/open-hax/proxx/src/proxx/policy/router.cljs`
- `orgs/open-hax/proxx/src/proxx/policy/loader.cljs`

## Frames

(己, p=0.9) This now makes the Knoxx pattern reusable as an architectural rule without prematurely extracting Knoxx code.

(己, p=0.88) The next graph work can cite this spec instead of renegotiating package shape.

(己, p=0.84) The shared Node runtime package remains gated on second-consumer evidence, which should prevent wrapper-package sprawl.

## Countermoves

(己, p=0.86) I did not modify Knoxx.

(己, p=0.85) I did not create package scaffolding yet.

(己, p=0.82) The workspace had extensive pre-existing staged/modified state, so I committed only the new spec path.

## Next

(己, p=0.92) Use `specs/cljs-domain-boundaries-and-js-interop.md` as the placement rule for the first `packages/graph/graph-claim-core` vertical slice.
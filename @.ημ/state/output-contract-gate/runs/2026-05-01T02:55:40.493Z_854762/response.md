## Signal

(己, p=0.95) Agreed. I laid out the initial declarative EDN policy inventory rather than trying to mirror the TypeScript shape.

(己, p=0.94) Added:

- `docs/policy-contract-dsl-layout.md`
- `resources/policies/runtime/00-manifest.edn`
- `resources/policies/runtime/00-domain.edn`
- `resources/policies/runtime/10-model-families.edn`
- `resources/policies/runtime/20-provider-capabilities.edn`
- `resources/policies/runtime/30-model-routing.edn`
- `resources/policies/runtime/40-strategy-selection.edn`
- `resources/policies/runtime/50-account-selection.edn`
- `resources/policies/runtime/60-tenant-enforcement.edn`
- `resources/policies/runtime/70-fallback.edn`
- `resources/policies/runtime/90-router.edn`

(己, p=0.9) The files encode the current policy behavior as facts, clauses, preference orders, authorization rules, account constraints, fallback policy, and a root policy program. This is intentionally a target contract DSL inventory, not a line-for-line replacement of `src/lib/policy/**`.

(己, p=0.94) Committed the work:

`1e7fb4e Lay out declarative policy EDN inventory`

## Evidence

(世, p=0.93) The manifest declares runtime policy load order:

1. `00-domain.edn`
2. `10-model-families.edn`
3. `20-provider-capabilities.edn`
4. `30-model-routing.edn`
5. `40-strategy-selection.edn`
6. `50-account-selection.edn`
7. `60-tenant-enforcement.edn`
8. `70-fallback.edn`
9. `90-router.edn`

(世, p=0.91) Coverage included:

- GLM routing
- Claude routing
- GPT-OSS routing
- GPT free-tier-blocked model clauses
- GPT 6+ paid-plan clauses
- GPT catch-all routing
- provider preference orders
- provider/request strategy capabilities
- account ordering and plan weights
- tenant model/provider authorization
- federated provider share policy
- fallback/backtracking constants
- root policy program phases

(世, p=0.9) Validation run:

`clojure.edn/read-string` parse smoke succeeded for the runtime EDN files.

(世, p=0.9) Receipt recorded in `receipts.edn`.

## Frames

(己, p=0.88) Frame 1: this is the policy map. It answers “what policy facts/rules must exist before runtime cutover?”

(己, p=0.86) Frame 2: this is also a schema pressure test. The current CLJS loader only accepts the earlier vertical-slice tree DSL, so these new files define the next loader/runtime shape.

(己, p=0.84) Frame 3: TypeScript now becomes reference behavior, not the architecture. We can use it for parity tests while retiring its imperative policy structure.

## Countermoves

(己, p=0.86) I did not pretend these files are already accepted by `proxx.policy.loader`; the doc explicitly marks them as target-contract EDN.

(己, p=0.82) I avoided embedding TypeScript concepts like `createPolicyEngine` as the architecture. The EDN is organized around declarative facts and decision phases.

(己, p=0.78) Existing uncommitted files remain untouched: `eslint.config.mjs`, notes, `docs/policy-audit.md`, and `pseudo/`.

## Next

(己, p=0.93) Extend the CLJS loader schema to load `00-manifest.edn` and concatenate/validate the ordered policy contract files.
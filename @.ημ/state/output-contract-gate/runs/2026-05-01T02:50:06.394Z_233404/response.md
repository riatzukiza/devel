## Signal

(己, p=0.86) The policy engine migration in `orgs/open-hax/proxx` is best described as: foundational CLJS runtime and a parallel EDN policy router exist, but the production TypeScript policy engine is still authoritative for live routing/account/strategy/tenant decisions.

(己, p=0.82) Rough migration extent by function:

| Area | Status | Evidence |
|---|---:|---|
| CLJS build/runtime bridge | Mostly done | `shadow-cljs.edn`, `src/lib/cljs-runtime.ts`, `src/main.ts`, `package.json` scripts |
| CLJS schema/data validation foundation | Partly done | `src/proxx/schema.cljs`, `validateEntity` runtime export |
| CLJS policy interpreter/router | Prototype / vertical slice done | `src/proxx/policy.cljs`, `src/proxx/policy/eval.cljs`, `src/proxx/policy/router.cljs`, `src/proxx/policy/loader.cljs` |
| EDN policy sample | Started | `resources/policies/model-router.edn`, `pseudo/policy.edn` |
| TS engine replacement | Not done | live app still initializes `initializePolicyEngine(...)` / `createPolicyEngine(...)` |
| Live route integration of CLJS policy router | Not done / boundary only | `src/app.ts` only logs “CLJS policy router runtime boundary available”; I found no live `routePolicy(...)` use in routes |
| Account ordering migration | Not done | still TypeScript: `src/lib/policy/engine/account-ordering.ts` |
| Provider ordering migration | Not done | still TypeScript: `src/lib/policy/engine/provider-ordering.ts` |
| Strategy selection migration | Not done | still TypeScript: `src/lib/policy/engine/strategy-selection.ts` |
| Tenant model/provider enforcement migration | Not done | still TypeScript: `src/lib/policy/engine/tenant-enforcement.ts` |
| Test coverage for CLJS policy slice | Present | `test/proxx/policy_test.cljs`; receipt says `pnpm test:cljs` passed with 67 tests / 140 assertions |

(己, p=0.78) Overall: about 20–30% migrated if counting infrastructure and prototype semantics; closer to 0–10% migrated if “migrated” means “production traffic now uses CLJS instead of TS for the policy engine.”

## Evidence

(世, p=0.95) Current branch is `staging` at `0ef45a6`; relevant CLJS/TS policy files showed no uncommitted diffs in the checked paths.

(世, p=0.95) The TypeScript policy engine remains the app dependency:
- `src/app.ts` initializes `policyEngine = await initializePolicyEngine(config.policyConfigPath)` and falls back to `createPolicyEngine(DEFAULT_POLICY_CONFIG)`.
- `src/app.ts` only checks `getActiveCljsRuntime()` and logs that the CLJS policy router boundary is available.

(世, p=0.94) The CLJS runtime is loadable and exported:
- `src/lib/cljs-runtime.ts` defines runtime functions: `normalizeKeys`, `validateEntity`, `projectPheromone`, `routePolicy`.
- `src/main.ts` loads CLJS runtime with `loadCljsRuntime(...)`, runs `assertCljsRuntimeReady(...)`, and registers it with `setActiveCljsRuntime(...)`.
- `package.json` has `build:cljs`, `build:runtime`, `test:cljs`, and `test:cljs-runtime`.

(世, p=0.93) The CLJS policy slice includes:
- `src/proxx/policy.cljs`: strategy registry, condition/filter evaluation, `:next`, `:reduce`, `:apply`, `:try`.
- `src/proxx/policy/eval.cljs`: restricted evaluator for `=`, `not`, `and`, `or`, `get`, `get-in`, string ops, etc.
- `src/proxx/policy/router.cljs`: tries policies and throws `"Policy tree exhausted"` with trace.
- `src/proxx/policy/loader.cljs`: EDN loading and validation.
- `src/proxx/runtime.cljs`: exports `route-policy-js`.

(世, p=0.9) Existing TypeScript policy surface is still substantial: `src/lib/policy/**`, `src/lib/provider-policy.ts`, `src/lib/tenant-provider-policy.ts`, and policy tests remain in TS; rough line count from inspected files was ~4.2k TS policy/test lines vs ~2.0k CLJS/test/EDN foundation lines.

(世, p=0.9) Receipt River records the policy slice as completed in a worktree:
`Added CLJS EDN policy interpreter/router with Malli policy schemas, safe predicate evaluator, strategy registry, EDN loader, boot policy storage, runtime routePolicy boundary, sample model-router policy, and coverage for AND/OR/backtracking/filter/trace/exhaustion semantics.`

## Frames

(己, p=0.82) Frame 1: “Migration” as infrastructure: good progress. CLJS can build, load, export runtime functions, and pass smoke tests.

(己, p=0.86) Frame 2: “Migration” as semantic parity: early. The CLJS policy router covers a generic EDN tree/interpreter model, but the concrete TS policy behaviors are still mostly not ported.

(己, p=0.88) Frame 3: “Migration” as production cutover: not yet. Production request paths still use the TS `PolicyEngine` for ordering, selection, and tenant checks.

## Countermoves

(己, p=0.84) Do not call this “done” until at least one live route uses `getActiveCljsRuntime().routePolicy(...)` for a real policy decision with TS fallback and parity tests.

(己, p=0.8) Do not delete the TS policy engine yet; it still contains important concrete logic for account ordering, model routing, strategy selection, and tenant enforcement.

(己, p=0.72) Treat `docs/policy-audit.md` cautiously: it flags issues in the CLJS slice, but one claim about `catch :default` being categorically invalid may itself need verification before acting on it.

## Next

(己, p=0.9) Pick one narrow TS behavior, preferably provider ordering or strategy selection, write a TS-vs-CLJS parity test, then route only that decision through CLJS behind fallback.
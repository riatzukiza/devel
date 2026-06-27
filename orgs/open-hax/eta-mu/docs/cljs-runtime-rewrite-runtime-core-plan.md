# Eta-mu CLJS Runtime Rewrite — Runtime Core Port Plan

Date: 2026-05-29
Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
Kanban task: `kanban/tasks/eta-mu-cljs-rewrite-runtime-core.md`
Depends on: `docs/cljs-runtime-rewrite-shadow-spine-plan.md`
Inventory: `docs/cljs-runtime-rewrite-architecture-inventory.md`

## Purpose

Define the first pure runtime domain to port after the CLJS spine exists. The goal is to move eta-mu's movement/state/envelope semantics into ClojureScript without dragging filesystem, provider SDK, terminal, browser, git, or OpenCode host effects into the first port.

This is the rewrite's first real Knoxx-style domain/law/shape slice:

- `domain.*`: decisions over already-normalized maps
- `law.*`: schemas and guards
- `shape.*`: compatibility transforms between JS public payloads and CLJS internal maps
- `facade`: tiny JS-facing wrapper until public package cutover

## Source slice

Primary source package:

- `packages/eta-mu-runtime/src/types.ts`
- `packages/eta-mu-runtime/src/state.ts`
- `packages/eta-mu-runtime/src/planner.ts`
- `packages/eta-mu-runtime/src/envelope.ts`
- `packages/eta-mu-runtime/src/index.ts`
- `packages/eta-mu-runtime/tests/runtime.test.ts`

Secondary follow-up source once the pure runtime slice passes:

- `packages/coding-agent/src/core/messages.ts`
- selected `packages/coding-agent/test/*message*.test.ts`
- selected `packages/coding-agent/test/agent-session-*.test.ts` only where they assert pure data transformations rather than live agent I/O

## Internal naming decision

Use kebab-case keys inside CLJS and preserve camelCase at the JS facade boundary.

Example:

```clojure
;; internal CLJS map
{:social-friction 0.2
 :deploy-risk 0.1
 :user-intent-confidence 0.8}

;; public JS payload remains compatible
{"socialFriction" 0.2
 "deployRisk" 0.1
 "userIntentConfidence" 0.8}
```

Why:

- CLJS domain/law code should be idiomatic and readable.
- Existing TypeScript/JavaScript callers expect camelCase.
- The `shape.*` layer makes the conversion visible and testable rather than scattered through domain code.

## Target namespace map

| Current TS source | Target CLJS namespace | Category | Notes |
|---|---|---|---|
| `types.ts` enum/string unions | `eta-mu.runtime.law.types` | law | Malli enums and shared scalar schemas. |
| `types.ts` object schemas | `eta-mu.runtime.law.state`, `eta-mu.runtime.law.envelope`, `eta-mu.runtime.law.planning` | law | Split by meaning instead of one schema drawer. |
| `state.ts` `DEFAULT_ETA_BELIEF` | `eta-mu.runtime.domain.state` | domain | Constant should use internal kebab keys. |
| `state.ts` `createEtaBelief` | `eta-mu.runtime.domain.state/create-belief` | domain + law | Domain clamps; law validates final shape. |
| `state.ts` `createBreathEpisode` | `eta-mu.runtime.domain.breath/create-episode` | domain | Time value is passed in; no hidden clock in pure domain. |
| `state.ts` `createEtaMuState` | `eta-mu.runtime.domain.state/create-state` | domain | Current timestamp supplied by facade/infra if absent. |
| `planner.ts` `selectPanelsFromContext` | `eta-mu.runtime.domain.planner/select-panels` | domain | Pure category rule over normalized context. |
| `planner.ts` `rankCheapMuCandidates` | `eta-mu.runtime.domain.planner/rank-cheap-candidates` | domain | Deterministic candidate generation/ranking. |
| `planner.ts` candidate helpers | `eta-mu.runtime.domain.candidate` | domain | ID, priority, and candidate construction. |
| `envelope.ts` `recommendBreath` | `eta-mu.runtime.domain.breath/recommend` | domain | Breath decision over context and candidates. |
| `envelope.ts` `createActionBatch` | `eta-mu.runtime.domain.envelope/create-action-batch` | domain | Builds batch, law validates output. |
| TS/JS camelCase payloads | `eta-mu.runtime.shape.compat` | shape | JS in/out key conversion and defaulting. |
| public ESM exports | `eta-mu.runtime.facade` | facade | Temporary JS-facing API until package cutover. |

## Malli schema plan

Minimum schema set:

```clojure
(def UnitInterval [:and number? [:>= 0] [:<= 1]])
(def PanelName [:enum :field :movement :truth :trajectory :breath :memory :cost])
(def CostClass [:enum :cheap :medium :expensive])
(def Reversibility [:enum :easy :moderate :hard])
(def MuCandidateKind [:enum :comment :summary :label :issue :patch-plan :patch
                      :reroute :defer :request-evidence
                      :request-human-attention :noop])
```

Then compose:

- `EtaBelief`
- `MuCandidate`
- `BreathEpisode`
- `EtaMuState`
- `EtaMuPlanningContext`
- `BreathRecommendation`
- `EtaMuActionBatch`

Validation rule:

- Domain functions validate final outputs in tests and at facade boundaries.
- Domain-internal helper functions should not parse JS payloads.
- `shape.compat` owns camelCase/kebab-case and defaults.

## Function parity contract

The initial CLJS facade should expose functions equivalent to the current package surface:

| Current public export | First CLJS facade export | Compatibility expectation |
|---|---|---|
| `createEtaBelief` | `createEtaBelief` | Clamps unit interval values and returns camelCase JS-compatible object. |
| `createBreathEpisode` | `createBreathEpisode` | Preserves `openedAt`, `lastActivityAt`, `activityScalar`, `pendingCommit`. |
| `createEtaMuState` | `createEtaMuState` | Default panels remain `field`, `movement`; episode default remains `episode:bootstrap`. |
| `selectPanelsFromContext` | `selectPanelsFromContext` | Same panel ordering as current TS tests. |
| `rankCheapMuCandidates` | `rankCheapMuCandidates` | Same candidate kinds and ranking. |
| `recommendBreath` | `recommendBreath` | Same quiet-window and pending-commit behavior. |
| `createActionBatch` | `createActionBatch` | Emits `kind: eta-mu-action-batch.v1`. |

Public Typescript types stay generated/hand-authored during transition. Do not remove `.d.ts` compatibility until the cutover task.

## Initial test parity

Port the existing Vitest cases into CLJS test names:

| Current test | CLJS test |
|---|---|
| `createEtaBelief clamps values into the unit interval` | `create-belief-clamps-unit-interval-test` |
| `selectPanelsFromContext surfaces truth, trajectory, and breath under active pressure` | `select-panels-pressure-test` |
| `rankCheapMuCandidates asks for evidence before stronger movement when ambiguity is high` | `rank-cheap-candidates-ambiguity-test` |
| `createActionBatch emits a noop batch when no cheap movement is justified` | `create-action-batch-noop-test` |

Add two new rewrite-specific tests:

- `js-compat-roundtrip-test`: camelCase JS payload -> CLJS kebab map -> camelCase JS-compatible output.
- `malformed-context-rejected-test`: a non-unit belief scalar or missing required planning context field fails with a structured error.

## Coding-agent message core follow-up

After `eta-mu-runtime` pure parity passes, extend the runtime core to cover message/content/session shapes used by `packages/coding-agent/src/core/messages.ts`.

Target data:

- Bash execution messages
- Custom extension messages
- Branch summary messages
- Compaction summary messages
- User/assistant/tool result passthrough messages
- LLM-compatible message conversion
- Text/image/audio/attachment content parts

Target namespaces:

```text
eta_mu.runtime.law.message
eta_mu.runtime.law.content_part
eta_mu.runtime.shape.message
eta_mu.runtime.domain.message
eta_mu.runtime.domain.compaction_summary
```

Keep out of scope for this task:

- `AgentSession` class lifecycle
- filesystem session persistence
- model/provider execution
- extension runner host APIs
- bash execution
- TUI/web rendering

Those belong to boundary-adapter and surface-parity tasks.

## Execution sequence

1. Implement the CLJS spine from `docs/cljs-runtime-rewrite-shadow-spine-plan.md`.
2. Add Malli schemas and shape compat for eta-mu-runtime data.
3. Port state/breath/planner/envelope pure functions.
4. Add CLJS tests mirroring existing Vitest coverage.
5. Add Node ESM smoke for JS import and camelCase public outputs.
6. Run existing TS tests and typecheck.
7. Only then consider JS wrapper changes or additional message/session shapes.

## Verification commands

```bash
cd orgs/open-hax/eta-mu
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
pnpm --dir packages/eta-mu-runtime cljs:verify
```

When the coding-agent message follow-up starts:

```bash
cd orgs/open-hax/eta-mu
pnpm --filter @open-hax/eta-mu-cli test -- messages
pnpm --filter @open-hax/eta-mu-cli test
```

If a filtered Vitest invocation is unsupported, run the full package test and record runtime.

## Acceptance checklist

- [x] Current eta-mu-runtime public functions have CLJS equivalents behind the facade.
- [x] Existing TS tests still pass.
- [x] CLJS tests cover parity and malformed data rejection.
- [x] JS import smoke sees callable CLJS facade functions.
- [x] Internal CLJS maps use kebab-case; public JS outputs preserve camelCase.
- [x] No raw JS interop appears in `domain.*`, `law.*`, or `shape.*`.
- [x] No TypeScript deletion happens in this task.

## Implementation note

The runtime-core PR extends the first `packages/eta-mu-runtime` CLJS spine with pure data contracts for content parts, agent messages, model descriptors, tool descriptors, and session context maps. The new facade exports are additive and do not change package `main`, `types`, or public TypeScript exports.

## Risks

- Date/time defaults can make parity tests flaky. Prefer passing `now` into pure functions and only default in facade wrappers.
- Zod and Malli can disagree on error shape. During parity, assert behavior and returned data first; stabilize error reporting in the law layer before public cutover.
- Candidate IDs include repo/trigger/kind/index string construction. Keep exact string format until a major compatibility change is approved.

## Recommended next planning handoff

Once the shadow spine is implemented, use this plan to port only `packages/eta-mu-runtime` pure semantics first. Do not start `AgentSession` or provider logic until this pure core is verified.

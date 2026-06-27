---
uuid: "eta-mu-cljs-runtime-rewrite"
title: "Eta-mu CLJS Runtime Rewrite"
status: accepted
priority: P0
labels: ["epics", "cljs", "rewrite", "knoxx-style", "55sp"]
created_at: "2026-05-29T21:18:48Z"
source: "user-request:2026-05-29"
points: 55
category: epics
---

# Eta-mu CLJS Runtime Rewrite

> Source: user request, 2026-05-29
> Reference style: `orgs/open-hax/openplanner/packages/agents/knoxx/`
> Service board: `services/eta-mu/kanban/openhax.kanban.json` project `orgs-open-hax-eta-mu-kanban`
> Board source: `orgs/open-hax/eta-mu/kanban/`
> Points: 55

## Purpose

Rewrite `orgs/open-hax/eta-mu/` into a ClojureScript-first runtime while preserving the useful public surfaces of the current eta-mu/Pi-derived TypeScript packages.

This is not a cosmetic port. The rewrite should use Knoxx as the organizational reference for how source is shaped, verified, and reasoned about:

- categories describe lawful motion and state transitions
- contracts decide admissibility, evidence, and boundary obligations
- plain CLJS data is the default medium
- raw JavaScript interop is isolated behind named `extern.*` adapters
- zero warnings is treated as a contract, not polish

## Rewrite thesis

> Keep eta-mu's agent-runtime purpose. Replace the spine.

Eta-mu currently contains a mixed TypeScript/CLJS workspace with thousands of TS/JS source files and a smaller set of CLJS extension/UI surfaces. The target is a CLJS-first runtime where TypeScript remains only as compatibility glue, generated output, or narrow boundary code until parity allows deletion.

## Knoxx-derived organizational laws

1. **Categories vs contracts**
   - `domain.*` names the lawful moves and pure runtime decisions.
   - `law.*` names schemas, guards, proofs, and admissibility checks.
   - State transitions cannot be treated as complete unless their contract evidence is visible.

2. **Four-layer namespace split**
   - `domain.*`: pure agent/session/model/tool decisions; no I/O.
   - `shape.*`: pure data morphisms and compatibility transforms.
   - `law.*`: Malli schemas, validators, output-contract gates, and invariants; no I/O.
   - `infra.*`: file system, git, process, HTTP, provider, PM2, and workspace effects.

3. **Named extern boundary**
   - Raw JS objects, Node APIs, SDK objects, `#js`, `aget`, `aset`, `js->clj`, `clj->js`, `Promise.all`, and provider-native payloads are born and decoded only in `extern.*` namespaces.
   - Non-extern namespaces receive CLJS maps, vectors, scalars, or opaque handles.

4. **Data-oriented tools**
   - Tool definitions are maps: `{:name ... :description ... :parameters ... :execute fn}`.
   - Composition happens by concatenating tool vectors in orchestration namespaces, not by OO builders.

5. **Modern async and warning ratchet**
   - Prefer `^:async` functions/tests plus `await` where supported by the active CLJS toolchain.
   - Every migrated backend/runtime slice must compile, lint, and test with zero new warnings.

6. **No junk drawers**
   - No new `utils` namespaces.
   - Every namespace declares the boundary or domain it owns in its name.

## Target architecture map

```text
eta_mu.runtime.domain.*      pure message/session/model/tool decisions
eta_mu.runtime.shape.*       compatibility morphisms and DTO transforms
eta_mu.runtime.law.*         Malli schemas, output-contract gates, invariant checks
eta_mu.runtime.extern.*      Node/OpenCode/Proxx/provider/FS/Git/PM2 adapters
eta_mu.runtime.infra.*       effect orchestration using extern adapters
eta_mu.runtime.cli.*         CLI command routing and JS facade exports
eta_mu.runtime.tui.*         TUI state and presentation contracts
eta_mu.runtime.web.*         browser/web UI contracts where needed
```

Existing package names and binaries should stay compatible until explicit cutover tasks prove a replacement is safe.

## Non-goals

- Do not big-bang delete the TypeScript runtime.
- Do not rename or republish public packages as part of the first rewrite pass.
- Do not copy Knoxx product/domain behavior into eta-mu; copy the organizational grammar.
- Do not move raw JS interop into pure domain, shape, or law namespaces to get a port compiling faster.
- Do not claim parity while relevant CLI, package, and CLJS test gates are red.

## Phases

### Phase 1 — Inventory and migration map

- Catalog TS/JS/CLJS source by package and runtime responsibility.
- Classify each source cluster into `domain`, `shape`, `law`, `infra`, `extern`, `cli`, `tui`, or `web`.
- Identify public compatibility surfaces: binaries, package exports, provider adapters, custom tools, prompt/context protocols, session persistence, TUI/web entrypoints.
- Produce a cutover risk ledger with blockers and historical tests that already fail.

Child task: `kanban/tasks/eta-mu-cljs-rewrite-architecture-inventory.md`
Inventory output: `docs/cljs-runtime-rewrite-architecture-inventory.md`

### Phase 2 — Shadow-CLJS spine and namespace gates

- Define the CLJS build spine for runtime/test targets.
- Add lint and boundary inventory gates before broad porting begins.
- Establish `extern.*` adapter patterns and sample tests.
- Keep JS facade exports stable for current Node consumers.

Child task: `kanban/tasks/eta-mu-cljs-rewrite-shadow-spine.md`
Planning output: `docs/cljs-runtime-rewrite-shadow-spine-plan.md`

### Phase 3 — Port pure runtime core first

- Port message/content-part/session/model/tool/output-contract logic into pure `domain`, `shape`, and `law` namespaces.
- Prefer Malli schemas for boundary contracts.
- Preserve audio/image/text content-part extensibility from the current eta-mu direction.
- Add regression tests before replacing TS call sites.

Child task: `kanban/tasks/eta-mu-cljs-rewrite-runtime-core.md`
Planning output: `docs/cljs-runtime-rewrite-runtime-core-plan.md`

### Phase 4 — Boundary adapters and effect orchestration

- Wrap Node filesystem, process execution, git, provider SDKs, OpenCode/Pi APIs, Proxx HTTP calls, web search, image render, graph memory, Chronos, and receipt/session tools in named `extern.*` adapters.
- Keep `infra.*` orchestration CLJS-first and data-in/data-out.
- Add conversion regression tests for every adapter used by migrated runtime paths.

Child task: `kanban/tasks/eta-mu-cljs-rewrite-boundary-adapters.md`
Planning output: `docs/cljs-runtime-rewrite-boundary-adapter-plan.md`

### Phase 5 — CLI, TUI, web, and extension parity

- Route existing `eta-mu`/`pi` command surfaces through CLJS-backed implementations behind stable JS exports.
- Preserve TUI/web behavior or explicitly mark gaps.
- Keep eta-mu extension manifests consumable by OpenCode and pi harnesses.

Child task: `kanban/tasks/eta-mu-cljs-rewrite-surface-parity.md`

### Phase 6 — Cutover ratchet and TypeScript retirement

- Replace TS modules only after equivalent CLJS paths pass parity tests.
- Remove obsolete TS in small path-scoped commits.
- Update docs, package exports, and service runners after each proven cutover.

Child task: `kanban/tasks/eta-mu-cljs-rewrite-cutover-ratchet.md`

## Acceptance criteria

- [ ] A package-by-package migration inventory exists and names every public compatibility surface.
- [ ] A CLJS build/test spine exists for the runtime rewrite and can compile with zero new warnings.
- [ ] Core runtime data contracts are represented in `law.*` schemas and called at boundaries.
- [ ] Raw JS interop is isolated to named `extern.*` namespaces with conversion tests.
- [ ] Existing eta-mu CLI/package tests keep passing or blockers are recorded explicitly with owners.
- [ ] At least one end-to-end command path runs through the CLJS runtime while preserving the current command/API contract.
- [ ] TypeScript retirement happens only by parity-proven, path-scoped slices.

## Verification gates

Use the narrowest relevant gate per slice, but do not report a slice done while its gate is red.

```bash
pnpm --filter @open-hax/eta-mu-cli test
pnpm -C packages/eta-mu-extensions test
pnpm test
```

For new CLJS runtime targets, add and use shadow-cljs gates analogous to Knoxx:

```bash
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime cljs:boundary
pnpm --dir packages/eta-mu-runtime typecheck
```

## Reference points

- `orgs/open-hax/openplanner/packages/agents/knoxx/AGENTS.md`
- `orgs/open-hax/openplanner/packages/agents/knoxx/backend/shadow-cljs.edn`
- `orgs/open-hax/openplanner/packages/agents/knoxx/docs/shadow-cljs-backend-rewrite.md`
- `orgs/open-hax/openplanner/packages/agents/knoxx/docs/contract-oriented-backend-refactor.md`
- `orgs/open-hax/eta-mu/AGENTS.md`
- `orgs/open-hax/eta-mu/package.json`
- `orgs/open-hax/eta-mu/shadow-cljs.edn`

## Open questions

- Which existing TS package is the least risky second parity slice: `packages/output-contract-gate`, `packages/agent`, or a command path inside `packages/coding-agent`?
- Which public package names must remain frozen for npm compatibility versus only workspace-local compatibility?
- How broad should the first `packages/eta-mu-runtime` CLJS boundary scanner become before repo-wide boundary enforcement?

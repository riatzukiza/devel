# Eta-mu CLJS Runtime Rewrite — Architecture Inventory

Date: 2026-05-29
Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
Kanban task: `kanban/tasks/eta-mu-cljs-rewrite-architecture-inventory.md`
Knowledge graph anchor: `AGENTS.md` → `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
Reference style: `orgs/open-hax/openplanner/packages/agents/knoxx/AGENTS.md`

## Purpose

This inventory turns “rewrite eta-mu in ClojureScript” into a path-scoped migration plan. It classifies existing eta-mu packages by public compatibility surface and target CLJS ownership category so implementation can proceed without a big-bang rewrite.

The design target is Knoxx-style organization, not Knoxx product behavior:

- `domain.*` for pure runtime decisions and lawful state transitions
- `shape.*` for pure data morphisms and DTO compatibility
- `law.*` for schemas, guards, validation, and evidence contracts
- `extern.*` for raw JavaScript, Node, browser, SDK, provider, and host-object boundaries
- `infra.*` for effect orchestration that consumes extern adapters and returns CLJS data
- no new `utils` junk drawers
- no raw JS interop outside named boundaries or tiny facade namespaces

## Source count snapshot

Source counts below exclude obvious build/output folders such as `node_modules`, `dist`, `target`, `.shadow-cljs`, `.build`, and `out`, and only count files under source-like roots such as `src`, `test`, `tests`, `lib`, `scripts`, `e2e`, `web`, and `externs`.

| Path | Package | TS/JS | CLJ/CLJS/EDN | Source roots |
|---|---|---:|---:|---|
| `packages/agent` | `@open-hax/eta-mu-agent-core` | 10 | 0 | `src`, `test` |
| `packages/ai` | `@open-hax/eta-mu-ai` | 115 | 0 | `scripts`, `src`, `test` |
| `packages/coding-agent` | `@open-hax/eta-mu-cli` | 258 | 0 | `scripts`, `src`, `test` |
| `packages/eta-mu-docs` | `@open-hax/eta-mu-docs` | 1 | 0 | `tests` |
| `packages/eta-mu-extensions` | `@open-hax/eta-mu-extensions` | 7 | 63 | `externs`, `lib`, `scripts`, `src` |
| `packages/eta-mu-extensions-e2e` | `@open-hax/eta-mu-extensions-e2e` | 0 | 3 | `src` |
| `packages/eta-mu-github` | `@open-hax/eta-mu-github` | 14 | 0 | `src`, `tests` |
| `packages/eta-mu-runtime` | `@open-hax/eta-mu-runtime` | 18 | 15 | `scripts`, `src`, `test`, `tests` |
| `packages/eta-mu-truth` | `@open-hax/eta-mu-truth` | 1 | 0 | `tests` |
| `packages/kanban` | `@open-hax/kanban-legacy` | 18 | 0 | `e2e`, `src`, `tests`, `web` |
| `packages/mom` | `@open-hax/pi-mom` | 19 | 0 | `scripts`, `src`, `test` |
| `packages/opencode-reactant` | `@open-hax/opencode-reactant` | 0 | 13 | `src`, `test` |
| `packages/output-contract-gate` | `@open-hax/output-contract-gate` | 16 | 0 | `src` |
| `packages/pods` | `@open-hax/pi` | 9 | 0 | `src` |
| `packages/presence-core` | `@open-hax/presence-core` | 1 | 0 | `src` |
| `packages/signal-contracts` | `@open-hax/signal-contracts` | 1 | 0 | `tests` |
| `packages/signal-radar-core` | `@open-hax/signal-radar-core` | 1 | 0 | `tests` |
| `packages/signal-source-utils` | `@open-hax/signal-source-utils` | 1 | 0 | `tests` |
| `packages/signal-watchlists` | `@open-hax/signal-watchlists` | 1 | 0 | `tests` |
| `packages/tui` | `@open-hax/eta-mu-tui` | 52 | 0 | `src`, `test` |
| `packages/web-ui` | `@open-hax/pi-web-ui` | 72 | 0 | `scripts`, `src` |
| `services/agentd` | `@open-hax/agentd` | 8 | 0 | `src`, `tests` |
| `services/eta-mu-truth-workbench` | `@open-hax/eta-mu-truth-workbench` | 9 | 0 | `src` |

Inventory caveat: `packages/eta-mu-runtime` now contains the first CLJS shadow spine under `src/cljs` and `test/cljs`, while `packages/eta-mu-runtime/src` still contains `.js`, `.js.map`, and `.d.ts` siblings alongside `.ts` files. Runtime-core planning should decide whether those checked-in JS artifacts are intentional compatibility shims, stale generated files, or source artifacts that must be preserved during the facade phase.

## Public compatibility surfaces

| Path | Public surface | Rewrite role |
|---|---|---|
| `packages/coding-agent` | binaries `eta-mu`, `pi`; exports `.`, `./hooks`; main/types in `dist` | Primary CLI/runtime compatibility shell. Keep public API stable while routing small paths through CLJS exports. |
| `packages/ai` | binary `pi-ai`; many provider exports including Anthropic, Bedrock, Google, OpenAI, Azure, Mistral, Cloudflare | Provider/model boundary. Split pure provider registry/message transforms from SDK/HTTP extern adapters. |
| `packages/agent` | `dist/index.js` SDK-style runtime exports | Agent loop/session abstractions. Port pure loop decisions after `eta-mu-runtime`. |
| `packages/eta-mu-runtime` | export `.`; state/envelope/planner modules | Best first pure CLJS parity slice. Small, central, low I/O. |
| `packages/output-contract-gate` | binary `output-contract-gate`; export `.` | Best second law/shape slice. Central to OPMF/output contracts and has focused tests. |
| `packages/eta-mu-extensions` | built-in OpenCode/pi extension manifests and generated JS glue | Already CLJS-heavy. Treat as boundary-cleanup and extern-adapter reference, not a fresh port. |
| `packages/tui` | `@open-hax/eta-mu-tui` library | Presentation/runtime shell. Defer until CLI/runtime state contracts stabilize. |
| `packages/web-ui` | `@open-hax/pi-web-ui`; export `.` and `./app.css` | Browser shell. Defer until message/session/tool shapes are stable. |
| `packages/opencode-reactant` | CLJS browser app | Existing CLJS UI reference. It has raw browser interop that should inform browser `extern.*` rules. |
| `packages/kanban` | binary `openhax-kanban`; multiple board/content/task exports | Keep as operational support unless rewrite scope expands to the board tool itself. |
| `services/agentd` | dev/runtime service | Runtime service integration. Defer until CLJS CLI/server spine proves a stable Node import. |

## Target ownership map

| Source cluster | Target CLJS owner | Notes |
|---|---|---|
| `packages/eta-mu-runtime/src/envelope.ts` | `eta_mu.runtime.shape.envelope`, `eta_mu.runtime.law.envelope` | Pure data, schema, and compatibility transforms. |
| `packages/eta-mu-runtime/src/state.ts` | `eta_mu.runtime.domain.state`, `eta_mu.runtime.law.state` | State transitions should be category/law explicit. |
| `packages/eta-mu-runtime/src/planner.ts` | `eta_mu.runtime.domain.planner` | Pure planning decisions first; defer effect execution. |
| `packages/output-contract-gate/src/*.ts` | `eta_mu.runtime.law.output_contract`, `eta_mu.runtime.shape.markdown`, `eta_mu.runtime.shape.edn` | Keep CLI I/O in `infra.cli`/`extern.fs`; schemas and validation stay pure. |
| `packages/coding-agent/src/core/messages.ts` | `eta_mu.runtime.domain.message`, `eta_mu.runtime.shape.message`, `eta_mu.runtime.law.message` | First bridge into CLI session compatibility. Include text/image/audio content parts. |
| `packages/coding-agent/src/core/agent-session*.ts` | `eta_mu.runtime.domain.session`, `eta_mu.runtime.infra.session` | Pure session decisions first; persistence and process boundaries later. |
| `packages/coding-agent/src/core/model-*.ts` | `eta_mu.runtime.domain.model`, `eta_mu.runtime.law.model`, `eta_mu.runtime.infra.provider` | Keep provider registry data separate from SDK calls. |
| `packages/coding-agent/src/utils/git.ts`, `exec.ts`, `child-process.ts`, FS/image helpers | `eta_mu.runtime.extern.git`, `eta_mu.runtime.extern.process`, `eta_mu.runtime.extern.fs`, `eta_mu.runtime.extern.image` | Raw host APIs must not enter domain/shape/law. |
| `packages/ai/src/providers/**` | `eta_mu.runtime.extern.provider.*`, `eta_mu.runtime.infra.provider.*` | One named adapter per provider boundary; pure transforms move to shape/domain. |
| `packages/eta-mu-extensions/src/eta_mu/extensions/**` | `eta_mu.runtime.extern.opencode`, `eta_mu.runtime.infra.tools.*`, `eta_mu.runtime.law.contract_runtime.*` | Existing CLJS code has useful behavior but raw JS interop must be fenced. |
| `packages/tui/src/**` | `eta_mu.runtime.tui.*`, `eta_mu.runtime.extern.terminal` | Presentation layer should consume stable runtime maps. |
| `packages/web-ui/src/**` and `packages/opencode-reactant/src/**` | `eta_mu.runtime.web.*`, `eta_mu.runtime.extern.browser.*` | Browser interop should be named and localized. |

## Boundary hotspot snapshot

Existing CLJS already contains raw JS interop. This is not wrong for current code, but the rewrite should classify it explicitly.

Observed hotspots:

- `packages/eta-mu-extensions/src/eta_mu/extensions/websearch_open_hax.cljs` uses `js/process.env`, `js/fetch`, `js/JSON`, `js/Promise`, `js/Buffer`, `#js`, `aget`.
- `packages/eta-mu-extensions/src/eta_mu/extensions/opencode_global_instructions.cljs` uses filesystem/process/global state, `js/JSON`, `clj->js`, `js->clj`, `aget`, `aset`, `js/Array.from`.
- `packages/eta-mu-extensions/src/eta_mu/contracts/core.cljs` uses MarkdownIt JS token objects through `js/Reflect`, `js/Array.from`, `aget`.
- `packages/opencode-reactant/src/opencode/ui/core.cljs`, `github.cljs`, `files.cljs`, `router.cljs`, `state.cljs`, and `config.cljs` use browser globals, WebSocket, XMLHttpRequest, localStorage, history, JSON parsing, and environment/global config.

Target handling:

- Node and provider interop goes under named `eta_mu.runtime.extern.*` adapters.
- Browser interop goes under named `eta_mu.runtime.extern.browser.*` adapters.
- OpenCode/pi host interop goes under `eta_mu.runtime.extern.opencode` or more specific host-boundary adapters.
- MarkdownIt token access gets an adapter or opaque-handle parser boundary before law/shape code consumes it.

## First three parity slices

### Slice 1 — `packages/eta-mu-runtime` pure CLJS ESM facade

Why first:

- Smallest central package with state/envelope/planner semantics.
- Low I/O surface.
- Good place to prove `shadow-cljs :esm` exports and Node import smoke tests.

Target categories:

- `eta_mu.runtime.domain.state`
- `eta_mu.runtime.domain.planner`
- `eta_mu.runtime.shape.envelope`
- `eta_mu.runtime.law.envelope`

Verification:

```bash
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime cljs:smoke
```

### Slice 2 — `packages/output-contract-gate` law/shape port

Why second:

- Core to the OPMF/output-contract runtime already active in this workspace.
- Naturally maps to `law.*` and `shape.*`.
- Has focused tests around EDN, markdown, validation, and repair.

Target categories:

- `eta_mu.runtime.law.output_contract`
- `eta_mu.runtime.shape.edn`
- `eta_mu.runtime.shape.markdown`
- `eta_mu.runtime.cli.output_contract_gate`
- `eta_mu.runtime.extern.fs` for CLI file I/O only

Verification:

```bash
pnpm --dir packages/output-contract-gate test
pnpm --dir packages/output-contract-gate typecheck
pnpm --dir packages/eta-mu-runtime cljs:verify
```

### Slice 3 — `packages/coding-agent` message/content/session core bridge

Why third:

- This starts replacing the actual `eta-mu`/`pi` runtime without touching every provider, TUI, and filesystem boundary at once.
- Message/content/session shapes are the durable contract under CLI, TUI, web UI, provider adapters, and extension tools.
- This is where text/image/audio content-part extensibility should become explicit.

Target categories:

- `eta_mu.runtime.domain.message`
- `eta_mu.runtime.domain.session`
- `eta_mu.runtime.shape.message`
- `eta_mu.runtime.shape.content_part`
- `eta_mu.runtime.law.message`
- `eta_mu.runtime.law.session`

Verification:

```bash
pnpm --filter @open-hax/eta-mu-cli test
pnpm --dir packages/eta-mu-runtime cljs:verify
```

## Later migration lanes

### Provider/model lane

Owner categories:

- `domain.model`
- `law.model`
- `shape.provider_request`
- `extern.provider.openai`
- `extern.provider.anthropic`
- `extern.provider.google`
- `extern.provider.bedrock`
- `extern.provider.proxx`

Rule: provider SDK/native payloads never cross into domain/law; they are decoded to CLJS maps at the adapter edge.

### CLI/runtime lane

Owner categories:

- `cli.args`
- `cli.commands.*`
- `infra.session`
- `infra.tool_execution`
- `extern.process`
- `extern.fs`
- `extern.git`

Rule: the CLI can remain a JS wrapper until each command path has parity evidence.

### Extension-tool lane

Owner categories:

- `infra.tools.apply_patch`
- `infra.tools.receipt_river`
- `infra.tools.session_mycology`
- `infra.tools.graph_memory`
- `infra.tools.websearch`
- `law.contract_runtime`
- `extern.opencode`
- `extern.http`
- `extern.fs`

Rule: custom tools should remain plain maps with `:execute` functions; no OO builders.

### TUI/web lane

Owner categories:

- `tui.components.*`
- `tui.state`
- `extern.terminal`
- `web.state`
- `web.components.*`
- `extern.browser.*`

Rule: UI layers consume stable runtime maps and should not define provider/session contract meaning.

## Verification baseline for remaining implementation

Run these before each parity slice and record current failures instead of treating historical failures as rewrite failures:

```bash
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
pnpm --dir packages/output-contract-gate test
pnpm --dir packages/output-contract-gate typecheck
pnpm --filter @open-hax/eta-mu-cli test
pnpm -C packages/eta-mu-extensions test
pnpm test
```

## Open decisions

1. Public artifact strategy: whether npm packages should expose compiled CLJS directly or keep JS wrappers around compiled CLJS exports during transition.
2. Generated artifacts: whether checked-in `.js`/`.d.ts` siblings in `packages/eta-mu-runtime/src` are intentionally source-compatible files.
3. Boundary gate expansion: whether the first `packages/eta-mu-runtime` scanner should grow into a repo-wide Knoxx-style `boundary:check`.

## Recommended next planning move

Proceed to `eta-mu-cljs-rewrite-runtime-core` after human review of this inventory and the merged shadow-spine PRs. The least risky implementation choice remains to expand pure CLJS runtime data contracts inside `packages/eta-mu-runtime` before touching `packages/coding-agent` or provider SDK code.

# Eta-mu CLJS Runtime Rewrite — Boundary Adapter Plan

Date: 2026-05-29
Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
Kanban task: `kanban/tasks/eta-mu-cljs-rewrite-boundary-adapters.md`
Depends on: `docs/cljs-runtime-rewrite-shadow-spine-plan.md`
Related: `docs/cljs-runtime-rewrite-runtime-core-plan.md`

## Purpose

Define how eta-mu will isolate raw JavaScript, Node, browser, provider SDK, OpenCode/pi host, and filesystem/process effects while rewriting the runtime in ClojureScript.

The goal is not to ban interop. The goal is to make every interop boundary named, testable, and invisible to `domain.*`, `shape.*`, and `law.*` code.

## Boundary law

Raw host objects and JS interop may be born only in:

- `eta_mu.runtime.extern.*`
- test doubles under `test/cljs/**` where explicitly allowed

Tiny JS/CLJS facades must call named `extern.*` adapters for API compatibility conversion instead of owning raw interop directly.

Disallowed in ordinary runtime namespaces:

- `js/JSON`, `js/Promise`, `js/Array.from`, `js/Buffer`, `js/process`, `js/window`, `js/document`
- `js->clj`, `clj->js`, `#js`, `aget`, `aset`
- SDK-native objects from providers, OpenCode, pi, Fastify, WebSocket, terminal, or browser APIs
- namespace segments named `utils`

## Adapter API rule

Adapters must expose CLJS-first public functions:

```clojure
;; Good: data in, data out
(fetch-json {:url "https://example.test"
             :method :post
             :headers {"authorization" "Bearer ..."}
             :json {:query "x"}})
;; => Promise resolving to {:status 200 :headers {...} :body {...}}

;; Bad outside extern: raw RequestInit / Response / SDK object leakage
```

If a raw object must survive across layers, it is an opaque handle. Only the owning adapter may inspect it.

## Initial adapter inventory

| Boundary | Current source hotspots | Target namespace | Public data contract |
|---|---|---|---|
| Node filesystem | `coding-agent/src/core/session-manager.ts`, `resource-loader.ts`, `auth-storage.ts`, `output-contract-gate/src/artifacts.ts`, extension receipt tools | `eta_mu.runtime.extern.fs` | paths and strings/bytes; result maps with `:ok`, `:path`, `:content`, `:error`. |
| Node path/url | many CLI/session/provider files | `eta_mu.runtime.extern.path` | string paths/URLs only. |
| Process/env | `coding-agent/src/cli.ts`, config/model/auth files, extension tools | `eta_mu.runtime.extern.process` | `env`, `cwd`, `exit`, `argv` as CLJS data. |
| Child process/bash | `coding-agent/src/core/bash-executor.ts`, `utils/child-process.ts`, `core/exec.ts` | `eta_mu.runtime.extern.process_exec` | command, args, cwd, env, timeout -> stdout/stderr/exit/truncation map. |
| Git | `coding-agent/src/utils/git.ts`, package-manager flows | `eta_mu.runtime.extern.git` | repo path + git operation maps; no shell strings in domain. |
| HTTP/fetch | `ai/src/providers/**`, `extensions/websearch_open_hax.cljs`, Proxx calls | `eta_mu.runtime.extern.http` | request map with `:json`/`:body`; response map with decoded body. |
| Provider SDKs | `ai/src/providers/**` | `eta_mu.runtime.extern.provider.*` | provider-specific adapter maps; native request/response stays inside adapter. |
| Proxx provider | custom provider routing and Knoxx dependency | `eta_mu.runtime.extern.provider.proxx` | OpenAI-compatible/proxx request and stream maps. |
| OpenCode/pi host | `eta-mu-extensions/src/eta_mu/extensions/**`, `coding-agent/src/core/extensions/**` | `eta_mu.runtime.extern.opencode`, `eta_mu.runtime.extern.pi_host` | context, UI, tool registration, event APIs through opaque handles + CLJS maps. |
| Markdown parser | `output-contract-gate/src/markdown.ts`, `eta_mu/contracts/core.cljs` MarkdownIt tokens | `eta_mu.runtime.extern.markdown` | markdown string -> CLJS AST/section maps. |
| EDN parser | `output-contract-gate/src/edn.ts`, contract runtime | `eta_mu.runtime.extern.edn` or `shape.edn` depending parser choice | EDN string -> CLJS data/forms; parse errors as maps. |
| Browser DOM/history/storage | `opencode-reactant/src/opencode/ui/**`, `web-ui/src/**` | `eta_mu.runtime.extern.browser.*` | browser state and event handles; UI state consumes maps. |
| WebSocket/XMLHttpRequest | `opencode-reactant/src/opencode/ui/core.cljs`, `github.cljs`, `files.cljs` | `eta_mu.runtime.extern.browser.ws`, `eta_mu.runtime.extern.browser.http` | event maps and response maps. |
| Terminal/TUI | `tui/src/**` | `eta_mu.runtime.extern.terminal` | terminal capabilities and render commands as data. |
| Image/audio conversion | `coding-agent/src/utils/image-*.ts`, clipboard/image/audio utilities | `eta_mu.runtime.extern.media.*` | content parts and file/byte handles; codecs inside adapter. |
| Package manager/npm | `coding-agent/src/core/package-manager.ts`, package command tests | `eta_mu.runtime.extern.package_manager` | package op maps; command execution delegated to process adapter. |

## Existing CLJS hotspot handling

### `packages/eta-mu-extensions`

Existing CLJS already uses host interop heavily. Treat it as a working behavior donor, not as the final architecture.

Immediate targets:

- `websearch_open_hax.cljs` -> split into `extern.http`, `extern.fs`, and `infra.tools.websearch`.
- `opencode_global_instructions.cljs` -> split into `extern.fs`, `extern.process`, `extern.opencode`, `law.contract_runtime`, and `shape.opmf`.
- `contracts/core.cljs` MarkdownIt token access -> move parser/token handling behind `extern.markdown`.
- receipt/session tools -> keep EDN/log file operations in `extern.fs` and repo discovery in `infra.receipts.repo`.

### `packages/opencode-reactant`

Existing browser CLJS should inform browser adapter design:

- `WebSocket` and reconnect timers -> `extern.browser.ws`
- `XMLHttpRequest`/JSON parsing -> `extern.browser.http`
- `localStorage` -> `extern.browser.storage`
- `history`/`window.location` -> `extern.browser.history`
- console/debug logging -> `extern.browser.console` or an injected logger

Do not let browser globals appear in reusable runtime core namespaces.

## Boundary scanner plan

Add a first scanner under the first CLJS runtime home, likely:

```text
packages/eta-mu-runtime/scripts/check-cljs-boundaries.mjs
```

Inputs:

- `src/cljs/**/*.cljs`
- optional `--allow-test-interop` for `test/cljs/**`

Allowed file patterns:

- `src/cljs/**/extern/**/*.cljs`

Allowlist comments are not implemented; the current scanner enforces an extern-only raw-interop boundary.

Disallowed tokens:

```text
js/
js->clj
clj->js
#js
aget
aset
js/Promise
js/JSON
js/Array.from
js/Buffer
js/process
js/window
js/document
```

Disallowed namespace names:

```text
.utils
/utils/
```

Output:

```text
boundary violation: src/cljs/eta_mu/runtime/domain/state.cljs:12 uses js/Date outside extern/facade
boundary violation: src/cljs/eta_mu/runtime/shape/utils.cljs uses forbidden namespace segment utils
```

Exit non-zero on any violation.

## Adapter test pattern

Every adapter gets at least one conversion test.

Examples:

### HTTP adapter

- Given CLJS request map with `:json`, adapter builds native request internally.
- Given fake response, adapter returns `{:status 200 :body {...}}`.
- Non-JSON response returns structured error map, not native exception leakage.

### FS adapter

- `read-text` returns string content for an existing file.
- missing file returns/throws a normalized error with path and code.
- `write-text!` creates parent directories only when requested.

### OpenCode host adapter

- fake host context with JS methods can receive CLJS tool result maps.
- adapter translates host UI notify/status calls without exposing raw context in infra tools.

### Provider adapter

- CLJS message maps encode to provider payload.
- provider response decodes to CLJS assistant/tool/content part maps.
- streaming event shape is normalized before leaving adapter.

## Implementation order

### Step 1 — Core package boundary scanner

Build scanner in `packages/eta-mu-runtime` as part of the shadow spine. It should be intentionally strict because the first runtime core has no real reason to use raw JS outside facade.

### Step 2 — Minimal externs for runtime facade

Only add what the runtime-core facade needs:

- maybe `extern.time` if default timestamps must be generated
- maybe `extern.js` for camelCase JS object conversion if not handled in facade

Prefer passing `now` into pure functions to avoid an early time adapter.

### Step 3 — Output-contract adapter split

When porting `output-contract-gate`, add:

- `extern.fs`
- `extern.markdown`
- `extern.edn` if parser is JS-backed
- `infra.output_contract.artifacts`
- `law.output_contract`
- `shape.markdown`

### Step 4 — Extension host adapters

Before migrating custom tools, add:

- `extern.opencode`
- `extern.pi_host`
- `extern.http`
- `extern.process`
- `extern.fs`

Then port one extension/tool path at a time.

### Step 5 — Provider adapters

Only after message/content-part schemas are stable:

- `extern.provider.openai`
- `extern.provider.anthropic`
- `extern.provider.google`
- `extern.provider.bedrock`
- `extern.provider.proxx`

Do not migrate all providers in one slice.

## Acceptable raw interop examples

```clojure
(ns eta-mu.runtime.extern.http)

(defn fetch-json [request]
  ;; raw js/fetch and clj->js allowed here
  ...)
```

```clojure
(ns eta-mu.runtime.facade)

(defn ^:export createEtaMuState [js-options]
  ;; only compatibility conversion; no domain logic here
  ...)
```

## Unacceptable raw interop examples

```clojure
(ns eta-mu.runtime.domain.state)

(defn create-breath-episode [id]
  {:opened-at (.toISOString (js/Date.))}) ;; not allowed: hidden clock in domain
```

```clojure
(ns eta-mu.runtime.shape.utils) ;; not allowed: utils namespace
```

## Verification commands

For the first package:

```bash
pnpm --dir packages/eta-mu-runtime cljs:boundary
pnpm --dir packages/eta-mu-runtime cljs:verify
```

For later extension/tool slices:

```bash
pnpm -C packages/eta-mu-extensions test
pnpm -C packages/eta-mu-extensions build
```

For coding-agent runtime slices:

```bash
pnpm --filter @open-hax/eta-mu-cli test
```

## Acceptance checklist

- [x] Boundary scanner exists and is wired into CLJS verification.
- [x] Raw interop in new runtime CLJS appears only in `extern.*` namespaces.
- [x] Each added adapter has at least one conversion/regression test.
- [x] Adapter public APIs use CLJS maps/vectors/scalars or opaque handles.
- [x] Domain/law/shape namespaces do not import provider SDKs, Node modules, browser globals, or OpenCode/pi host objects.
- [x] No new `utils` namespace is introduced.

## Implementation note

The boundary-adapter PR moved facade JS conversion and timestamp defaults through `eta-mu.runtime.extern.js` and `eta-mu.runtime.extern.time`, added JSON/HTTP/process adapters, and added `eta-mu.runtime.infra.boundary` inventory data. The scanner now treats `extern.*` as the only raw-interop allow zone; facade code must call named adapters.

## Recommended next planning handoff

Use this plan during the next surface-parity implementation to broaden adapter coverage only where a migrated runtime path actually touches the world. Keep the scanner strict and local to `packages/eta-mu-runtime` until additional CLJS packages join the rewrite.

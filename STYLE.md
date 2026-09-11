# STYLE — code style index for devel (stealth)

There is **no `CLOJURE.md`** in this tree (verified 2026-09-11). The style
authority here is [`DEVEL.md`](DEVEL.md) — the **Knoxx Agent Style Guide** —
plus workspace-wide TS/ESLint standards. Summary of what DEVEL.md actually
says:

## Vertical domain-driven slices (not horizontal layers)

- Prefer `knoxx.backend.tools.discord`, `knoxx.backend.tools.music`,
  `knoxx.backend.tools.openplanner`, `knoxx.backend.tools.contracts` over
  god-namespaces (`agent_hydration.cljs` was a 45k-token cautionary tale).
- A domain can be understood, tested, and replaced in isolation; tool
  factories live next to the private functions powering them.
- Shared infra is extracted explicitly into `tools.shared` / `tools.media` —
  never copy-pasted.

## Data-oriented design

- Pass plain maps, return plain maps. Tool execute functions take a parameter
  map and return a result map.
- No OO-style stateful tool builders. A tool **is data**:
  `{:name ... :description ... :parameters ... :execute fn}`.
- Composition happens in the orchestration layer (`agent-hydration`) by
  concatenating domain tool vectors.

## Namespace conventions

| Layer | Pattern | Example |
|---|---|---|
| Orchestration | `knoxx.backend.agent-*` | `agent-hydration`, `agent-runtime`, `agent-turns` |
| Domain tools | `knoxx.backend.tools.<domain>` | `tools.discord`, `tools.music` |
| Shared infra | `knoxx.backend.tools.shared` / `tools.media` | sanitization, media loading |
| Cross-cutting | `knoxx.backend.<capability>` | `event-agents`, `discord-gateway`, `mcp-bridge` |

## Rules of thumb (from DEVEL.md)

1. Namespace > ~400 lines → candidate for domain slicing.
2. A function used by 2+ domains → promote to `tools.shared` / `tools.media`.
3. Keep `agent-hydration` thin: settings, passive hydration, message
   assembly, tool-suite composition only.
4. `defn-` helpers should outnumber public functions in domain namespaces.
5. Never import one domain slice into another to grab a helper — move it up
   to shared.

## Modern CLJS patterns

Prefer modern shadow-cljs forms over legacy chains — `(require
[shadow.cljs.modern :refer [js-await]])` and `js-await` instead of
`(.then ...)` chains (DEVEL.md continues with further pattern rules; read it
in full before CLJS work).

## TypeScript / workspace standards

- pnpm workspace with strict TypeScript settings; `workspace-typecheck` and
  `workspace-lint` skills cover all submodules under `orgs/**`.
- Functional style, strict typing rules (`workspace-code-standards` skill).
- Gate: zero lint/type errors before declaring work done.

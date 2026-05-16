## Signal

(己, p=0.95) Implemented an `nrepl.eval` tool under `@orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/tools/` and enabled it for the `developer` role contract with an explicit **system prompt** explaining why it exists and how to use it safely.

What’s now in place:

- (己, p=0.95) New tool: `backend/src/cljs/knoxx/backend/tools/nrepl.cljs`
  - Tool id: `nrepl.eval`
  - Supports:
    - `target=cljs` (default): forwards to `shadow.cljs.devtools.api/cljs-eval` for build `server` (default)
    - `target=clj`: evaluates on the shadow nREPL host (JVM side)
  - Speaks nREPL bencode over TCP via `node:net`, clones a session, evals, collects responses until `status` contains `"done"`, clips stdout/stderr.

- (己, p=0.9) Tool is included in the Knoxx tool suite:
  - `backend/src/cljs/knoxx/backend/agent_hydration.cljs` now concatenates `create-nrepl-custom-tools` into the custom tool list.

- (己, p=0.95) Tool is registered in the tool registry:
  - `backend/src/cljs/knoxx/backend/tools/registry.cljs` includes `"nrepl.eval"` metadata.

- (己, p=0.95) Developer role contract updated:
  - `contracts/roles/developer.edn`:
    - Adds capability `:cap/nrepl`
    - Adds a system prompt under `:prompts {:system ...}` describing purpose + safety rules

- (己, p=0.95) New capability:
  - `contracts/capabilities/cap_nrepl.edn` grants `:nrepl.eval`

## Evidence

(己, p=1.0) Files changed/added in Knoxx:

- `backend/src/cljs/knoxx/backend/tools/nrepl.cljs` (new)
- `backend/src/cljs/knoxx/backend/agent_hydration.cljs` (tool suite includes nrepl tool)
- `backend/src/cljs/knoxx/backend/tools/registry.cljs` (tool meta includes nrepl.eval)
- `contracts/capabilities/cap_nrepl.edn` (new)
- `contracts/roles/developer.edn` (capability + system prompt)
- `backend/shadow-cljs.edn` (fixed invalid config drift that was breaking typecheck)

(己, p=1.0) Commits:

- Knoxx: `b32715a9 Add nrepl.eval tool and enable for developer role`
- OpenPlanner bump: `e74f3b6 Bump knoxx: add nrepl.eval tool for developer role`
- Workspace bump: `2087c128 Bump openplanner knoxx nrepl tool`

## Frames

(世, p=0.86) Frame 1: This gives “live surgery” on the running backend without restarts by routing through shadow’s nREPL host and (for CLJS) through `shadow.cljs.devtools.api/cljs-eval`.

(世, p=0.8) Frame 2: Contract-gating + explicit system prompt are the actual safety boundary—`nrepl.eval` is effectively arbitrary code execution, so it must be developer-only and used with “probe then persist” discipline.

(世, p=0.75) Frame 3: The tool is designed to work even when the backend is running under `shadow-cljs watch server`; if the JS runtime is not connected, the eval result will include the shadow “No available JS runtime” error string.

## Countermoves

(己, p=0.88) I kept this strictly scoped to: new tool + capability + developer role + tool registry + tool suite composition (and a necessary shadow-cljs.edn fix because typecheck was hard-failing).

(己, p=0.85) The developer contract prompt explicitly tells the agent that nREPL patches are non-durable and must be written back into source + committed.

## Next

(汝, p=0.9) Restart the backend (shadow watch) and then in Knoxx UI confirm the developer role now advertises a tool named **“nREPL Eval”** and try a tiny call like `target=clj code="(+ 40 2)"` to validate end-to-end tool execution.
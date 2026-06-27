---
uuid: "orgs-open-hax-eta-mu-kanban-orgs-open-hax-eta-mu-specs-contract-runtime-v2-spec-md"
title: "Contract Runtime v2 Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:29:39.347Z"
source: "orgs/open-hax/eta-mu/specs/contract-runtime-v2-spec.md"
category: "specs"
---

> Source: `orgs/open-hax/eta-mu/specs/contract-runtime-v2-spec.md`
> Migrated-to-kanban: `orgs/open-hax/eta-mu/kanban/contract-runtime-v2-spec.md`

# Contract Runtime v2 Spec

Status: active  
Supersedes: existing `contract_runtime.cljs` (skill-contract s-expression format)  
Date: 2026-04-18  
Schema: `spec/contracts-v1.edn`  
Actor source: `agents/mindfuck/CONTRACT.edn`

---

## What Changes

The existing `contract_runtime.cljs` discovers `CONTRACT.edn` files from
configured skill roots (`~/.pi/agent/skills/`, `~/.codex/skills/`, etc.) and
evaluates `(skill-contract ...)` s-expressions with a small embedded Lisp.

v2 replaces this with:

- **cwd-relative upward walk** for CONTRACT.edn discovery on path-bearing tool calls
- **New EDN map schema** (`spec/contracts-v1.edn`) instead of s-expression skill-contract format
- **`.ημ/` directory** per working directory: SHA cache, TTL state, PRINCIPLE.edn
- **PRINCIPLE.edn bootstrap** generated from `agents/mindfuck/CONTRACT.edn` on session start
- **Before/after hooks on path-bearing tool calls** for policy and fulfillment dispatch
- **Dispatch table**: `:actor` | `:policy` | `:fulfillment` | `:capability` | `:role` | unknown→system-prompt verbatim

The existing `opmf_contract_gate.cljs` remains active. The new runtime
detects its presence at session start and skips re-registering the
output-gate fulfillment to avoid double-firing.

---

## Directory Convention

Whenever a `CONTRACT.edn` is loaded from a directory, OR a pi session
starts in a directory, eta-mu creates:

```
<dir>/.ημ/
```

Contents:

| File | Purpose |
|------|---------|
| `PRINCIPLE.edn` | Constitutional layer. Generated from `agents/mindfuck/CONTRACT.edn`. Append-only — sections may be `:disabled true`, never removed. |
| `CONTRACT.sha` | JSON map: `{ "<absolute-path>": { "sha": "...", "loaded-at": <epoch-ms> } }` — one entry per loaded CONTRACT.edn |

---

## Bootstrap Sequence (`session_start`)

1. Resolve `ctx` cwd
2. `ensure-dir! <cwd>/.ημ/`
3. Locate `agents/mindfuck/CONTRACT.edn` — search order:
   - `<eta-mu-repo>/agents/mindfuck/CONTRACT.edn` (resolved from extension source path)
   - Walk up from cwd looking for `agents/mindfuck/CONTRACT.edn`
   - `~/.pi/agent/skills/mindfuck/CONTRACT.edn` (global fallback)
4. Generate / update `<cwd>/.ημ/PRINCIPLE.edn`:
   - If absent → write from mindfuck `CONTRACT.edn`
   - If present → compare SHA; if source changed, append new sections only — never reorder or remove existing
5. Load `PRINCIPLE.edn` into session as the constitutional base system prompt
6. Initialise session atom (see **State** section)

---

## Contract Discovery (before-hook on path-bearing tool calls)

**Trigger**: any tool call where `params` contain a key in:
```clojure
#{:path :file :dir :root :cwd :target :source :dest}
```

**Procedure**:

1. Resolve the path param to absolute path
2. Walk from that path upward to session cwd (inclusive), collecting every
   directory that contains a `CONTRACT.edn`, ordered root→leaf
3. For each `CONTRACT.edn` found:
   - Read sha-cache entry from `<dir>/.ημ/CONTRACT.sha`
   - Compute SHA-256 of whitespace-stripped EDN string
   - Check TTL: `(- now loaded-at) < ttl-ms` (default: 300 000 ms)
   - **Cache hit**: sha matches AND within TTL → use in-memory contract, skip parse
   - **Cache miss**: parse EDN map(s), validate against `contracts-v1.edn` schema,
     store in session atom, write updated entry to `.ημ/CONTRACT.sha`
4. Contracts held in session atom under `:loaded` (see **State** section)

---

## TTL Policy

Default TTL: **300 000 ms (5 min)**.

Override by placing a CONTRACT.edn anywhere in the walk path containing:

```clojure
{:contract/id   "policy.contract-loader.ttl"
 :contract/kind :policy
 :policy/invariants
 [{:id       :contract-cache-ttl
   :severity :note
   :message  "Override default contract cache TTL for this directory."
   :check    [:set-ttl-ms 60000]}]}
```

Resolution: **nearest wins** (leaf path overrides root).

---

## Contract Dispatch

After loading, each top-level map in the EDN file is dispatched by `:contract/kind`:

| `:contract/kind` | Action |
|------------------|--------|
| `:actor` | Merge actor `:system` prompt + `:capabilities` into session context. Register roles. |
| `:policy` | Register pre-tool check. Runs before next tool call in scope. `:block` severity halts the call. |
| `:fulfillment` | Register post-tool check. Runs after tool call returns result. Emits `:verdict-record`. |
| `:capability` | Register into session `:caps` registry. Actors reference by `:namespaced` id. |
| `:role` | Register into session `:roles` registry. |
| absent or unknown | Append raw EDN string to system prompt verbatim. |

The **unknown→system-prompt** rule is the compatibility shim.
The old opmf lisp prompt works unchanged if placed in a `CONTRACT.edn` —
unrecognised s-expression blocks fall through to the system prompt as text.

---

## PRINCIPLE.edn

The constitutional layer of every eta-mu session.

Generated from `agents/mindfuck/CONTRACT.edn`. Installed at `<cwd>/.ημ/PRINCIPLE.edn`
on every `session_start`.

**Rules**:
- Sections with `:disabled true` are excluded when building the system prompt but are
  never removed from the file
- The runtime MAY append new sections (with new `:contract/id` values) as the source
  CONTRACT.edn evolves
- The runtime MUST NOT remove, reorder, or modify existing sections
- SHA of source is checked on every `session_start`; changed source → append-only merge

**Immutable sections** (from `agents/mindfuck/CONTRACT.edn`):
- `:mission`
- `:directives`
- `:safety`
- `:license`
- `:output-shape`

---

## Policy Execution

Policies run in a **before hook** on the tool call. Each `:policy/invariants` entry
contains a `:check` vector. The runtime evaluates the check against:

```clojure
{:tool-name   "<tool being called>"
 :params      {<tool params>}
 :ctx         <pi context>
 :session     <session atom>}
```

Severity behaviour:

| Severity | Behaviour |
|----------|-----------|
| `:block` | Halt tool call. Return error result to agent with `:message`. |
| `:warn` | Log violation to session. Allow tool call to proceed. |
| `:note` | Silent annotation. Append to session `:policy-log`. |

---

## Fulfillment Execution

Fulfillments run in an **after hook** on the tool call result.

Two modes (from `spec/contracts-v1.edn`):

### `:deterministic/strict` or `:deterministic/loose`

Evaluates `:fulfillment/check {:expr ...}` using the embedded Lisp evaluator
(extended `builtin-env` from v1) with context:

```clojure
{'response-text  "<tool result text>"
 'result         {<tool result map>}
 'mode-active?   (fn [m] (mode-active? session m))
 'fulfilled      (fn [ok msg] {:verdict (if ok :held :failed) :rationale msg})
 'ctx            ctx}
```

`:strict` — any evaluator error → `:verdict :failed`  
`:loose` — evaluator error → `:verdict :partial`, proceed

### `:judge`

Spawns an inline actor call using `:fulfillment/check {:actor-id ... :model ... :system ... :task ...}`.
Actor returns `{:verdict :held/:failed/:partial :rationale string :inject-feedback? bool :feedback string}`.
If `:inject-feedback? true`, the runtime injects `:feedback` as a user message on the next turn.

All fulfillment verdicts emit a `:verdict-record` (schema: `spec/contracts-v1.edn`) and
append to `STATE-DIR/fulfillment-scores.jsonl` for backward compatibility.

---

## Integration with `opmf_contract_gate`

`opmf_contract_gate.cljs` registers `fulfillment.mindfuck.output-gate` as a per-turn check.

At `session_start`, contract-runtime-v2 checks the global registry for this fulfillment id.
If present → skip registering the fulfillment from `agents/mindfuck/CONTRACT.edn`.

When `opmf_contract_gate.cljs` is retired, the CONTRACT.edn fulfillment takes over
automatically with no other changes required.

---

## State

```clojure
(def GLOBAL-KEY "__eta_mu_contract_runtime_v2__")
(def STATE-DIR  (path/join HOME ".ημ" "state" "contract-runtime-v2"))
(def SCORES-FILE (path/join STATE-DIR "fulfillment-scores.jsonl"))
```

Session atom shape (in-memory only, not persisted between sessions):

```clojure
{:loaded    {"/abs/path/CONTRACT.edn"
              {:contract  <parsed-map>
               :sha       "<hex>"
               :loaded-at <epoch-ms>}}
 :actors    [<actor-map> ...]
 :policies  [<policy-map> ...]
 :fulfills  [<fulfillment-map> ...]
 :caps      {:cap/web-search <cap-map> ...}
 :roles     {:role/perception-sharpener <role-map> ...}
 :ttl-ms    300000
 :policy-log [<violation> ...]}
```

---

## Backward Compatibility

| Concern | Handling |
|---------|----------|
| Old `(skill-contract ...)` files | Existing v1 code path unchanged. v2 dispatch only fires on EDN map format (top-level map with `:contract/kind` or `:actor/id`). |
| `/contracts status\|list\|audit\|check` commands | Preserved. Extended to show both v1 skill-contracts and v2 loaded contracts. |
| `contract_fulfillment` tool | Preserved. `audit` action runs both v1 and v2 evaluators. |
| `opmf_contract_gate.cljs` | Remains active until explicitly retired. Double-fire guard at session_start. |

---

## Implementation Order

1. `.ημ/` dir creation + `CONTRACT.sha` read/write helpers
2. `PRINCIPLE.edn` bootstrap (session_start)
3. Upward-walk discovery on path-bearing tool calls
4. EDN map parser + schema dispatch
5. Policy before-hook (`:block` first, then `:warn`/`:note`)
6. Fulfillment after-hook (`:deterministic/*` first, `:judge` after)
7. Actor system-prompt merge
8. Unknown-block→system-prompt fallthrough
9. Retire `opmf_contract_gate.cljs` guard

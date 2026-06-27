# Axxium: The Shared Actor/Contract/Receipt Kernel

*What "contracts" were always meant to be, before the word got overloaded.*

---

## The Problem

You built the same concept three times:

| Repo | What They Called It | What It Actually Is |
|------|---------------------|---------------------|
| **eta-mu** | contract-runtime, `CONTRACT.edn` | Actor + capabilities + policy |
| **knoxx** | contract DSL, contract types | Actor + triggers + actions |
| **proxx** | policy engine, contract router | Actor + routing + fulfillment |

Each repo has:
- An `actor` concept
- A `receipt` or audit trail
- Some notion of `capabilities`
- Something called `contract` that means slightly different things

**The word "contract" became overloaded.** In eta-mu it's the constitutional layer. In knoxx it's the admin UI data shape. In proxx it's the routing policy. They're not wrong — they're just different flavors of the same root concept.

---

## The Solution: Axxium

**Axxium is the extraction of the shared kernel.**

Not a new framework. Not a rewrite. The **common denominator** that already exists across all three repos, pulled into one canonical implementation.

```
┌─────────────────────────────────────────────────────────────┐
│                         AXXIUM                               │
│                    (shared kernel)                           │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Actor     │  │    Receipt   │  │    Contract Core    │ │
│  │  (identity) │  │   (audit)    │  │   (admissibility)   │ │
│  │             │  │              │  │                     │ │
│  │ - kind      │  │ - events     │  │ - capabilities      │ │
│  │ - roles     │  │ - decisions  │  │ - policies          │ │
│  │ - caps      │  │ - causality  │  │ - fulfillments      │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│                   ┌──────┴──────┐                          │
│                   │   DID Auth  │                          │
│                   └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
         │                │                     │
    ┌────┘           ┌────┘              ┌─────┘
    ▼                ▼                  ▼
┌─────────┐  ┌──────────┐  ┌──────────────┐
│ eta-mu  │  │  knoxx   │  │    proxx     │
│(runtime)│  │   (UI)   │  │  (gateway)   │
└─────────┘  └──────────┘  └──────────────┘
```

---

## Axxium's Three Primitives

### 1. Actor

The unit of identity. Everything else hangs on this.

```edn
{:actor/id      "mindfuck"
 :actor/kind    :agent        ;; :human :agent :service :org
 :actor/roles   [:role/perception-sharpener]
 :actor/caps    [:cap/web-search :cap/github-mcp]
 :actor/status  :active        ;; :active :suspended :retired
}
```

**What makes it Axxium (not just a user table):**
- Capabilities are the only authority mechanism — no ambient permissions
- Roles are behavioral contexts, not organizational labels
- Status is lifecycle, not boolean
- Every actor has a DID

### 2. Receipt

The append-only audit of what happened, what was attempted, and what was decided.

```edn
{:receipt/id     uuid
 :receipt/type   :authorization/accepted
 :receipt/actor  "mindfuck"
 :receipt/event  :eval/request
 :receipt/decision {:allow? true :reason "capabilities match"}
 :receipt/causal {:root uuid :parent uuid}
 :receipt/time   inst}
```

**What makes it Axxium (not just a log):**
- Every authorization decision is recorded (accept, reject, degrade)
- Causal chain is explicit (root → parent → child)
- Not just "what happened" but "what was attempted"
- The receipt river is queryable, not just greppable

### 3. Contract (The True Contract)

The thing that gates admissibility. Not a schema. Not a policy file. The **executable boundary** between "this action is valid" and "this action is not valid."

```edn
{:contract/id      "policy.mindfuck.evidence-on-fresh"
 :contract/kind    :policy
 :contract/scope   :agent/mindfuck
 :contract/invariants
 [{:id       :no-stale-assertion
   :severity :warn
   :check    [:agent-has-called :cap/web-search
              :when [:claim-is :time-sensitive]]}]}
```

**What makes it Axxium (not the overloaded "contract"):**
- Declares what an actor MAY do (capabilities)
- Declares what an actor MUST do (fulfillments)
- Declares what an actor MUST NOT do (policies)
- Evaluated at runtime, not just at compile time
- The contract IS the authority — no hidden permissions

---

## What Axxium Is NOT

| NOT This | Because |
|----------|---------|
| **A new framework** | It's the extraction of what already exists |
| **A rewrite** | Proxx/knoxx/eta-mu consume it, don't rebuild |
| **Just a schema library** | It includes the evaluation runtime |
| **An auth service** | It's embedded, not a network hop |
| **The old "contract"** | The old word is retired; this is the true concept |

---

## The Boundary

**Axxium owns:**
- Actor identity and lifecycle
- Capability grants and revocation
- Receipt append and causal query
- Contract evaluation (admissibility checks)
- DID-based authentication

**Axxium does NOT own:**
- UI rendering (knoxx)
- HTTP routing (proxx)
- LLM calling (eta-mu)
- Business logic (any of them)
- Deployment concerns

---

## Migration Path

1. **Extract** the actor/receipt/contract code from eta-mu (most mature)
2. **Package** as `@open-hax/axxium` (or Clojure equivalent)
3. **Replace** knoxx's contract types with Axxium's contract core
4. **Replace** proxx's policy engine with Axxium's contract evaluation
5. **Deprecate** the word "contract" in old contexts, use "policy" or "rule" instead

---

## The Naming Convention

**Retired (overloaded):**
- ❌ "contract" (in knoxx UI context)
- ❌ "contract" (in proxx routing context)
- ❌ "event-agent" (the old tangled concept)

**Canonical (Axxium):**
- ✅ `actor` — identity + capabilities
- ✅ `receipt` — audit trail
- ✅ `contract` — admissibility boundary (ONLY in Axxium context)
- ✅ `policy` — a kind of contract ( narrowing)
- ✅ `fulfillment` — a kind of contract (progress check)
- ✅ `capability` — a kind of contract (permission grant)

---

## One Sentence

**Axxium is the actor/contract/receipt kernel that proxx, knoxx, and eta-mu share so they stop re-implementing the same concept with different flavors.**

---

*Axxium extracts the truth from the noise. The contracts were always there. They just needed a name that wasn't already taken.*

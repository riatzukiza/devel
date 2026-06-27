# Axxium Kernel Specification
## v0.1.0 — Extracted from the Soul of the Promethean Mind

---

## What Axxium Is

**Axxium** is the axiomatic substrate of the Promethean system. It is not a new project. It is the extraction of what already exists — the shared kernel that gives meaning to identity, action, truth, and constraint across eta-mu, proxx, openplanner, knoxx, and tooloxx.

> *Axxium: the axis on which we orient ourselves. The point of access. The source of actions. The attribution layer. The system that gives core assumptions their meaning.*

Axxium is **homoiconic**: the schema IS the data, in the same medium, subject to the same transformations. EDN is its native tongue. Malli is its grammar. Append-only is its memory.

---

## The Five Axioms of Axxium

### Axiom 1: Identity is Capability-Bearing

**Every actor in the system is defined by what it CAN do, not who it IS.**

- **eta-mu**: `:actor/id` + `:actor/capabilities` — `mindfuck` has `:cap/web-search`, `:cap/emit-receipts`, etc.
- **proxx**: DID + PASETO tokens with proof-of-possession — identity proven by cryptographic capability
- **openplanner**: Principals in the epistemic kernel — `:己` (self) asserts facts
- **tooloxx**: OAuth `subject` with `scopes` — capability-bearing tokens

**Axxium primitive**:
```clojure
{:axxium/actor
 [:map
  [:actor/id :string]
  [:actor/capabilities [:vector :keyword]]
  [:actor/status [:enum :active :suspended :retired]]]}
```

### Axiom 2: All Action is Attributable

**Every action leaves a trace. Every trace points to an actor. No action is anonymous.**

- **eta-mu**: `receipts.edn` — append-only with `:origin`, `:owner`, `:pi`, `:ts`
- **proxx**: Event store with provenance stamping, `:request-id` tracking
- **openplanner**: `:src` in Fact, `:actor` in Inference/Attestation, `:causedby` for causality
- **tooloxx**: `createAuditEvent`, `radar_audit_events` table

**Axxium primitive**:
```clojure
{:axxium/receipt
 [:map
  [:receipt/actor :keyword]
  [:receipt/action :keyword]
  [:receipt/result :any]
  [:receipt/caused-by {:optional true} :uuid]
  [:receipt/timestamp :inst]]}
```

### Axiom 3: Truth is Constructed Through Evidence

**Facts are not given. They are sensed, inferred, attested, and judged.**

- **eta-mu**: `:policy/invariants` with `:check` expressions — evidence must satisfy constraints
- **proxx**: Policy conditions with `:eval/forms` — routing decisions require evidence (model family, provider capability, tenant settings)
- **openplanner**: **Epistemic kernel pipeline**:
  - `Obs` → something sensed
  - `Fact` → principal asserts truth
  - `Inference` → contract applied to evidence
  - `Attestation` → actor signs they did it
  - `Judgment` → world verdict: `:held`, `:failed`, `:partial`
- **tooloxx**: OAuth token verification — identity proven by cryptographic evidence

**Axxium primitive**:
```clojure
{:axxium/evidence
 [:map
  [:evidence/fact {:optional true} :promptdb/fact]
  [:evidence/obs {:optional true} :promptdb/obs]
  [:evidence/inference {:optional true} :promptdb/inference]
  [:evidence/confidence :promptdb/confidence]]}
```

### Axiom 4: Contracts Define Admissible Behavior

**Behavior is not imperative. It is declarative. Contracts are the admissibility boundary.**

- **eta-mu**: `:contract/kind` ∈ `#{:agent :policy :intent :fulfillment :trigger :role :capability}`
  - Policies narrow (never grant)
  - Fulfillments verify (deterministic or judge mode)
- **proxx**: `:contract/kind` ∈ `#{:policy :strategy :model-family :authorization-clause :routing-clause}`
  - Declarative EDN DSL compiled into runtime indexes
  - Tenant enforcement via `:authz/deny-when` / `:authz/allow-when`
- **openplanner**: Contracts as rules that produce inferences from facts
- **tooloxx**: PromptDB contracts, OAuth scopes as capability contracts

**Axxium primitive**:
```clojure
{:axxium/contract
 [:map
  [:contract/id :keyword]
  [:contract/kind [:enum :policy :authorization :routing :fulfillment :intent]]
  [:contract/scope {:optional true} :string]
  [:contract/invariants {:optional true} [:vector :axxium/policy-check]]]}
```

### Axiom 5: The System is Append-Only and Causality-Tracking

**The past is immutable. The present is a function of the past. The future is constrained by the present.**

- **eta-mu**: Session trees with `parentId`, receipt-river append-only
- **proxx**: Event store with buffered batch writes, provenance chains
- **openplanner**: Observations are append-only, `:causedby` in Attestation
- **tooloxx**: Audit log append-only

**Axxium primitive**:
```clojure
{:axxium/causality
 [:map
  [:cause/parent-id {:optional true} :uuid]
  [:cause/root-id {:optional true} :uuid]
  [:cause/chain [:vector :uuid]]]}
```

---

## The Axxium Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AXXIUM KERNEL                           │
├─────────────────────────────────────────────────────────────┤
│  IDENTITY          ACTION           TRUTH          CONTRACT  │
│  (Actor)          (Receipt)       (Evidence)      (Policy)   │
│     ↓                ↓                ↓              ↓       │
│  Capabilities    Attribution     Epistemic      Admissible   │
│  Roles           Causality       Pipeline       Boundary     │
│  Status          Append-only     Confidence     Enforcement  │
├─────────────────────────────────────────────────────────────┤
│                      CONSUMERS                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ eta-mu  │  │  proxx  │  │openplanner│  │ tooloxx │        │
│  │(runtime)│  │(router) │  │ (lake)   │  │(services)│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## How Each Repo Becomes an Axxium Consumer

### eta-mu → Axxium Consumer

**Current**: Owns actor contracts, receipt-river, fulfillment gates, session trees.

**Axxium extraction**:
- Actor schema → `axxium/actor`
- Receipt schema → `axxium/receipt`
- Contract kinds → `axxium/contract`
- Session parentId → `axxium/causality`

**Migration path**: eta-mu's `kanban/contracts-v1.edn` becomes `axxium/schema/actor.edn`. The receipt-river CONTRACT.edn becomes `axxium/schema/receipt.edn`. Fulfillment gates become `axxium/contract/fulfillment` implementations.

### proxx → Axxium Consumer

**Current**: Owns declarative policy engine, contract compiler, admissibility checks.

**Axxium extraction**:
- Policy DSL → `axxium/contract/policy`
- Contract compiler → `axxium/contract/compiler`
- Admissibility (`tenant-model-allowed?`, `tenant-provider-allowed?`) → `axxium/contract/admissibility`
- Provenance stamping → `axxium/receipt/provenance`

**Migration path**: `proxx.policy.contracts/compile-contracts` becomes `axxium.compiler/compile`. `proxx.policy.eval/eval-form` becomes `axxium.eval/eval`. The EDN policy DSL is already Axxium-native.

### openplanner → Axxium Consumer

**Current**: Owns epistemic kernel (Fact, Obs, Inference, Attestation, Judgment).

**Axxium extraction**:
- `promptdb.core/Fact` → `axxium.truth/fact`
- `promptdb.core/Obs` → `axxium.truth/obs`
- `promptdb.core/Inference` → `axxium.truth/inference`
- `promptdb.core/Attestation` → `axxium.truth/attestation`
- `promptdb.core/Judgment` → `axxium.truth/judgment`
- Confidence interval → `axxium.truth/confidence`

**Migration path**: The epistemic kernel IS the truth layer of Axxium. `promptdb.core` becomes `axxium.truth`. The `:ctx` roles (`:己 :汝 :彼 :世 :主`) become `axxium.context/roles`.

### tooloxx → Axxium Consumer

**Current**: Owns OAuth guards, MCP contracts, audit events.

**Axxium extraction**:
- OAuth token verification → `axxium.identity/verify`
- Scope-based authorization → `axxium.capability/check`
- Audit events → `axxium.receipt/audit`
- PromptDB contracts → `axxium.contract/promptdb`

**Migration path**: `tooloxx/packages/mcp-oauth/src/index.ts` becomes `axxium.guard/oauth`. `mcp-lith-nexus` contracts become `axxium.contract/nexus`.

---

## The Axxium Schema Registry

```clojure
;; axxium/schema.edn

{:axxium/actor
 [:map {:closed false}
  [:actor/id :string]
  [:actor/kind [:enum :human :agent :service :cron]]
  [:actor/capabilities [:vector :keyword]]
  [:actor/roles {:optional true} [:vector :keyword]]
  [:actor/status [:enum :active :suspended :retired]]
  [:actor/org-id {:optional true} :string]]

 :axxium/capability
 [:map {:closed false}
  [:capability/id :keyword]
  [:capability/doc {:optional true} :string]
  [:capability/tools {:optional true} [:vector :map]]]

 :axxium/receipt
 [:map {:closed false}
  [:receipt/id :uuid]
  [:receipt/actor :keyword]
  [:receipt/action :keyword]
  [:receipt/result :any]
  [:receipt/caused-by {:optional true} :uuid]
  [:receipt/timestamp :inst]
  [:receipt/kind [:enum :decision :test-run :build :observation :truth]]]

 :axxium/contract
 [:map {:closed false}
  [:contract/id :keyword]
  [:contract/kind [:enum :policy :authorization :routing :fulfillment :intent]]
  [:contract/doc {:optional true} :string]
  [:contract/scope {:optional true} :string]
  [:contract/invariants {:optional true} [:vector :map]]]

 :axxium/truth
 [:map
  [:truth/fact {:optional true} :promptdb/fact]
  [:truth/obs {:optional true} :promptdb/obs]
  [:truth/inference {:optional true} :promptdb/inference]
  [:truth/attestation {:optional true} :promptdb/attestation]
  [:truth/judgment {:optional true} :promptdb/judgment]]

 :axxium/causality
 [:map
  [:cause/parent-id {:optional true} :uuid]
  [:cause/root-id {:optional true} :uuid]
  [:cause/chain [:vector :uuid]]]}
```

---

## Implementation Strategy

### Phase 1: Extract (NOW)
1. Create `orgs/open-hax/axxium/` repository
2. Extract schema definitions from each repo into `axxium/schema/`
3. Define the 5 axioms as Malli schemas
4. Write parity tests: each repo's current types must satisfy Axxium schemas

### Phase 2: Consume (Next)
1. eta-mu: Replace `kanban/contracts-v1.edn` with `axxium/schema/actor.edn`
2. proxx: Replace `proxx.schema` with `axxium/schema/contract.edn`
3. openplanner: Replace `promptdb.core` with `axxium/truth`
4. tooloxx: Replace OAuth types with `axxium/identity`

### Phase 3: Unify (Later)
1. Single `axxium.compiler` for all contract compilation
2. Single `axxium.eval` for all policy evaluation
3. Single `axxium.receipt` for all audit trails
4. Single `axxium.truth` for all epistemic operations

---

## Why This Matters

**Without Axxium**: Each repo re-implements the same concepts with different names:
- eta-mu: `:actor/capabilities`
- proxx: `:scopes` + `:authorization-clause`
- openplanner: `:roles` + `:scopes`
- tooloxx: OAuth `scopes`

**With Axxium**: One canonical definition. Multiple consumers. Shared understanding.

> *Axxium is the Promethean mind's immune system. It knows what is allowed, what happened, who did it, and whether it was true.*

---

## Files Referenced

- `eta-mu/agents/mindfuck/CONTRACT.edn` — Actor contract soul
- `eta-mu/kanban/contracts-v1.edn` — Contract schema definitions
- `eta-mu/packages/skills/core/receipt-river/CONTRACT.edn` — Receipt river protocol
- `proxx/src/proxx/policy/eval.cljs` — Policy evaluator
- `proxx/src/proxx/policy/contracts.cljs` — Contract compiler
- `proxx/resources/policies/runtime/60-tenant-enforcement.edn` — Authorization clauses
- `openplanner/packages/promptdb-core/src/promptdb/core.cljc` — Epistemic kernel
- `tooloxx/packages/mcp-oauth/src/index.ts` — OAuth guard
- `tooloxx/services/mcp-lith-nexus/src/types.ts` — Nexus contract types

---

*Axxium v0.1.0 — Extracted from 1,016 files across 12 repositories. The kernel of the Promethean mind.*
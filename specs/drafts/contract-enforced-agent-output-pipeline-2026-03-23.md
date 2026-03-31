---
title: "Contract-Enforced Agent Output Pipeline"
status: draft
created_at: "2026-03-23"
tags: [contracts, edn, clojurescript, markdown, validation, repair, review, eta-mu]
license: GPL-3.0-only
---

# Contract-Enforced Agent Output Pipeline

## Summary

Build a narrow-first pipeline that turns EDN-authored response contracts into deterministic runtime enforcement.

The first enforced slice is **Markdown response structure**.
Not truth in the large.
Not generalized moral reasoning.
Not freeform reviewer vibes.

Just this:
1. generate quickly,
2. parse Markdown into an AST,
3. validate structure deterministically,
4. repair exact structural failures with bounded retries,
5. run a second-pass semantic review only after structure passes,
6. accept or return a machine-readable failure report.

This spec is the next descendant of several already-real threads in `devel`:
- EDN contract work in `orgs/open-hax/opencode-skills/specs/`
- validation-assertion style in `specs/drafts/val-dsl-foundation-assertions.md` and `specs/drafts/shibboleth-validation-pipeline.md`
- bounded repair-loop patterns in `services/cephalon-cljs/docs/notes/cephalon/cephalon-tool-call-validation.md`
- CLJS runtime substrate in `orgs/open-hax/workbench/`
- receipt/truth workbench patterns in `packages/eta-mu-truth` and `services/eta-mu-truth-workbench`
- evidence that section ordering actually matters in `orgs/riatzukiza/promethean/docs/hacks/inbox/agent-patterns-key-findings.md`

## Why this belongs in devel

Under the devel placement contract:
- the **spec** belongs in `specs/drafts/`
- the **first prototype** should begin in `packages/output-contract-gate/`
- an **operator surface** may later live in `services/output-contract-gate-workbench/`
- if the system becomes portable and broadly useful, extract it into `orgs/open-hax/contract-gate/`

This keeps the first move small and reversible while preserving a clean public extraction path.

## Thesis

The contract system should enforce the cheapest, most objective dimension first.

For v1 that dimension is **response shape**.

A model that cannot reliably produce:
- the right sections,
- in the right order,
- with the right cardinality,
- under explicit local section rules,

has not earned the right to be scored semantically yet.

So the runtime becomes a two-gate system:

1. **Structure gate** — deterministic, AST-backed, machine-checkable, repairable.
2. **Review gate** — model-assisted, bounded in scope, evidence-aware, explicitly secondary.

## Concrete devel learnings

### 1. EDN contracts already have a living lineage here
Relevant anchors:
- `orgs/open-hax/opencode-skills/specs/kanban-fsm-contract-v1.md`
- `orgs/open-hax/opencode-skills/specs/edn-skill-graph-contracts-v1.md`

Those specs already converge on:
- list-form EDN
- normalized IR compilation
- deterministic validators later
- warn-only first, hard gates later

This pipeline should reuse that shape instead of inventing a new contract dialect.

### 2. Assertion-style validation is already a native pattern
Relevant anchors:
- `specs/drafts/val-dsl-foundation-assertions.md`
- `specs/drafts/shibboleth-validation-pipeline.md`

These show a good house style for:
- explicit pass/fail conditions
- evidence requirements
- phase-scoped verification
- deterministic acceptance criteria

The output pipeline should emit reports that feel like a runtime counterpart to these validation specs.

### 3. Bounded repair loops already exist conceptually
Relevant anchor:
- `services/cephalon-cljs/docs/notes/cephalon/cephalon-tool-call-validation.md`

The important pattern is already visible:
- validate locally
- produce exact failure reason
- issue a tight repair prompt
- retry within bounds

That pattern maps directly onto malformed Markdown structure.

### 4. CLJS runtime substrate already exists
Relevant anchor:
- `orgs/open-hax/workbench/`

Notably:
- the workbench already bundles a CLJS runtime
- `cljs.tools.reader.edn/read-string` is already present in the compiled runtime substrate

That means the EDN side is not speculative.
The missing piece is the contract interpreter + Markdown gate + orchestration.

### 5. A workbench/operator pattern already exists
Relevant anchors:
- `packages/eta-mu-truth/`
- `services/eta-mu-truth-workbench/`

That gives a strong pattern for later phases:
- small package for logic
- thin service for operator visibility
- append-only or receipt-backed stage artifacts

### 6. Structural inconsistency is already a documented pain point
Relevant anchor:
- `orgs/riatzukiza/promethean/docs/hacks/inbox/agent-patterns-key-findings.md`

That corpus explicitly calls out:
- standardized section ordering as a best practice
- lack of consistent section ordering as a real problem

So this system is not solving an imaginary issue.
It is extracting an already-observed need into an enforceable runtime.

## First reference contract

The first contract the system should enforce is the existing five-part output shape used by the local ημΠ contract:

1. `Signal`
2. `Evidence`
3. `Frames`
4. `Countermoves`
5. `Next`

Initial local rules:
- all five sections are required
- section order is fixed
- section headings must match exactly
- `Next` contains exactly one action
- `Frames` contains 2–3 plausible interpretations when present
- `Countermoves` contains checks against misinterpretation
- section-local rules should be declarative, not embedded in opaque prose

This gives the system one sharp, truth-adjacent, immediately useful contract target.

## Scope

### In scope for v1
- EDN contract schema for Markdown response structure
- normalized IR for structure + repair + review
- Markdown AST parser integration
- deterministic structure validation
- bounded repair prompt compilation from machine failures
- second-pass GPT-family review after structural success
- machine-readable failure reports
- receipts for generation, validation, repair, review, and final arbitration

### Out of scope for v1
- broad truth verification
- full world-model policy reasoning
- generalized autonomous contract synthesis
- arbitrary HTML/JSON/XML contract targets
- model-side semantic self-grading without a deterministic structure gate

## Recommended project shape

### Prototype source home
- `packages/output-contract-gate/`

### Optional operator surface later
- `services/output-contract-gate-workbench/`

### Eventual public extraction
- `orgs/open-hax/contract-gate/`

### Why this shape
- `packages/*` is the contract-correct birthplace for new prototype infrastructure in `devel`
- runtime/service UI belongs later in `services/*`
- the idea is public-product-shaped if it works, so `open-hax` is the right eventual canonical home

## Contract model

### Top-level EDN shape

```clojure
(agent-output-contract
  (name "eta-mu-five-section-response")
  (v "ημ.output/response-shape@0.1.0")
  (target
    (format :markdown)
    (ast :mdast)
    (root :document))
  (structure ...)
  (rules ...)
  (repair ...)
  (review ...)
  (arbitration ...))
```

### Normalized IR

The CLJS runtime should compile the list-form EDN into a normalized IR like:

```clojure
{:contract/name        "eta-mu-five-section-response"
 :contract/version     "ημ.output/response-shape@0.1.0"
 :target/format        :markdown
 :target/ast           :mdast
 :sections/by-id       {...}
 :sections/in-order    [...]
 :rules/by-id          {...}
 :repair/templates     {...}
 :review/criteria      [...]
 :arbitration/policy   {...}}
```

The runtime should never validate directly against raw EDN list forms.
It should validate against the compiled IR.

## Example reference contract

See companion file:
- `specs/drafts/contract-enforced-agent-output-pipeline.example.edn`

That file is not the only possible schema.
It is the first concrete specimen.

## Runtime pipeline

```text
Task + Contract + Session Context
  -> Fast Generator
  -> Markdown Parse
  -> Structure Validator
  -> [if fail] Repair Prompt Compiler -> Generator Retry
  -> [if pass] Review Prompt + Reviewer
  -> Final Arbiter
  -> Accept | Reject | Escalate
```

### Stage 1 — Generation
Input:
- task prompt
- loaded contract
- relevant session context

Output:
- raw Markdown candidate

The generator should be optimized for speed, not obedience.
That is the whole point of the gate.

### Stage 2 — Parse
The candidate is parsed into a Markdown AST.

For v1, do **not** build a custom parser.
Use a proven parser and interop from CLJS.

#### Recommended parsing strategy
1. Start with a JS Markdown AST parser reachable from the CLJS runtime.
2. Prefer `remark-parse` + `remark-gfm` / `mdast` style AST.
3. If useful, extract or wrap the existing Promethean markdown substrate later.

#### Why
`devel` already contains:
- remark/unified dependencies in the wider ecosystem
- markdown package lineage in `orgs/octave-commons/promethean/packages/markdown`

So the smart move is to reuse a parser substrate, not invent one.

### Stage 3 — Structure validation
Deterministic checks only.

Examples:
- missing required section
- duplicate section
- wrong section order
- unsupported heading text
- disallowed node type inside a section
- `Next` contains 0 or >1 actions
- `Frames` cardinality outside 2–3 items when required by contract

Validation output should be machine-readable.

Example report shape:

```clojure
(validation-report
  (contract "ημ.output/response-shape@0.1.0")
  (stage :structure)
  (ok false)
  (failures
    (failure
      (rule-id :rule/section-order)
      (section :section/evidence)
      (expected {:position 2 :heading "Evidence"})
      (actual   {:position 2 :heading "Frames"})
      (repair-id :repair/reorder-sections))
    (failure
      (rule-id :rule/next-exactly-one-action)
      (section :section/next)
      (expected {:action-count 1})
      (actual   {:action-count 3})
      (repair-id :repair/rewrite-next))))
```

### Stage 4 — Repair loop
Repair prompts must be generated from failure objects, not hand-wavy summaries.

Rules:
- maximum 2 bounded retries for v1
- repair prompt names exact violated rules
- repair prompt preserves passing content when possible
- repair prompt asks for minimal delta, not full regeneration, unless the AST is unrecoverable

Repair prompt example:

```text
Your last response failed the structure contract.
Repair only the following violations and preserve all other content:
1. Add missing section heading `## Evidence` in position 2.
2. Reorder sections to: Signal, Evidence, Frames, Countermoves, Next.
3. Rewrite `Next` so it contains exactly one concrete next action.
Return Markdown only.
```

### Stage 5 — Review gate
Only run if structure passes.

Reviewer input:
- normalized contract
- raw Markdown candidate
- optional session slice
- prior repair attempts summary

Reviewer output must be structured, not essayistic.

Suggested review dimensions:
- `contract_fidelity`
- `shortcutting_risk`
- `context_alignment`
- `actionability`

Example review result:

```json
{
  "ok": true,
  "score": 0.86,
  "criteria": {
    "contract_fidelity": 0.92,
    "shortcutting_risk": 0.78,
    "context_alignment": 0.85,
    "actionability": 0.89
  },
  "deltas": [
    "Frames are structurally correct but slightly under-developed.",
    "Evidence could cite the relevant tool outputs more explicitly."
  ]
}
```

### Stage 6 — Final arbitration
The final arbiter is simple in v1:
- if structure fails after bounded retries -> reject with machine-readable failure
- if structure passes and review score passes threshold -> accept
- if structure passes but review score misses threshold -> reject or request one semantic revision

Do not let the arbiter become a second opaque judge.
Keep it threshold + policy based.

## Deterministic rule vocabulary (minimum viable)

The minimum normalized structure vocabulary should cover:
- required sections
- heading text
- section order
- section cardinality
- allowed node types
- min/max child count
- local section rules
- repair template IDs
- review rubric criteria IDs

Suggested initial rule kinds:
- `:rule/required-section`
- `:rule/section-order`
- `:rule/unique-section`
- `:rule/allowed-node-types`
- `:rule/min-block-count`
- `:rule/max-block-count`
- `:rule/next-exactly-one-action`
- `:rule/frames-cardinality`

## Receipts

Each full run should emit deterministic receipts.

At minimum:
- contract version
- input task hash
- candidate hash
- parse result
- structure report
- repair attempts
- reviewer scores
- final decision

Suggested storage shape for v1:
- JSONL or EDN records under a run-specific artifact directory
- compatible with later truth-binding / receipt-river integration

Example artifact bundle:

```text
artifacts/output-contract-gate/<run-id>/
  contract.edn
  input.json
  candidate.md
  candidate.ast.json
  validation-report.edn
  repair-attempt-1.md
  repair-attempt-2.md
  review-report.json
  final-decision.json
```

## Workbench direction (not v1, but nearby)

Once the core gate works, a thin operator surface can be added.

Suggested later capabilities:
- inspect contract IR
- replay failing generations
- diff candidate AST before/after repair
- inspect reviewer deltas
- compare fast-model success rates by contract

This should follow the same package/service split used by ημ truth workbench.

## Implementation phases

### Phase 0 — Spec + reference contract
Deliverables:
- this spec
- first example EDN contract
- initial project naming/placement decision

Verification:
- spec exists
- example contract parses as EDN

### Phase 1 — Contract loader + IR compiler
Deliverables:
- EDN reader in CLJS runtime
- normalized IR compiler
- contract schema checks for required top-level forms

Verification:
- sample contract normalizes without ambiguity
- malformed contract returns deterministic compiler errors

### Phase 2 — Markdown gate
Deliverables:
- Markdown parser adapter
- AST-to-section extractor
- deterministic structure validator

Verification:
- gold fixtures of valid/invalid responses pass/fail exactly
- wrong heading/order/cardinality produce stable failure reports

### Phase 3 — Repair loop
Deliverables:
- failure-to-repair prompt compiler
- bounded retry controller

Verification:
- malformed fixture outputs are repaired into structural compliance within retry bound
- irreparable outputs fail cleanly with report

### Phase 4 — Review gate
Deliverables:
- reviewer prompt schema
- structured score output
- bounded semantic delta format

Verification:
- reviewer distinguishes known good/bad fixtures
- reviewer deltas remain contract-scoped and actionable

### Phase 5 — End-to-end orchestration
Deliverables:
- full pipeline driver
- run artifacts / receipts
- final arbitration policy

Verification:
- one reference contract runs end-to-end
- artifacts show each stage deterministically

## Verification plan

### Unit tests
- EDN contract normalization
- rule compilation
- AST section extraction
- local rule evaluation
- repair prompt compilation
- arbitration threshold behavior

### Fixture tests
- known-good Markdown
- missing section cases
- wrong order cases
- duplicate heading cases
- malformed `Next`
- structurally valid but semantically weak cases

### Loop tests
- fast generator intentionally emits malformed outputs
- repair loop converges or fails within bounds

### Review tests
- same structure, different semantic quality
- same output with and without session context
- ensure review score shifts only where context should matter

## Open questions

1. Should repair prompts be generated entirely from rule IDs plus templates, or may they include short natural-language explanation strings?
2. Should `Frames` and `Countermoves` be hard-required in all modes, or only in non-η delivery modes?
3. What exact Markdown AST adapter should v1 use in CLJS: direct JS interop to `remark`, or an extracted adapter around existing Promethean markdown utilities?
4. Should the reviewer return only scores + deltas, or also a machine-readable `semantic-failure-report` analogous to the structure report?
5. What retry bound is acceptable before escalation? Current recommendation: `2`.

## Risks

### Risk: structure correctness masquerades as true compliance
Mitigation:
- keep the semantic review gate explicit
- do not oversell structural success as semantic success

### Risk: reviewer drift into vague style commentary
Mitigation:
- require structured outputs
- constrain reviewer to contract criteria and actionable deltas

### Risk: parser substrate creep
Mitigation:
- reuse existing parser ecosystem
- do not build a bespoke Markdown parser in v1

### Risk: contract bloat
Mitigation:
- keep v1 vocabulary minimal
- add semantics incrementally only after the structure gate is solid

## Definition of done

A run is done when one reference contract can be enforced end-to-end such that:
- the contract loads from EDN into normalized IR
- a fast model generates a Markdown candidate
- the candidate is parsed into an AST
- structural mismatches are detected deterministically
- targeted repair prompts are compiled from exact failure objects
- repairs are bounded by retry policy
- a reviewer scores semantic contract fidelity only after structural success
- the final result is either:
  - accepted with receipts, or
  - rejected with a machine-readable failure report and actionable repair guidance

## Immediate next move

Prototype the narrowest useful slice:
- one contract
- one parser adapter
- one structure validator
- one repair loop
- one review schema

Do not start with a general contract platform.
Start with the five-section ημ response contract and make it real.

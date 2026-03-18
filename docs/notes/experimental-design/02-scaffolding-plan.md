---
title: "Scaffolding Plan — Policy Layers & Invariants"
date: "2026-01-30T01:30:29"
tags: [experimental-design, policy-layers, invariants, methodology]
summary: "Defines core invariants (split-at-source_id), policy layers (P1/P5/P7), baselines, and experimental matrix for the safety-evaluation framework."
---

Locked in. C is the right choice, and what you wrote is already “methods section” material.

Now we turn it into an implementable experimental design with **hard invariants**, **policy layers (P1/P5/P7)**, **baselines**, and a **test matrix** that won’t implode.

---

# 0) Core invariants (non-negotiable)

## I1 — Split at `source_id` before anything else

* Create `prompts` as canonical *problem-level* items.
* Assign `split ∈ {train, eval}` at `source_id` granularity.
* **All derived items** (translations, code-mix, homoglyph, sessions) inherit split from the parent `source_id`.

## I2 — Cluster-safe split to prevent paraphrase leakage

Beyond exact `source_id`, do *semantic clustering* on canonical text:

* Cluster prompts by embedding similarity (language-agnostic model).
* Split **by cluster** so near-duplicates don’t land in both sets.

This is the thing that stops “I paraphrased the jailbreak” from inflating results.

## I3 — Eval-only suites are immutable

`codemix`, `homoglyph`, `unicode`, `exhaustion` suites are:

* deterministic transforms
* seeded
* generated **after split**
* **never used for training**

---

# 1) Dataset products (C, but staged)

You already landed on the right staging:

## Phase 1 (Prompt-level dataset)

Goal: measure **safety–availability–cost** without session confounds.

### Files

* `prompts.parquet`

  * `source_id`, `canonical_text`, `intent_label`, `attack_taxon`, `harm_category`, `notes`, `cluster_id`, `split`
* `variants.parquet`

  * `variant_id`, `source_id`, `language`, `text`, `variant_type`, `transform_seed`, `translation_meta`, `quality_flags`
* `suites.parquet` (optional but clean)

  * `variant_id`, `suite_name` (native|mt|backtrans|codemix|homoglyph|unicode|exhaustion), `suite_params`

## Phase 2 (Session dataset + deterministic generator)

Goal: measure session granularity, risk accumulation, and cost-amplification attacks.

* `sessions.jsonl`

  * `session_id`, `seed`, `template_id`, `source_id_set`, `turns[]`
* Each turn:

  * `turn_index`, `role`, `variant_id`, `attack_stage` (benign|probe|attack|recovery), `expected_policy_outcome`

---

# 2) The experiment as a factorized matrix

Your experiment cell is:

`policy_layer × target_llm × suite × language × (session_template?)`

Make it manageable by defining **tiers**.

## Tier A (publishable baseline, prompt-level)

* policy_layer: **P1, P5, P7**
* target_llm: 3–6 models (pin versions)
* suite: `native`, `mt`, `codemix`, `homoglyph`
* languages: top 10 (expand later)

## Tier B (novelty amplifier, session-level)

* policy_layer: **P1, P7** (and optionally P5)
* session_template: 6–10 templates
* suite: `native`, `mt`, `codemix`, `homoglyph`, `exhaustion`
* languages: top 6–10

You’ll still have a big grid—so you need **standardized routing** and **aggressive logging**.

---

# 3) Policies (P1 / P5 / P7) as *precise* interventions

You listed an action space. Now we bind it.

## P1 — Hard block

**Decision:** classifier says `risk ≥ τ_block` → block.

Outputs:

* `decision=BLOCK`
* `reason_code` (taxonomy or “high risk”)

No model call. This is your *availability-killer / cost-saver* baseline.

## P5 — System-risk injection

Let the request through, but inject a system message with structured risk context.

* Add to system prompt: `{risk_score, risk_factors, policy_reminders, max_budget}`

Still calls target LLM.
This tests: “Can we reduce unsafe outputs without refusing benign prompts?”

## P7 — Full-stack (the production hypothesis)

A cascade that can do:

1. risk scoring (stateless + session-state)
2. budget shaping (thinking, tools, tokens)
3. throttling / rate limit adaptation
4. optional prompt annotation/editing
5. optional tool gating
6. fallback mode (summarize refusal vs answer)

P7 is not “one trick”, it’s a *pipeline* with knobs. For the paper, keep it to a few deterministic knobs.

### Proposed P7 cascade (minimal)

* Step A: classifier produces `risk_score` + `risk_type`
* Step B: choose a **budget profile**:

  * `SAFE`: normal
  * `SUSPECT`: lower output cap, disable tools, lower reasoning budget, force short answers
  * `HOSTILE`: block or throttle + minimal refusal
* Step C: apply:

  * tool-call cap
  * token cap
  * throttle schedule
  * system-risk injection

Keep everything deterministic with a seed and logged thresholds.

---

# 4) Baselines (control conditions)

You need controls that isolate “policy layer benefit” vs “model safety training”.

Minimum baseline set:

1. **B0: No guardrail**

* Direct model call.

2. **B1: Provider safety only**

* Same as B0, but with provider’s default moderation/safety (if any).

3. **B2: Simple heuristic**

* Regex / keyword / known jailbreak templates
* This is your “cheap baseline” to show improvement.

4. **B3: Existing classifier (if available)**

* e.g., off-the-shelf prompt-injection detector
* Even if English-biased, it’s a comparison point.

Then your trained model is:

5. **M1: Your multilingual classifier**

* trained only on train split, no eval suites.

---

# 5) Metrics: Safety × Availability × Cost (make them computable)

## Safety metrics

Prompt-level:

* **ASR** (attack success rate): fraction of adversarial prompts that yield disallowed content or tool misuse
* **FNR**: adversarial allowed
* Category ASR (per harm taxonomy)

Session-level:

* **Time-to-detect**: turn index when policy first intervenes
* **Session ASR**: any successful breach in session
* **Escalation sensitivity**: risk increases with repeated probes?

## Availability metrics

Prompt-level:

* **FPR**: benign blocked/refused
* **Benign completion rate**
* **Benign helpfulness proxy**: short rubric or automatic “answered vs refused vs irrelevant”

Session-level:

* **Recovery success**: after probes/attacks, benign queries still answered?
* **Refusal contagion**: benign prompts refused after hostile history

## Cost metrics (must be instrumented)

Per request / per turn:

* tokens_in, tokens_out
* latency_ms
* number_of_calls (guardrail + LLM + tools)
* tool_calls_count
* “guardrail invocations” count (how many extra models you called)

Derived:

* **Token burn trajectory** per session
* **Cost per prevented attack**
* **Cost per false positive** (punishes overblocking-heavy policies)

---

# 6) Evaluation suites (how you prove novelty)

You’ll report results per suite:

1. **Native** (original language dataset items)
2. **Translated** (MT variants)
3. **Code-mix** (eval-only deterministic swaps)
4. **Homoglyph/Unicode** (eval-only deterministic transforms)
5. **Exhaustion** (eval-only) — prompts engineered to maximize cost

Each suite includes:

* parameters
* deterministic seed
* normalization toggles (especially for unicode)

This is where your paper becomes more than “we trained a classifier”.

---

# 7) Session generator templates (minimal set that matters)

Design 8 templates, each with deterministic seed:

1. benign → benign → benign (control)
2. benign → probe → benign recovery
3. probe → probe → probe (risk accumulation)
4. probe → attack → attack escalation
5. attack → paraphrase → language switch
6. benign → long benign → adversarial suffix (context manipulation)
7. homoglyph attack → clean benign recovery
8. exhaustion attempt → benign request (tests refusal contagion + cost shaping)

Templates should declare:

* which `attack_stage` sequence
* language pattern (single language vs switch)
* suite usage per turn

---

# 8) Logging contract (what makes it defensible)

Per turn, log:

* identifiers: `policy_layer`, `target_llm`, `provider`, `model_id`, `session_id`, `turn_index`, `variant_id`, `source_id`
* inputs: `prompt_hash`, `policy_inputs_hash`
* outputs: `response_hash`, `decision` (allow|block|throttle|budget_profile)
* costs: `tokens_in/out`, `latency_ms`, `guardrail_calls`, `tool_calls`
* traces: `risk_score`, `risk_type`, `thresholds`, `budgets_applied`

The hashes let you publish logs without publishing raw harmful content.

---

# 9) What we do next (concrete build order)

**Step 1 — Schema + split**

* Build `prompts.parquet` from your corpus sources
* compute `cluster_id`
* assign `split` at `cluster_id` level (inherits to `source_id`)

**Step 2 — Variant generation**

* MT for train split and eval split separately
* record translation metadata + backtrans similarity

**Step 3 — Eval suites**

* codemix generator (seeded, controlled percentages)
* homoglyph/unicode generator (seeded, script-aware mappings)
* exhaustion generator (tokenizer-aware)

**Step 4 — Policy router**

* implement P1, P5, P7 with deterministic thresholds
* dumb target-model adapter interface

**Step 5 — Run Tier A**

* prompt-level suite
* results + tradeoff curves

**Step 6 — Session generator + Tier B**

* build sessions.jsonl deterministically
* run and plot token burn trajectories + refusal contagion

---

If you want, I’ll write the actual **“Methods: Dataset Construction + Split Invariants + Suites + Experimental Factors”** section next in paper style, but before that: tell me what you want as your **canonical taxonomy** for `attack_taxon` (coarse is fine). My default suggestion is:

* jailbreak
* prompt_injection
* policy_probe
* system_exfil
* tool_abuse
* obfuscation
* cost_attack

That taxonomy becomes the spine for reporting ASR/FNR by category.

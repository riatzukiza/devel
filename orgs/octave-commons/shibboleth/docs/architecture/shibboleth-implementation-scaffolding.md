---
original_name: "implementation-scaffolding.md"
description: "Adversarial prompt classifier implementation scaffolding - Milestones, schemas, dataset wire-up, and research plan"
tags: ["shibboleth", "implementation", "scaffolding", "roadmap", "adversarial-prompts"]
created: 2026-03-13
---

---
original_name: "2026.03.03.15.00.49.md"
description: "Adversarial prompt classifier implementation scaffolding - Milestones, schemas, dataset wire-up, and research plan"
tags: ["research", "adversarial-prompts", "implementation", "scaffolding", "roadmap"]
created: 2026-03-03
---

Locked in. Next move is to turn this into **repo-shaped reality**: schemas, IDs, split invariants, and a minimal end-to-end ingestion → split artifact. Once that spine exists, policies/adapters/eval runner plug in cleanly.

I’ve laid out the full scaffolding plan in the canvas (“Adversarial Prompt Classifier — Research Scaffolding Plan”). Here’s how we move from plan → code without scope explosion.

## 0) Decide the *first executable milestone*

**Milestone M0: “Leakage-proof dataset spine”**
Output artifacts that prove we can build and split the canonical prompt table correctly:

* `prompts.parquet` with `source_id`, `intent_label`, `attack_taxon`, `canonical_text`, `cluster_id`, `split`
* split manifests: `splits/source_ids_train.txt`, `splits/source_ids_eval.txt`
* a config snapshot and a reproducible `run_id`

No translation, no suites, no model calls yet. Just the invariant.

## 1) Implement in this exact order (low regret)

### Step 1 — Schemas + stable IDs

Create:

* `schema/prompts.schema.json`
* `schema/variants.schema.json`
* `schema/sessions.schema.json`
* `schema/logs.schema.json`

And utilities:

* `hash.ts` (sha256 helpers)
* `seed.ts` (deterministic RNG wrapper)
* `lang.ts` (BCP-47 normalization, script detection helpers)

**Rule:** `source_id` must be stable and independent of any translation/augmentation.

### Step 2 — One dataset end-to-end

Pick *one* source to prove the pipe (I’d start with `aya_redteaming` or `All-Prompt-Jailbreak` depending on download friction).

Implement:

* `src/ingest/sources/<dataset>.ts` loader
* `normalize.ts` (NFKC + whitespace)
* `build_prompts.ts` → writes `prompts.parquet`

### Step 3 — Cluster + split

Implement:

* `cluster_split.ts`:

  * embed `canonical_text` with a multilingual sentence embedder
  * cluster near-duplicates
  * split **by cluster_id** (group split)
  * write split manifests + updated `prompts.parquet`

At this point you’ve *made leakage hard*.

## 2) Research scaffolding that matters for the paper

### Preregistration-lite (so you don’t drift)

Write a short `docs/preregistration.md` with:

* What you’re comparing: **P1 vs P5 vs P7** across model targets
* Primary metrics: **Safety / Availability / Cost**
* What counts as “novel mode”: code-mix, homoglyph/unicode, cost attacks, tool-abuse scaffolds
* What you will not claim: “we beat all guardrails” / “we solve alignment”

### Threat model doc (you asked for it earlier)

You already have the axis; the doc should explicitly define:

* assets (availability budget, tool permissions, system prompt integrity)
* attacker goals (harmful output, bypass, *cost burn*, tool misuse)
* attacker capabilities (multi-turn, multilingual, obfuscation, repetition)
* defender controls (P1/P5/P7 + instrumentation)

## 3) Experimental structure (what gets evaluated)

You’ve got an evaluation matrix coming. The clean factorization is:

`policy_layer × target_llm × language_suite × attack_suite × (prompt-level | session-level)`

Start prompt-level first (publishable alone), then session-level as the novelty amplifier.

## 4) What I need from you to start writing real code next turn

No broad scans. Just this:

1. **Repo path** you want this scaffolding added to (or say “make a new minimal repo skeleton here”).
2. Which dataset to wire first for M0:

   * `CohereForAI/aya_redteaming`
   * `AiActivity/All-Prompt-Jailbreak`
   * other (name it)

If you answer those two, next message I’ll produce the **initial file set** (schemas + utilities + one loader + build_prompts + cluster_split) in a minimal, runnable form.

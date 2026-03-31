---
title: "Dataset Plan & Language Tiers"
date: "2026-01-30T01:30:56"
tags: [experimental-design, dataset-construction, language-tiers, multilingual]
summary: "Detailed plan for multilingual dataset construction with Tier 1/2 languages, translation strategy, and split-before-translate invariant."
---

Good.

That is a serious paper direction.

But now I’m going to slow you down slightly — because the way you just described the dataset construction will determine whether this becomes rigorous research or just “LLM-generated multilingual noise.”

You are building a **safety–availability–cost evaluation framework**.

That means:

* The framework must be defensible.
* The dataset must not contaminate the evaluation.
* The multilingual construction must not collapse into template inflation.

Let’s structure this correctly.

---

# I. Paper Objective (Formalized)

> We introduce a safety–availability–cost evaluation framework for LLM guardrail systems under multilingual sparsity and adversarial session dynamics.

Key components:

1. Multilingual adversarial + benign corpus
2. Deterministic obfuscation extensions
3. Stateful attack session generator
4. Policy comparison layer (P1 vs P7 etc.)
5. Cost-aware evaluation metrics

You are not claiming to invent the best classifier.
You are claiming to invent a **way to evaluate systems correctly.**

That is cleaner and more publishable.

---

# II. Multilingual Dataset Plan (Refined)

Your current plan:

> Translate all prompts into top 20 languages → mix → split train/eval.

This is close, but it needs safeguards.

## Critical Risk #1 — Leakage

If you translate *before* splitting, you will leak semantic content across languages into train and test.

You must:

### Step 1 — Canonical Source Indexing

Assign each original prompt a unique `source_id`.

Then split at the source level:

* 70% source_ids → training
* 30% source_ids → evaluation

Only then translate.

That way:

* All translations of a given original prompt stay in either train or eval.
* No cross-language semantic leakage.

This is absolutely mandatory.

---

# III. Language Expansion Strategy

You said: “top 20 most spoken languages.”

That’s ambitious. Good. But structure it.

### Tier 1 Languages (high-resource)

* English
* Mandarin
* Spanish
* Hindi
* Arabic
* Bengali
* Portuguese
* Russian
* Japanese
* German

### Tier 2 Languages (stress test)

* Indonesian
* French
* Turkish
* Vietnamese
* Korean
* Polish
* Ukrainian
* Thai
* Persian
* Swahili

Now, translation strategy:

* Use high-quality MT (e.g., NLLB or similar)
* Back-translation consistency check for semantic drift
* Flag translations that significantly alter meaning

Log translation confidence.

Do NOT fine-tune the model on translation artifacts blindly.

---

# IV. Mixed-Language Prompt Construction

This is interesting and important.

You want to simulate “schizoprompting.”

But it must be controlled.

## Mixed-language generation rules

For evaluation only (not training initially):

1. Random segment-level language swaps (e.g., 30% Spanish, 70% English)
2. Script mixing (Cyrillic + Latin homoglyph variants)
3. Technical jargon preserved in English inside foreign sentences
4. Random injection of a second language in override clauses

Crucially:

* Keep semantic intent unchanged.
* Label remains same as original source.

This becomes:

### Suite M — Code-mixed adversarial robustness

This is novel and publishable.

---

# V. Training Strategy for Your Model

You are training one model.

Good.

Keep it simple:

* Encoder-only (XLM-R large or DeBERTa-v3 multilingual)
* Binary adversarial vs benign head
* Optional multi-head classification

Train only on:

* Native corpora
* Translations of training split
* DO NOT train on obfuscation or mixed-language synthetic sets initially

Then evaluate on:

* Native eval
* Translated eval
* Mixed eval
* Obfuscation eval

This shows generalization gaps.

---

# VI. The Three Axes of Evaluation

You need to define them explicitly.

## 1. Safety

* Unsafe completion rate
* FN rate of adversarial prompts
* Tool misuse rate

## 2. Availability

* False refusal rate
* Benign success rate
* Session abandonment proxy (if refusal loop)

## 3. Cost

* Tokens consumed per session
* Latency
* Tool calls per session
* Token burn under attack scenario

You will present 3D tradeoff plots.

That’s your framework contribution.

---

# VII. Stateful Attack Simulation

This is critical and novel.

You should design attack sessions like:

Session type A:

* 5 benign
* 3 policy probes
* 1 injection attempt
* 1 benign recovery attempt

Session type B:

* Repeated near-threshold jailbreak attempts
* Slight paraphrase each time
* Measure escalation in R_t

Session type C:

* Obfuscated injection
* Clean prompt
* Mixed-language injection

You measure:

* Risk accumulation behavior
* Overblocking spillover
* Token burn trajectory

This is extremely underexplored.

---

# VIII. What Makes This Paper Strong

If you do this properly:

You will show:

1. Many guardrail systems optimize for safety only.
2. Multilingual performance collapses under code-mix.
3. Stateful mitigation reduces cost attacks dramatically.
4. Overblocking is highly sensitive to contamination.

That’s meaningful.

---

# IX. One Very Important Warning

If you translate adversarial prompts into 20 languages,
you are building the largest multilingual jailbreak corpus publicly available.

Be very careful how you release it.

Possible safe release format:

* Masked harmful content
* Category labels without raw text
* Partial release with access gating
* Evaluation API only

If you release full raw adversarial text, you must justify it carefully.

---

# X. Next Critical Decision

Before implementation:

Do you want:

A) Pure classification dataset (flat prompt-level)
B) Session-level dataset (turn-indexed conversations)
C) Both

If you want to dominate the safety–availability–cost framing,
the answer should be C.

But that increases complexity significantly.

Choose deliberately.

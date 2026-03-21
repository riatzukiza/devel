---
title: "Refined Objectives — Suite Structure"
date: "2026-01-31T01:31:13"
tags: [experimental-design, evaluation-suites, attack-modes, baselines]
summary: "Defines evaluation suite structure: Native Corpora, Controlled Synthetic Extensions (obfuscation), Availability Stress Suite (cost attacks). Establishes baselines B0-B3 and P1/P5/P7 policies."
---

Good.

Now we’re actually doing research.

Your dataset survey just did something important: it exposed that **advanced attack modes are almost completely unrepresented in non-English corpora**.

That changes your experiment design.

You cannot just evaluate “classifier accuracy.” You need to evaluate:

1. Detection under real corpora
2. Detection under *missing-coverage* attack classes
3. Cross-lingual robustness under synthetic-but-controlled generation

So the experiment must explicitly account for structural sparsity.

---

# Step 1 — Refine the Experimental Objective

Your paper is no longer just:

> “We built an adversarial prompt classifier.”

It is now:

> “We evaluate mitigation policies under realistic multilingual sparsity conditions and demonstrate safety–availability tradeoffs.”

That is stronger.

---

# Step 2 — Experimental Data Structure

Because datasets are sparse and uneven, your evaluation suite must be modular.

## Final Suite Structure

### Suite A — Native Corpora (Real-World Coverage)

Use only genuinely native datasets:

* zh: JailBench (public subset)
* ja: APTO
* ru: Aya (RU)
* es: Aya (ES)
* de: h4sch (small but real)
* pl/uk: none (documented as zero baseline)

This measures:

* Baseline detection capability
* Cross-language generalization
* Calibration drift

---

### Suite B — Controlled Synthetic Extensions

You must fill the attack-mode gaps in a controlled way.

But carefully.

You do NOT want sloppy LLM-generated junk.

You want:

For each language:

* Unicode obfuscation injection
* Homoglyph substitution
* Zero-width embedding
* Script mixing
* Multi-turn escalation patterns
* Resource exhaustion patterns

But generation rules must be:

* Deterministic transformations
* Minimal semantic alteration
* Verifiable ground truth

Example:
Take real zh JailBench prompt → inject zero-width joiners in 5% of characters → label remains adversarial.

Take benign Spanish QA prompt → insert homoglyph noise → label remains benign.

That gives you:

* Obfuscation detection capability
* False positive sensitivity under script mixing

This becomes Suite C.

---

### Suite C — Availability Stress Suite (Cost Attack)

Construct adversarial sessions:

* Repeated borderline probes
* Long prefix escalation
* Repeated injection attempts
* Token amplification payloads

Measure:

* Token burn
* Refusal loops
* Time-to-hard-block
* Degradation behavior

This suite is crucial because your thesis includes:

> Adversaries can cause damage without bypassing safety by forcing high-cost reasoning or triggering cascading refusals.

Most papers ignore this.

---

# Step 3 — Control & Baseline Definition

Your baselines must be clean.

## Baseline Systems

B0 — Raw LLM (no proxy)
B1 — Classifier only (block at threshold)
B2 — P5 (risk injection only)
B3 — P7 (full stack)

We compare:

* Unsafe completion rate
* False refusal rate
* Tokens per session
* Tool misuse rate
* Latency

All across:

* Language
* Attack mode
* Session depth

---

# Step 4 — Critical Research Variable

You must vary **risk threshold τ**.

Plot:

* Safety vs Availability
* Safety vs Cost
* Availability vs Cost

Across:

* English
* Chinese
* Japanese
* Russian
* Spanish
* German

This gives a Pareto frontier paper.

That’s publishable.

---

# Step 5 — The Hard Question

You now need to decide something foundational:

Are you evaluating the proxy as:

A) A standalone classifier
B) A classifier + policy layer
C) A classifier + policy + stateful session model

If you aim for publication-level novelty, you want C.

Because almost nobody rigorously evaluates **stateful risk accumulation** and its effect on overblocking.

That is your differentiator.

---

# Step 6 — What You Should Build First

Do not build everything.

Build this:

1. Dataset canonicalizer
2. Deterministic obfuscation transformer
3. Stateless classifier baseline
4. Risk accumulator module (with leaky bucket)
5. Two mitigation policies (P1 and P7 only)

Skip P5 initially — it's messy and can bias results.

Get P1 vs P7 working first.

Then layer P5.

---

# Step 7 — Publication Reality

You asked earlier about arXiv.

Uploading to arXiv is easy.
Getting respected is not.

To be credible:

* You must open-source the evaluation suite.
* You must provide exact reproduction scripts.
* You must publish raw metrics.
* You must report negative results.

If you do that — this becomes real research.

---

Now the next serious decision:

Do you want this paper to primarily contribute:

1. A multilingual dataset analysis
2. A proxy mitigation architecture
3. A safety–availability–cost evaluation framework

Pick one.

That determines how you write everything.

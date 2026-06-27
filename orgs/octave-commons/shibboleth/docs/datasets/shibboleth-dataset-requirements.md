---
original_name: "adversarial-prompt-dataset-requirements.md"
description: "Deep research prompt for adversarial prompt dataset - Requirements for production-grade multilingual adversarial prompt classifier datasets"
tags: ["shibboleth", "adversarial-prompts", "dataset", "requirements", "multilingual"]
created: 2026-03-13
---

---
original_name: "deep-research-adversarial-prompt-dataset.md"
description: "Deep research prompt for adversarial prompt dataset - Requirements for production-grade multilingual adversarial prompt classifier datasets"
tags: ["research", "adversarial-prompts", "dataset", "prompt-engineering"]
created: unknown
---

## Deep Research Prompt (no-bullshit mode)

You are acting as a **security ML engineer** building a **production-grade adversarial-prompt classifier** (jailbreak / prompt injection / instruction conflict / tool abuse / token-drain attacks). Your job is to find the **highest quality datasets** for training and evaluation, and to call out low-quality corpora, label noise, leakage, and template-duplication risks.

### What I’m building

A fast **CPU-friendly text classifier** that runs in front of LLMs to:

* detect prompt jailbreak attempts
* detect prompt injection / system override attempts
* detect “policy probing” / guardrail mapping
* detect tool-abuse attempts (e.g., “call tool X to exfiltrate Y”)
* detect token/resource exhaustion prompts (“repeat X 10k times”, recursive expansion)
* avoid blocking benign lookalikes (false positives are expensive)

### Output requirements

Return a **ranked short list (top ~10)** of datasets, with **links**, and a **hard-nosed assessment** of quality.

For **each dataset**, provide:

1. **Name + link** (Hugging Face / GitHub / official)
2. **Size** (#samples, turns, conversations)
3. **Label quality**

   * label schema (binary / multi-class / structured tags)
   * how labels were created (human, synthetic, weak supervision, model-generated)
   * inter-annotator agreement if available
4. **Coverage**

   * jailbreak vs injection vs probing vs tool abuse vs token-bomb
   * single-turn vs multi-turn chains
   * “benign lookalike” negatives included? (critical)
   * languages (English-only vs multilingual)
5. **Duplication / leakage risk**

   * template-heavy? near-duplicates? meme-jailbreak copies?
   * are train/test splits provided and are they trustworthy?
6. **Realism**

   * real transcripts vs synthetic prompts
   * “in-the-wild” vs laboratory
7. **License** + whether it’s safe for commercial/prod use
8. **Recency / maintenance** (last updated)
9. **Known problems** (label noise, missing negatives, bias, etc.)
10. **My use verdict**

* Train suitability (0–10)
* Eval suitability (0–10)
* Notes on required cleaning/augmentation

### Constraints / preferences

* Prefer datasets with **strong negative sets** (benign lookalikes that resemble attacks).
* Prefer datasets with **metadata** (attack family, source, turn index).
* Prefer datasets with **multi-turn injection** and **agent/tool context** where available.
* Flag datasets that are mostly **copy-paste jailbreak templates** unless they’re useful as a narrow component.
* If no dataset covers token/resource exhaustion well, say so and propose substitutes.

### Also required: papers + benchmarks

Find and cite the **best papers/benchmarks** tied to these datasets and detection approaches:

* jailbreak / prompt injection detection methods
* classifier baselines, robustness techniques
* evaluation suites that test generalization across attack styles

### Deliverables format

1. **Ranked table** (top → bottom)
2. **Best 3 training recipes**

   * “minimal viable” (fast to ship)
   * “robust generalist”
   * “agent/tool-aware”
3. **Best 3 evaluation suites**
4. **Gap analysis**

   * what’s missing in public data (esp. tool abuse + token drain)
5. **Cleaning plan**

   * dedupe / cluster templates
   * group split to prevent leakage
   * balancing strategy
6. **No filler**

   * If you’re unsure, say “unknown” and show what evidence you checked.
   * Do not pad with generic safety datasets unless clearly relevant.

### Starting point (you must expand beyond this)

* AiActivity/All-Prompt-Jailbreak (Hugging Face)
* Any strong “benign lookalike” datasets (e.g., WildJailbreak)
* Any prompt injection datasets tied to web agents / tool use
* Any red-team corpora from credible sources

Now do the search, cross-check sources, and produce the deliverables.

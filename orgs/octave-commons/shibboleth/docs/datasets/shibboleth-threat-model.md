---
original_name: "threat-model-adversarial-classifier.md"
description: "Threat Model and Evaluation Protocol for Multilingual Adversarial Prompt Classifier"
tags: ["shibboleth", "threat-model", "adversarial-prompts", "classifier", "evaluation", "multilingual"]
created: 2026-03-13
---

---
original_name: "2026.03.03.13.15.48.md"
description: "Threat Model and Evaluation Protocol for Multilingual Adversarial Prompt Classifier - System overview, threat classes, evaluation partitions, and metrics"
tags: ["research", "adversarial-prompts", "threat-model", "evaluation", "classifier"]
created: 2026-03-03
---

# Threat Model and Evaluation Protocol

## Title

A Production-Grade Multilingual Adversarial Prompt Classifier (APC)

---

# 1. System Overview

We consider a system in which a pre-LLM adversarial prompt classifier (APC) filters user inputs before they reach a large language model (LLM).

System pipeline:

User → APC → Policy Layer → LLM → Tools (optional)

The APC outputs:

* allow
* allow_with_sanitization
* require_step_up (optional)
* block

The APC may operate in:

* Stateless mode (turn-level classification)
* Stateful mode (conversation-level risk accumulation)

---

# 2. Threat Model

## 2.1 Adversary Capabilities

The adversary:

* Has black-box access to the system
* Can issue repeated queries
* Can adapt prompts based on observed responses
* Can craft multilingual inputs
* Can use code-mixing across languages
* Can use Unicode obfuscation (homoglyphs, zero-width characters, script mixing)
* Can attempt multi-turn gradual prompt injection
* Can attempt resource exhaustion attacks

The adversary does not:

* Have access to classifier weights
* Have privileged system access

---

## 2.2 Attack Objectives

We model two primary adversarial objectives.

### A. Under-Blocking (Safety Failure)

Goal: cause adversarial prompts to pass through the APC and reach the LLM.

Examples:

* Prompt jailbreak attempts
* Instruction override attempts
* System prompt extraction
* Tool abuse / exfiltration attempts
* Policy probing

Metric of concern: Attack Pass-Through Rate (APTR)

---

### B. Availability Degradation (Safety-DoS)

Goal: degrade system usefulness without successful compromise.

Examples:

* Trigger repeated refusals
* Cause benign prompts to be blocked due to prior adversarial context
* Inflate token usage via refusal spirals
* Saturate risk scoring mechanisms
* Induce excessive latency or cost

Metric of concern: Benign Refusal Rate (BRR) and Token Burn Rate (TBR)

This framing treats adversarial prompting as a potential availability attack.

---

# 3. Threat Classes

We define adversarial input classes:

1. Jailbreak attempts
2. Prompt injection
3. Instruction override
4. System prompt extraction
5. Tool abuse / exfiltration
6. Policy probing
7. Multilingual evasion
8. Code-mixed evasion
9. Unicode / homoglyph obfuscation
10. Resource exhaustion prompts

Benign inputs include:

* Security research discussion
* Quoted adversarial text
* Prompt engineering conversations
* JSON / system-like formatting
* Multilingual benign content

---

# 4. Evaluation Partitions

We construct four evaluation partitions.

## Partition A: Benign-but-High-Risk-Looking

Purpose: Measure over-blocking.

Includes:

* Discussions about jailbreaks
* Policy critique
* Quoted adversarial prompts
* Security research text
* Code-mixed benign inputs
* Heavy JSON/system-like formatting

Primary metric: Benign Refusal Rate (BRR)

---

## Partition B: Direct Adversarial Attempts

Purpose: Measure under-blocking.

Includes:

* Jailbreak templates
* Injection attempts
* System override prompts
* Tool misuse attempts

Primary metric: Attack Pass-Through Rate (APTR)

---

## Partition C: Obfuscation and Evasion

Purpose: Measure robustness under input transformations.

Includes:

* Homoglyph attacks
* Zero-width characters
* Mixed scripts
* Leetspeak
* Base64-like payload wrapping
* Gradual multi-turn injection

Primary metric: Robust Attack Detection Rate (RADR)

---

## Partition D: Resource Exhaustion / Safety Saturation

Purpose: Measure availability resilience.

Includes:

* Repeated near-boundary adversarial prompts
* Appeals to policy loops
* Long refusal-trigger prompts
* Conversational grinding patterns

Primary metrics:

* Token Burn Rate (TBR)
* Latency overhead
* Time-to-recovery after adversarial turns

---

# 5. Baselines

We evaluate against:

## B0: Null Baseline

Always allow.

Purpose: Establish maximum compromise rate.

## B1: Rule-Based Baseline

* Unicode normalization
* Zero-width stripping
* Keyword / regex scoring
* Simple repetition detection

## B2: Linear Model Baseline

* TF-IDF (word + character n-grams)
* Logistic regression

These baselines provide minimum acceptable performance.

---

# 6. Candidate Architectures

1. Multilingual encoder classifier (e.g., XLM-R, mDeBERTa)
2. Byte-level / character-level classifier
3. Embedding + linear head model
4. Turn-level classifier + explicit risk accumulator (stateful layer)

The stateful risk accumulator may use:

* Exponential moving average
* Leaky bucket
* Hidden Markov model

---

# 7. Metrics

## Turn-Level Metrics

* AUROC
* PR-AUC
* False Positive Rate (FPR)
* True Positive Rate (TPR)
* FPR at fixed TPR
* TPR at fixed FPR

## Over-Blocking Metric

Benign Refusal Rate (BRR)

## Under-Blocking Metric

Attack Pass-Through Rate (APTR)

## Resource Metrics

* Token Burn Rate (TBR)
* Latency p50/p95
* Compute overhead

## Stateful Metrics

* Risk decay rate
* Context contamination rate
* Time-to-recovery

---

# 8. Fairness and Robustness Controls

* Template holdout splits
* Language-stratified splits
* Cross-lingual generalization tests
* Distribution shift tests
* Per-language breakdown reporting

---

# 9. Success Criteria

A production-grade APC should:

* Maintain low APTR on adversarial partitions
* Maintain low BRR on benign partition
* Demonstrate robustness to obfuscation
* Avoid runaway risk accumulation
* Reduce overall token burn compared to LLM-only refusal

---

# 10. Research Contribution Angle

This work explicitly frames adversarial prompting not only as a safety bypass problem but also as an availability and cost degradation attack.

The evaluation protocol measures both dimensions.

This dual-objective framing distinguishes this work from prior jailbreak-only detection research.

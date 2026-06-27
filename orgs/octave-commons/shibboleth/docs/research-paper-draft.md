---
title: "Shibboleth: A Production-Grade Multilingual Adversarial Prompt Classifier Evaluation Framework"
description: "Research draft synthesizing threat model, dataset requirements, pipeline architecture, and evaluation methodology for multilingual adversarial prompt classification"
tags: ["shibboleth", "research", "adversarial-prompts", "llm-safety", "evaluation", "multilingual"]
created: 2026-03-13
status: draft
---

# Shibboleth: A Production-Grade Multilingual Adversarial Prompt Classifier Evaluation Framework

## Abstract

We present **Shibboleth**, a comprehensive evaluation framework for building and assessing production-grade multilingual adversarial prompt classifiers (APCs). Unlike prior work that focuses narrowly on jailbreak detection, Shibboleth frames adversarial prompting as a dual-objective problem: **safety bypass** (causing harmful outputs) and **availability degradation** (DoS via cost/latency attacks). Our framework introduces a 7-stage deterministic pipeline, leakage-proof dataset architecture, and a four-part evaluation partition scheme measuring Safety–Availability–Cost tradeoffs across native, translated, code-mixed, and obfuscated prompts. Key contributions include: (1) a threat model explicitly modeling multilingual evasion and resource exhaustion attacks, (2) a dataset schema with cluster-level splits preventing semantic leakage, (3) an evaluation protocol with SEU (Security–Utility–Efficiency) tradeoff curves, and (4) an open benchmark identifying critical gaps in current multilingual adversarial datasets.

---

## 1. Introduction

Large Language Models (LLMs) deployed in production face a growing threat from adversarial prompts—inputs designed to bypass safety measures, extract system prompts, abuse tool permissions, or exhaust computational resources. Current detection approaches suffer from three critical limitations:

1. **English-centrism**: Most adversarial prompt datasets target English, leaving multilingual LLMs vulnerable to cross-lingual evasion (schizoprompting).
2. **Single-turn bias**: Evaluation focuses on individual prompts rather than multi-turn injection chains that gradually manipulate context.
3. **Safety-only framing**: Prior work ignores availability attacks—cost inflation, latency degradation, and refusal spirals that degrade service without successful compromise.

Shibboleth addresses these gaps through:

- A **multilingual adversarial prompt dataset** with native coverage for 20+ languages and explicit augmentation suites for code-mixing and obfuscation.
- A **deterministic 7-stage pipeline** ensuring reproducibility and preventing train/test leakage.
- A **four-part evaluation partition** measuring both safety (attack detection) and availability (cost/latency) dimensions.
- **SEU tradeoff curves** visualizing security–utility–efficiency tradeoffs across policy layer configurations.

---

## 2. Threat Model

### 2.1 System Overview

We consider a system where a pre-LLM **Adversarial Prompt Classifier (APC)** filters user inputs before they reach the target LLM:

```
User → APC → Policy Layer → LLM → Tools (optional)
```

The APC outputs:
- `allow`: Pass through to policy layer
- `allow_with_sanitization`: Rewrite/transform before passing
- `require_step_up`: Trigger additional verification
- `block`: Refuse to process

The APC may operate in:
- **Stateless mode**: Turn-level classification
- **Stateful mode**: Conversation-level risk accumulation

### 2.2 Adversary Capabilities

The adversary possesses:
- Black-box access to the system
- Ability to issue repeated queries and adapt based on responses
- Capability to craft multilingual inputs and code-mixed prompts
- Access to Unicode obfuscation (homoglyphs, zero-width characters)
- Ability to attempt multi-turn gradual prompt injection
- Capacity for resource exhaustion attacks

The adversary does NOT have access to classifier weights or privileged system access.

### 2.3 Attack Objectives

We model two primary adversarial objectives:

**A. Under-Blocking (Safety Failure)**
- Goal: Cause adversarial prompts to pass through the APC
- Examples: Jailbreak attempts, instruction override, system prompt extraction, tool abuse, policy probing
- Metric: **Attack Pass-Through Rate (APTR)**

**B. Availability Degradation (Safety-DoS)**
- Goal: Degrade service usefulness without successful compromise
- Examples: Trigger repeated refusals, cause benign prompts to be blocked, inflate token usage, saturate risk scoring
- Metrics: **Benign Refusal Rate (BRR)** and **Token Burn Rate (TBR)**

### 2.4 Threat Classes

**Adversarial Input Classes:**
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

**Benign Input Classes:**
- Security research discussion
- Quoted adversarial text
- Prompt engineering conversations
- JSON / system-like formatting
- Multilingual benign content

---

## 3. Dataset Architecture

### 3.1 Schema Design

We adopt a three-table schema ensuring provenance and enabling leakage-proof splits:

**prompts.parquet:**
| Column | Type | Description |
|--------|------|-------------|
| `source_id` | string | Stable ID per canonical prompt |
| `intent_label` | enum | benign / adversarial |
| `attack_taxon` | string | Attack family (injection, jailbreak, etc.) |
| `canonical_text` | string | NFKC-normalized English pivot |
| `cluster_id` | int | Semantic cluster from embedding + HDBSCAN |
| `split` | enum | train / eval (cluster-disjoint) |

**variants.parquet:**
| Column | Type | Description |
|--------|------|-------------|
| `variant_id` | string | Unique per-language/transform variant |
| `source_id` | string | Foreign key to prompts |
| `language` | string | BCP-47 language code |
| `text` | string | The variant text |
| `variant_type` | enum | native / mt / backtrans / codemix / homoglyph |
| `transform_seed` | int | Deterministic transform seed |
| `quality_flags` | map | Back-translation similarity, etc. |

**sessions.jsonl (Phase 2):**
| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | Unique session identifier |
| `turns` | array | Turn-by-turn conversation |
| `seed` | int | Deterministic RNG seed |

### 3.2 Leakage Prevention: The Split Invariant

**Critical Rule**: Split at the `source_id` level BEFORE any translation or augmentation.

Translation-based cross-lingual evaluation can overestimate transfer performance. Our "split-first, translate-later" rule ensures:
- No semantic leakage across train/eval splits
- Variants always trace back to the same `source_id`
- Evaluations test true generalization, not data contamination

### 3.3 Dataset Gap Analysis

Current public multilingual adversarial datasets are **sparse outside English**:

| Language | Credible Datasets | Notes |
|----------|-------------------|-------|
| English | 10+ | Well-covered |
| Chinese | Moderate | via multilingual corpora |
| Japanese | Sparse | APTO-001, XSafety-JA portion |
| German | Sparse | GandalfIgnore (blog only, no release) |
| Spanish | Sparse | AyaRedTeaming portion |
| Russian | Sparse | AyaRedTeaming portion |
| Polish | **0** | Complete gap |
| Ukrainian | **0** | Complete gap |

**Key Finding**: Outside English, true adversarial datasets are scarce. Most "multilingual" claims rely on machine-translated templates without native adversarial strategies.

---

## 4. Pipeline: The Seven Passages

The Shibboleth pipeline implements seven deterministic stages:

```
Stage 0: FETCH      — Gather raw shapes from declared sources
Stage 1: CANONICALIZE — NFKC normalize, assign source_id
Stage 2: EMBED + CLUSTER — Sentence-transformers → HDBSCAN
Stage 3: SPLIT     — Cluster-level 70/15/15 train/eval/test
Stage 4: MT-TIER1  — 10 high-affinity languages
Stage 5: MT-TIER2  — 10 additional languages (gated)
Stage 6: EVAL-SUITES — Code-mix, homoglyph, exhaustion transforms
Stage 7: VERIFY    — Integrity checks (cluster-disjoint, etc.)
```

Each stage writes:
- Artifact file(s)
- `stage_manifest.json` (version, timestamps, seeds, checksums)
- `checksums.json`

The manifest chain ensures **provenance**: each stage's output hash becomes the next stage's input hash.

---

## 5. Evaluation Framework

### 5.1 Four Evaluation Partitions

**Partition A: Benign-but-High-Risk-Looking**
- Purpose: Measure over-blocking (false positives)
- Content: Security research discussions, quoted adversarial text, code-mixed benign inputs
- Primary Metric: **Benign Refusal Rate (BRR)**

**Partition B: Direct Adversarial Attempts**
- Purpose: Measure under-blocking (false negatives)
- Content: Jailbreak templates, injection attempts, system override prompts
- Primary Metric: **Attack Pass-Through Rate (APTR)**

**Partition C: Obfuscation and Evasion**
- Purpose: Measure robustness under input transformations
- Content: Homoglyph attacks, zero-width characters, mixed scripts, leetspeak
- Primary Metric: **Robust Attack Detection Rate (RADR)**

**Partition D: Resource Exhaustion / Safety Saturation**
- Purpose: Measure availability resilience
- Content: Repeated near-boundary prompts, refusal loops, conversational grinding
- Primary Metrics: **Token Burn Rate (TBR)**, **Latency overhead**, **Time-to-recovery**

### 5.2 SEU Tradeoff Curves

We visualize results as **Security–Utility–Efficiency (SEU) curves**:

- **Security** (Y-axis): Attack Pass-Through Rate (lower = better)
- **Utility** (X-axis): Benign Refusal Rate (lower = better)
- **Efficiency** (bubble size): Token burn / latency overhead

Pareto fronts identify optimal policy layer configurations for different operational constraints.

### 5.3 Evaluation Matrix

```
policy_layer × target_llm × language_suite × attack_suite × (prompt | session)
```

Where:
- `policy_layer`: P1 (block), P5 (system-risk), P7 (full-stack)
- `target_llm`: OpenAI, Vivgrid, Ollama, etc.
- `language_suite`: Native, MT-tier1, MT-tier2
- `attack_suite`: Direct, code-mix, homoglyph, exhaustion

---

## 6. Baseline Methods

We compare against three baselines:

**B0: Null Baseline**
- Always allow
- Purpose: Establish maximum compromise rate

**B1: Rule-Based Baseline**
- Unicode normalization
- Zero-width stripping
- Keyword / regex scoring
- Simple repetition detection

**B2: Linear Model Baseline**
- TF-IDF (word + character n-grams)
- Logistic regression

These baselines provide minimum acceptable performance thresholds.

---

## 7. Metrics Summary

### Turn-Level Metrics
- AUROC, PR-AUC
- FPR at fixed TPR, TPR at fixed FPR

### Safety Metrics
- Attack Pass-Through Rate (APTR)
- Robust Attack Detection Rate (RADR)

### Availability Metrics
- Benign Refusal Rate (BRR)
- Token Burn Rate (TBR)
- Latency p50/p95

### Stateful Metrics
- Risk decay rate
- Context contamination rate
- Time-to-recovery

---

## 8. Research Contributions

1. **Dual-Objective Framing**: Explicitly models adversarial prompting as both safety bypass AND availability/cost degradation attack.

2. **Leakage-Proof Dataset Architecture**: Cluster-level splits before translation prevent semantic leakage—a common pitfall in cross-lingual evaluation.

3. **Multilingual Gap Analysis**: Documents the severe scarcity of non-English adversarial datasets, identifying Polish and Ukrainian as complete gaps.

4. **SEU Evaluation Protocol**: Introduces tradeoff curves visualizing security–utility–efficiency across policy configurations.

5. **Deterministic Pipeline**: Seven-stage manifest-driven pipeline ensures reproducibility for paper replication.

---

## 9. Limitations and Future Work

- **Dataset coverage**: Non-English languages remain sparse; synthetic augmentation may introduce label noise.
- **Single-turn focus**: Phase 2 (multi-turn sessions) is planned but not yet implemented.
- **Provider variance**: API-level differences between OpenAI/Vivgrid/Ollama may confound comparisons.
- **Temporal drift**: LLM safety alignment evolves; benchmarks may lose relevance over time.

---

## References

*(To be populated with dataset citations, papers on adversarial prompting, cross-lingual evaluation, and guardrail systems)*

---

## Appendix: Key Datasets Identified

| Dataset | Size | Type | Notes |
|---------|------|------|-------|
| AiActivity/All-Prompt-Jailbreak | ~10K | English jailbreaks | Template-heavy |
| AyaRedTeaming | Multi-lingual | Red team | Includes non-English |
| WildJailbreak | ~4K | English jailbreaks | Strong negatives |
| XSafety | Multi-lingual | Safety | Not adversarial-specific |

---

*Status: Draft v0.1 — Subject to revision based on experimental results*

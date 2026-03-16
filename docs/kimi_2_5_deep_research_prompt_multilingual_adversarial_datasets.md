# Kimi 2.5 Deep Research Prompt

You are acting as a **security-focused ML research analyst** tasked with identifying the highest-quality datasets for training and evaluating a production-grade adversarial-prompt classifier.

This classifier will sit in front of LLM systems to detect:

- Prompt jailbreak attempts
- Prompt injection attacks
- Instruction override / system prompt extraction attempts
- Policy probing / guardrail mapping
- Tool abuse attempts
- Token / resource exhaustion attacks
- Code-mixed and multilingual adversarial prompts

Your goal is to find the most comprehensive, well-labeled, production-usable datasets for this purpose.

---

## Hard Requirements

### 1) Multilingual Coverage (MANDATORY)

This system must be robust against:

- Multilingual jailbreaks
- Cross-lingual injection attempts
- Code-mixed prompts (e.g., English + Japanese + Arabic in one string)
- Unicode / homoglyph obfuscation
- Script-mixing attacks

Prioritize datasets that:

- Include multiple languages (≥5 major languages preferred)
- Include language metadata
- Include code-mixed examples
- Are not merely machine-translated English jailbreak templates

If strong multilingual adversarial datasets do not exist, explicitly document this gap.

---

## Deliverables

Provide a structured report including:

### 1) Ranked Dataset Table (Top ~10)
For each dataset provide:

- Name
- Source link (Hugging Face / GitHub / paper)
- Size (# samples, turns, conversations)
- Label schema (binary / multi-class / structured tags)
- Annotation method (human, synthetic, adversarial, mixed)
- Class balance
- Languages covered
- Multi-turn support (yes/no)
- Benign lookalikes included (yes/no)
- License (commercial usability required)
- Last update / maintenance status
- Known weaknesses
- Train suitability score (0–10)
- Eval suitability score (0–10)

Be critical. Call out duplication, template inflation, label noise, and weak supervision.

---

### 2) Coverage Analysis

Analyze whether the datasets collectively cover:

- Jailbreak attacks
- Prompt injection
- Tool abuse
- Policy probing
- Token exhaustion attacks
- Cross-lingual evasion
- Code-mixing
- Homoglyph / Unicode obfuscation

If any category is poorly represented, state so explicitly.

---

### 3) Recommended Training Strategies

Propose:

- Minimal viable multilingual training stack
- Robust multilingual generalist stack
- Tool-aware / agent-context stack

Include suggestions for encoder backbones (e.g., XLM-R, multilingual DeBERTa, ModernBERT multilingual).

---

### 4) Evaluation Protocol

Design a cross-lingual robustness evaluation plan that tests:

- English → non-English generalization
- Non-English → English generalization
- Code-mixed attack detection
- False positive rates on benign multilingual prompts

---

### 5) Data Cleaning Plan

Include:

- Template deduplication strategy
- Cluster-based group splits to prevent leakage
- Language-stratified splits
- Balancing strategy
- Handling synthetic vs real examples

---

### 6) Licensing Constraints

Only include datasets that are clearly usable for production or commercial environments. Flag ambiguous licenses.

---

## Quality Bar

Do NOT include:

- Meme jailbreak template collections without strong negatives
- Datasets lacking explicit labeling documentation
- Pure synthetic corpora without validation
- Datasets with heavy duplication

If uncertain, say "unknown" and provide evidence reviewed.

Be exhaustive, technical, and critical.
No marketing summaries.
Focus on academic or lab-grade work.

---

## Starting Points (Expand Beyond These)

- AiActivity / All-Prompt-Jailbreak (HF)
- Any multilingual red-team corpora
- Prompt injection datasets tied to web agents
- LLM safety benchmarks with adversarial subsets

Search broadly across:

- arXiv
- ACL / EMNLP papers
- Hugging Face datasets
- Major AI lab red-team reports

Produce a structured, citation-backed report.

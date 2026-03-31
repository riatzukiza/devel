# Experimental Design

Planning and implementation discussions for the safety-evaluation framework.

## Contents

| File | Date | Description |
|------|------|-------------|
| `01-attack-taxonomy.md` | 2026-01-30 | Canonical attack taxonomy: jailbreak, prompt_injection, policy_probe, system_exfil, tool_abuse, obfuscation, cost_attack |
| `02-scaffolding-plan.md` | 2026-01-30 | Core invariants (split-at-source_id), policy layers P1/P5/P7, baselines, experimental matrix |
| `03-design-decisions.md` | 2026-01-30 | Design decisions with academic citations on leakage prevention |
| `04-dataset-plan.md` | 2026-01-30 | Language tier strategy (Tier 1: top 10, Tier 2: stress test), translation rules |
| `05-direction-statement.md` | 2026-01-31 | Research direction: safety-availability-cost framework, not just a classifier |
| `06-refined-objectives.md` | 2026-01-31 | Evaluation suite structure, baselines B0-B3, P1/P5/P7 policies |

## Framework Overview

**Dataset Products:**
- `prompts.parquet` — canonical prompt-level data
- `variants.parquet` — translations/augmentations  
- `sessions.jsonl` — multi-turn conversations

**Policy Layers:**
- P1: Hard block
- P5: System-risk injection
- P7: Full-stack mitigation

**Evaluation Suites:**
- Native corpora (real datasets)
- Machine translation variants
- Code-mixed robustness
- Homoglyph/Unicode obfuscation
- Cost/availability stress tests

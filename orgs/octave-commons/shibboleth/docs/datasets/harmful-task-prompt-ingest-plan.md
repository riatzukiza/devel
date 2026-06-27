---
title: "Harmful Task Prompt Ingest Plan"
description: "Concrete ingest plan for seeding Shibboleth's task prompt corpus from existing harmful-task datasets"
tags: ["shibboleth", "datasets", "harmful-tasks", "ingest-plan", "multilingual"]
created: 2026-03-18
status: draft
---

# Harmful Task Prompt Ingest Plan

## Goal
Turn the harmful-task shortlist into an actionable ingest plan for the new `task_prompts` dataset.

This plan distinguishes:
- **core adversarial task seeds**
- **specialized adversarial task seeds**
- **derived / augmentation-heavy sources**
- **benign / over-refusal complements**

The key rule is: **prefer direct illicit user requests over jailbreak wrappers**.

---

## 1) Proposed ingest buckets

### A. Core adversarial task seeds
These are the highest-priority sources for `task_prompts` with `intent_label=adversarial`.

| dataset | role | current evidence | rough size / access | license / gating | ingest verdict |
|---|---|---|---|---|---|
| HarmBench | direct harmful task seed | widely used harmful-behavior benchmark; official repo + HF mirror | HF mirror shows ~200 train rows in exposed config; full official corpus may be larger | HF mirror has no clear license tag surfaced in API output; verify repo terms | ingest first, but verify canonical source |
| HEx-PHI | direct harmful task seed | prohibited-use / harmful instruction benchmark | HF tags show `n<1K`; split by policy categories | gated, `license: other` (`hex-phi`) | ingest first if license permits |
| AdvBench | direct harmful task seed | canonical harmful behavior benchmark | HF mirror shows 520 train examples in exposed config | license not clearly surfaced in API output; verify canonical source | ingest first |
| MaliciousInstruct | direct harmful task seed | small harmful instruction dataset | HF API shows 100 examples | `cc-by-sa-4.0` | ingest early as category diversity booster |

### B. Specialized adversarial task seeds
Useful, but better as separate slices or later additions.

| dataset | role | current evidence | rough size / access | license / gating | ingest verdict |
|---|---|---|---|---|---|
| AgentHarm | agentic / tool-abuse harmful tasks | explicit harmful + benign + chat configs | HF API shows `<1K`, separate harmful and benign configs | `other` | ingest after core, especially for tool-abuse/session work |
| CySecBench | cyber misuse tasks | cyber-focused harmful prompt benchmark | paper reports 12,662 prompts | license unclear from current search; verify repo/paper | ingest as a dedicated cyber vertical |
| StrongREJECT | hard harmful benchmark prompts | 313 prompts, benchmark-oriented | small | provenance mixed; verify license path | keep as eval + hard-case seed |

### C. Derived / augmentation-heavy sources
Useful for analysis or extra coverage, but not ideal as the primary raw seed layer.

| dataset | why secondary |
|---|---|
| UltraSafety | derived/expanded from existing harmful instruction sources like AdvBench and MaliciousInstruct; good for scale, bad as first canonical seed because it compounds overlap and synthetic drift |
| SORRY-Bench | excellent refusal benchmark and multilingual mutation resource, but it is more of a refusal/eval framework than a clean base corpus of canonical harmful task asks |

### D. Benign / over-refusal complements
These are not adversarial task seeds, but they are highly relevant for constructing the matching benign side of `task_prompts` and for availability evaluation.

| dataset | role | rough size / access | license / gating | use |
|---|---|---|---|---|
| OR-Bench | benign-but-high-risk-looking / over-refusal benchmark | HF API shows configs up to `or-bench-80k` | `cc-by-4.0` | strong benign lookalike source |
| BELLS-O content-moderation-input | multilingual moderation input benchmark | 1K<n<10K; multilingual `en/fr/de/it` | gated/manual, `cc-by-nc-sa-4.0` | useful benign + moderation edge cases |
| XSTest | exaggerated safety / over-refusal benchmark | ~450 prompts (safe + unsafe contrasts) | `cc-by-4.0` | compact benign-risky-looking + refusal control set |
| WildGuardMix | prompt harm / response harm / refusal moderation dataset | 10K<n<100K; auto-gated | `odc-by` | useful judge-training / prompt-harm calibration source |

### E. Emerging / domain-specific adversarial extensions
These are promising but should be kept behind the canonical core until we confirm stability, coverage, and overlap.

| dataset | role | rough size / access | license / gating | use |
|---|---|---|---|---|
| SocialHarmBench | socially harmful request benchmark | `<1K`, open | `apache-2.0` | specialized social/political harmful-task slice |
| HarmMetric Eval | harmful prompt + response-judge benchmark | gated/unauthorized in quick probe | unknown from current probe | likely useful for judge benchmarking more than seed prompts |

---

## 2) Immediate recommended ingestion order

### Phase 1A — canonical adversarial task seed layer
1. HarmBench
2. HEx-PHI
3. AdvBench
4. MaliciousInstruct

### Phase 1B — benign complement layer
1. OR-Bench
2. BELLS-O content-moderation-input
3. XSTest
4. WildGuardMix

### Phase 1C — specialized adversarial extensions
1. AgentHarm
2. CySecBench
3. StrongREJECT
4. SocialHarmBench

### Hold for later / eval-first
- UltraSafety
- SORRY-Bench
- HarmMetric Eval

---

## 3) Suggested normalized schema mapping

### For adversarial task seeds
Map into `task_prompts.parquet` roughly as:

```clojure
{:task_id ...
 :source_id ...
 :intent_label "adversarial"
 :category ...
 :canonical_text ...
 :language "en"
 :split ...
 :dataset_origin ["<dataset>"]
 :quality_flags [...]}
```

### For benign complements
Map into the same `task_prompts.parquet` but with:

```clojure
:intent_label "benign"
```

Important: benign complements should be tagged so we can later distinguish:
- ordinary benign
- benign-but-risky-looking
- quoted/analytical
- moderation edge-case

---

## 4) Recommended new metadata fields
To support the dual-dataset design, add these fields during ingest:

```clojure
:seed_role               ;; task | context
:seed_kind               ;; direct-task | benchmark-hard-case | benign-lookalike | derived-augmentation
:source_license
:source_gated            ;; true | false
:source_split_name       ;; original source split/config
:wrapper_confidence      ;; high if direct task, low if likely jailbreak wrapper
:canonicalization_notes
```

---

## 5) Quality screen before admitting rows
Before any dataset becomes a canonical seed source, screen rows for:

1. **Direct illicit task vs wrapper**
   - Keep direct harmful asks in `task_prompts`
   - Move wrapper/injection/context material to `context_prompts`

2. **Prompt-only vs prompt+target**
   - Prefer prompt-only rows for seeds
   - If a dataset includes target answers, preserve metadata but do not treat targets as labels

3. **Duplication / overlap**
   - Expect overlap across HarmBench / AdvBench / HEx-PHI / MaliciousInstruct
   - cluster and dedupe before split

4. **Category coverage**
   - ensure illegal activity, malware, physical harm, fraud/deception, privacy, etc. are represented

5. **License / access compatibility**
   - do not assume gated or noncommercial sets are redistributable in derived artifacts

---

## 6) Concrete verdicts by dataset

### HarmBench
- Keep: yes
- Role: primary adversarial task seed
- Concern: HF mirror may be a subset, so verify official repo/data before treating size as authoritative

### HEx-PHI
- Keep: yes
- Role: primary adversarial task seed
- Concern: gated / custom license

### AdvBench
- Keep: yes
- Role: foundational adversarial task seed
- Concern: benchmark familiarity / overlap

### MaliciousInstruct
- Keep: yes
- Role: diversity booster
- Concern: small size

### AgentHarm
- Keep: yes, later phase
- Role: specialized tool/agent harmful tasks
- Concern: not broad enough for the base layer

### CySecBench
- Keep: yes, later phase
- Role: cyber vertical
- Concern: narrow domain

### StrongREJECT
- Keep: yes, but mostly eval-side
- Role: hard-case seed + benchmark
- Concern: small and benchmark-shaped

### SocialHarmBench
- Keep: yes, later phase
- Role: specialized socially harmful request vertical
- Concern: narrow domain and likely better as a separate category slice than part of the first canonical base

### UltraSafety
- Keep: maybe, but not as first-line canonical seed
- Role: augmentation-scale source
- Concern: derivative of other seeds

### SORRY-Bench
- Keep: yes, but eval/mutation-side first
- Role: multilingual refusal stress-testing and mutation templates
- Concern: not the cleanest canonical base seed set

### OR-Bench
- Keep: yes
- Role: benign complement / over-refusal control
- Concern: not adversarial seed data

### XSTest
- Keep: yes
- Role: compact benign complement / exaggerated-safety control set
- Concern: mostly eval/control, not a broad benign corpus by itself

### WildGuardMix
- Keep: yes
- Role: prompt-harm / refusal judge-training and calibration source
- Concern: moderation-label dataset rather than a clean canonical task-seed corpus; use carefully as complement, not base seed

### BELLS-O
- Keep: yes if license/gating acceptable
- Role: multilingual benign/moderation complement
- Concern: noncommercial + gated

---

## 7) Proposed next artifact
Create a machine-readable source manifest, e.g.:
- `data/manifests/task-prompt-seed-sources.edn`

with fields like:
- `:dataset`
- `:url`
- `:priority`
- `:role`
- `:license`
- `:gated?`
- `:expected_prompt_fields`
- `:expected_label_fields`
- `:wrapper_confidence`
- `:notes`

This should drive the first ingestion pass.

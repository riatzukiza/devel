# Parameter Golf × Shibboleth Sidecar Evaluation (Draft) — 2026-03-18

## Goal
Use Shibboleth's dataset generation and evaluation machinery as a **sidecar benchmark** for Parameter Golf models.

This does **not** replace the official Parameter Golf objective.

- **Primary competition objective:** FineWeb compression / `val_bpb` under the official 16MB + 10-minute rules.
- **Sidecar objective:** measure how tiny models behave on adversarial-vs-benign prompt discrimination and over-refusal/under-refusal slices.

## Core thesis
Parameter Golf tells us whether a tiny model compresses text well under harsh resource constraints.
Shibboleth can tell us whether that same model, or a tiny derivative/probe of it, behaves intelligently around adversarial and benign prompt boundaries.

Together, they create a more interesting artifact than either alone:
- compression / efficiency
- benchmark discipline
- safety / utility calibration

## Non-goals
- Changing the official Parameter Golf leaderboard metric.
- Pretending a sidecar safety score is part of the competition.
- Comparing raw base-LM completion behavior to instruction-tuned chat models without normalization.

## Existing local leverage
### Shibboleth already has
- deterministic dataset/split pipeline
- seed artifacts for **task prompts** and **context prompts**
- open-source benign and adversarial source ingestion
- over-refusal complements such as **XSTest** and **OR-Bench**
- evaluation concepts for refusal, harmful compliance, and overblocking
- model/adapter matrix design for comparing multiple targets

### Parameter Golf already has
- compact trainer / artifact discipline
- reproducible baseline configs
- a clean primary metric (`val_bpb`)

## Proposed experiment tracks

### Track A — Competition-clean
Train a Parameter Golf model exactly for the official objective.
Then evaluate it on a Shibboleth-derived suite **without altering the competition artifact**.

Use cases:
- “What does a tiny compression-optimized model know about adversarial-vs-benign boundaries?”
- “How bad is its false-positive / false-negative profile?”

### Track B — Sidecar-calibrated
Take the same backbone or a tiny derivative and add a small classifier/probe or post-train calibration step.
This is **not** the pure competition artifact, but it is scientifically useful.

Use cases:
- “How much safety-boundary signal can we recover with a tiny head?”
- “What is the tradeoff between `val_bpb`, size, and refusal precision?”

## Dataset plan

### 1. Build task prompts
Leverage `src/promptbench/corpus/task_seed.clj` to produce normalized `task_prompts.parquet`.

Candidate source mix:
- adversarial seeds: HarmBench, AdvBench, prompt injection sources, etc.
- benign / over-refusal complements: XSTest, OR-Bench

### 2. Build context prompts
Leverage `src/promptbench/corpus/context_seed.clj` for:
- benign system/developer prompts
- adversarial override / jailbreak / extraction contexts

### 3. Freeze splits
Use Shibboleth’s source-level split discipline:
- split at source/canonical prompt level before augmentation
- preserve cluster-disjoint train/dev/test where possible

### 4. Derived suites
Produce at least these evaluation suites:
- `direct-user`
- `system-context`
- `developer-context`
- benign near-boundary slice
- adversarial direct task slice
- multilingual / code-mix / homoglyph slice

## Model evaluation strategy

### Known chat/instruction models
Use Shibboleth’s normal adapter path:
- prompt the model with the eval case
- judge refusal / compliance / task success via configured judge policy

### Parameter Golf tiny models
These models are not naturally chat-aligned, so evaluate through a normalized classifier wrapper.

Two feasible wrappers:

#### Option 1 — Generative label scoring
Prompt format:
- fixed template asking for one label from a small set
- score candidate outputs via total log-probability of each label string

Example label set:
- `benign`
- `adversarial`
- `ambiguous`

This is the least invasive and keeps the model unchanged.

#### Option 2 — Tiny probe / classifier head
- extract hidden state(s) from the tiny LM
- train a tiny linear/MLP head on Shibboleth train split
- evaluate on held-out split

This is better for Track B than Track A.

## Metrics
Report two groups separately.

### A. Official Parameter Golf metrics
- `val_bpb`
- artifact bytes
- wallclock / hardware track

### B. Shibboleth sidecar metrics
For classification / calibration:
- accuracy / macro-F1
- AUROC / AUPRC if scored probabilistically
- confusion matrix over `benign | adversarial | ambiguous`

For policy-like model comparisons:
- overblocking / FPR on benign prompts
- harmful compliance / ASR on adversarial prompts
- slice metrics by language / placement / transform type

## Recommended comparisons
1. Parameter Golf naive baseline
2. Your improved Parameter Golf model(s)
3. Tiny sidecar-calibrated probe/head variants
4. Known reference chat models on the same Shibboleth suites
5. Simple lexical / embedding baselines for sanity

## Key visualizations
- `val_bpb` vs benign-FPR
- artifact size vs adversarial recall
- multilingual slice heatmaps
- placement-mode confusion matrices

## Risks
- Raw comparison against instruction-tuned chat models is unfair unless the interface is normalized.
- Tiny PG models may look terrible zero-shot; that is still useful evidence.
- Safety fine-tuning may hurt compression, so Track A and Track B must stay distinct.
- Tokenizer quirks may make label-string scoring noisy; whole-string logprob handling is required.

## Definition of done
- A reproducible Shibboleth-derived train/dev/test suite exists for sidecar eval.
- At least one Parameter Golf model is evaluated on it.
- At least one known reference model is evaluated on the same split.
- Results are reported as **official metric + sidecar metric**, not conflated.

## Strong next move
Implement Track A first:
- keep the competition artifact pure,
- build the Shibboleth sidecar eval set,
- and score the official baseline against a couple of known models.

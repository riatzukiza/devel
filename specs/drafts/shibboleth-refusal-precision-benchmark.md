# Shibboleth Refusal Precision Benchmark + Guard Model (Draft) — 2026-03-18

## Goal
Use Shibboleth to build and evaluate a system that is better at:
1. refusing genuinely adversarial prompts,
2. allowing benign prompts that merely look suspicious,
3. surfacing the tradeoff explicitly instead of hiding it behind anecdote.

This is aimed at the real product complaint:
- models that over-refuse benign prompts,
- especially around security research, quoted harmful text, system-like formatting, multilingual prompts, and boundary cases.

## Core idea
Shibboleth is already structured for this problem.
It has:
- `:benign`, `:adversarial`, and `:ambiguous` intent labels,
- explicit benign near-boundary classes,
- cluster-disjoint leakage-proof splits,
- multilingual / code-mix / obfuscation transforms,
- metrics for both under-blocking and over-blocking.

The right first target is **not** “train a base language model from scratch to be aligned.”
The right first target is a **small adversarial-prompt classifier / guard model** (APC) or policy head that sits before a target LLM.

## Problem statement
Current refusal systems often fail in two opposite directions:
- **under-refusal**: adversarial prompts pass through,
- **over-refusal**: benign prompts are blocked because they resemble harmful content.

The benchmark must treat both as first-class failures.

## Proposed outputs

### Dataset / suites
- Benign prompts
- Adversarial prompts
- Ambiguous / contested prompts
- Near-miss benign prompts, including:
  - quoted adversarial text
  - security research discussion
  - prompt engineering discussion
  - JSON / system-like formatting
  - multilingual benign content
- Placement variants:
  - direct user prompt
  - developer-context placement
  - system-context placement

### Metrics
- **APTR** — Attack Pass-Through Rate
- **BRR** — Benign Refusal Rate
- **TBR** — Token Burn Rate / refusal-loop overhead
- **SEU curves** — Security / Utility / Efficiency tradeoff
- Slice metrics by:
  - language
  - transform type
  - attack family
  - placement mode
  - prompt vs session evaluation

### Model candidates
Phase 1 candidates should be cheap and interpretable:
1. embedding model + linear classifier
2. small encoder classifier
3. distilled policy model / reranker
4. small adapter/LoRA guard on an open base model

## Non-goals
- Claiming a perfect universal refusal boundary
- Training a frontier base model from scratch in this phase
- Collapsing harmful-compliance judgment and refusal judgment into one label

## Design rules
1. **Decouple refusal from harmful compliance judgment**.
   - A prompt can contain harmful content and still be benign in intent (e.g. quotation, analysis, red-team discussion).
2. **Include ambiguous cases on purpose**.
   - Real systems fail at the boundary, not just on cartoonishly harmful prompts.
3. **Split before augmentation**.
   - Preserve leakage-proof source-level splits before MT/code-mix/homoglyph transforms.
4. **Measure over-refusal as a first-class regression**.
   - A “safer” model that blocks many benign prompts is not an unqualified improvement.
5. **Track availability failures**.
   - Refusal spirals and token burn matter, not just safety bypass.

## Why Shibboleth fits
Relevant existing Shibboleth structure already observed:
- intent labels: `:benign`, `:adversarial`, `:ambiguous`
- benign input classes in docs
- APTR / BRR / TBR framing in the threat model
- SEU tradeoff framing in research docs
- current design work toward dual datasets and decoupled refusal judgment

## Phases

### Phase 0 — Benchmark definition
- Freeze labels and outcome taxonomy.
- Separate:
  - benign allow
  - benign allow_with_sanitization
  - ambiguous require_step_up
  - adversarial block

### Phase 1 — Data assembly
- Gather adversarial seed sources.
- Gather benign near-boundary seed sources.
- Add ambiguous boundary examples.
- Add placement modes and multilingual transforms.

### Phase 2 — Baseline evaluation
- Run existing policy layers / target models.
- Produce APTR, BRR, TBR, and SEU baselines.
- Identify worst false-positive and false-negative slices.

### Phase 3 — Small guard model training
- Train first simple APC baseline.
- Compare against lexical and embedding-only baselines.
- Prefer interpretable failure analysis over chasing a single headline number.

### Phase 4 — Distillation / policy improvement
- Distill from stronger judges if helpful.
- Add calibration thresholds and step-up actions.
- Re-evaluate on the held-out split and transformed suites.

### Phase 5 — Artifact / hiring narrative
- Publish a compact report showing:
  - what over-refusal looks like,
  - what changed,
  - what improved,
  - what got worse,
  - and why the results are believable.

## Risks
- Synthetic adversarial data can teach shallow lexical shortcuts.
- Benign/adversarial boundaries are partly contextual and may need richer labels.
- A strong classifier can still degrade UX if thresholding is poorly calibrated.
- Multilingual transforms may create label drift if not quality-checked.

## Definition of done
- A reproducible benchmark exists for refusal precision.
- Over-refusal and under-refusal are both measured.
- At least one small guard-model baseline is trained and compared to simpler baselines.
- Results are explained with slice-level evidence, not just one aggregate score.

## Why this matters
This is closer to an actually painful user problem than abstract “safety benchmark” talk:
people complain when the model refuses harmless work.
A good benchmark here would let us improve the refusal boundary instead of guessing.

# Useful ideas from this workspace for Parameter Golf

This is the local “what do we already know how to do?” memo.

## 1. `orgs/octave-commons/shibboleth`
Files:
- `orgs/octave-commons/shibboleth/README.md`
- `specs/drafts/guardrail-promptbench-dsl.md`

Useful carryovers:
- deterministic seeds as a first-class concept
- manifests and reproducibility bundles
- verification checks instead of trusting narrative claims
- coverage thinking: know what was tested, not just what was trained

**How to use here:**
Adopt Shibboleth-style experimental hygiene for Parameter Golf runs:
- each run gets a config snapshot,
- each result gets a manifest,
- each comparison names what changed,
- each submission explains exact evidence.

## 2. `orgs/riatzukiza/ollama-benchmarks`
Files:
- `orgs/riatzukiza/ollama-benchmarks/README.md`

Useful carryovers:
- benchmark matrix mindset
- report generation in machine-readable + human-readable forms
- aggregation across many runs

**How to use here:**
Build a tiny experiment ledger for Parameter Golf sweeps:
- config → run id → metric → artifact size → notes
- emit JSONL + Markdown summaries

## 3. `orgs/octave-commons/mythloom`
Files:
- `orgs/octave-commons/mythloom/README.md`

Useful carryovers:
- explainable scoring over magical black-box scoring
- reproducible report output
- worker-side local analysis instead of hidden SaaS dependence

**How to use here:**
Keep the Parameter Golf workflow legible. A readable post-run report can be a differentiator when many people are just dumping logs.

## 4. `orgs/open-hax/proxx`
Files:
- `orgs/open-hax/proxx/README.md`

Useful carryovers:
- model-facing systems engineering
- observability and reasoning-trace preservation
- tooling to make experiments inspectable

**How to use here:**
Not directly a training artifact, but strong evidence that you can build infrastructure around model experimentation and debugging.

## 5. `receipts.log` / receipt-river discipline
Files:
- repo root `receipts.log`

Useful carryovers:
- append-only execution ledger
- explicit phase boundaries and verification notes
- durable context across sessions

**How to use here:**
A lightweight receipts/log format for Parameter Golf could track:
- run id
- code hash
- tokenizer/data variant
- architecture knobs
- train/eval times
- artifact size
- final `val_bpb`

## Bottom line
The strongest local advantage is not “we already have the winning tiny LM.”
It is that this workspace already contains strong patterns for:
- reproducibility,
- benchmark discipline,
- experiment reporting,
- and turning scattered work into a coherent narrative.

That is directly useful both for participating in Parameter Golf and for presenting yourself as someone OpenAI should take seriously.

# Resume ML Techniques Research — 2026-03-18

## Goal
Identify credible machine-learning techniques we can use to evaluate and improve resumes locally, explainably, and reproducibly.

## Recommended Stack

### 1. Parser ensemble
Use multiple parsers/extractors and preserve disagreement as signal.

Why:
- resume parsing is brittle
- parser disagreement often reveals layout fragility
- ensemble outputs help separate content issues from extractor issues

Current evidence in this workspace:
- `pyresume` catches footer contamination and some structure changes
- `sereena-parser` extracts contacts/skills but often misses experience segmentation
- `pdftotext` is cleaner than some Python extractors

### 2. Lexical scoring
Use keyword/section coverage and simple textual similarity as the first baseline.

Why:
- cheap, reproducible, interpretable
- still close to how many ATS filters behave
- useful even when embeddings are offline

### 3. Dense embedding similarity
Use local embeddings to compare resume content and job descriptions semantically.

Why:
- captures meaning beyond exact keyword overlap
- helps detect near-synonyms and related experience phrasing

Best local fit here:
- Ollama embeddings when available
- otherwise a deferred hook for sentence-transformers or another local embedding server

### 4. Hybrid retrieval / fusion
Combine lexical and dense retrieval rather than replacing one with the other.

Recommended fusion:
- reciprocal rank fusion (RRF) or weighted score fusion

Why:
- lexical search catches exact high-value terms
- dense search catches semantic similarity
- hybrid retrieval is a strong practical default in modern retrieval systems

### 5. Reranking / learning-to-rank
Treat this as a second-stage enhancement, not the starting point.

Useful forms:
- cross-encoder reranking
- pairwise or listwise learning-to-rank
- contrastive representation learning for resume/job pairs

Research signal:
- ConFit (2024) and ConFit v2 (2025) both treat resume-job matching as ranking and show gains from better representation learning and hard-negative mining

## What We Can Ship Now
1. parser ensemble
2. lexical scoring
3. hybrid-ready architecture
4. dense embedding hook
5. explainable JSON + Markdown reports

## What Is Not Yet Shipped
- local dense embeddings, because Ollama was unavailable during this pass
- cross-encoder reranking
- supervised learning-to-rank
- bias audits / fairness benchmarking

## Honest Resume-claimable Artifact
A truthful phrasing after this work:

- "Built a local resume-processing workbench that analyzes resume/JD fit using parser ensembles, lexical scoring, and hybrid-ranking architecture with explainable JSON/Markdown reports."

That is stronger and truer than claiming a full ML screening model before the dense/reranking layers exist.

## Sources Consulted
- ConFit (2024) and ConFit v2 (2025) on resume-job matching and ranking
- SentenceTransformers / cross-encoder reranking docs
- hybrid retrieval references (RRF, dense+sparse fusion)
- Ollama/local embeddings documentation

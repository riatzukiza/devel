# Resume Workbench

Local CLI for resume/job-description analysis.

## Current capabilities
- read resume PDFs via `pdftotext`
- read job descriptions from text/markdown
- compute lexical token coverage
- compute phrase coverage
- compute bag-of-words cosine similarity
- score ATS-standard section presence heuristically
- emit JSON + Markdown reports

## Planned extensions
- local embedding similarity (for example Ollama embeddings)
- hybrid dense+sparse fusion
- parser-ensemble ingestion
- reranking / LTR experiments

## Example

```bash
pnpm exec tsx src/resume-workbench/cli.ts \
  --resume resume/aaron-beavers-jorie-ai-v2-ats.pdf \
  --resume resume/aaron-beavers-ichi-costanoa-v1-ats.pdf \
  --job resume/analysis/tmp/jd-jorie-ai.txt \
  --job resume/analysis/tmp/jd-ichi-costanoa.txt \
  --slug resume-ml-workbench-sample
```

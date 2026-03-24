# Parameter Golf frontier crawl seeds — 2026-03-20

This seed set is designed to maximize **low-level raw signals** while still attaching a smaller number of **secondary synthesis pages** that can corroborate or contextualize those signals.

## Design principles
- Prefer raw JSON, raw markdown, patch diffs, submission manifests, and arXiv abstract pages.
- Treat blogs and garden pages as **secondary evidence**, not primary truth.
- Group seeds into motif clusters so the crawler graph can reveal co-occurrence patterns and bridge pages.
- Avoid generic GitHub navigation pages when a raw or patch URL exists.

## Cluster themes
1. quantization + sliding-window + MLP-heavy frontier
2. shared depth + recurrence + compression interfaces
3. eval-time compute + TTT + refinement loops
4. tokenizer/head co-design
5. codec / role-state moonshots
6. search-procedure / orchestration itself

## Primary raw-signal examples
- `parameter-golf.github.io/data/submissions.json`
- `patch-diff.githubusercontent.com/raw/openai/parameter-golf/pull/<n>.patch`
- raw `submission.json` files from top PRs
- arXiv abstract pages for core papers

## Secondary corroborating examples
- research garden frontier pages
- lane pages
- SkyPilot autoresearch blog
- graph/atlas/reports pages that reveal semantic organization or missing bridge concepts

## Current remote crawler target host
- `error@ussy3.promethean.rest`
- service: Fork Tales Web Graph Weaver on port `8793`

## Notes
The currently running remote crawler proved the service works, but generic GitHub HTML seeds create too much navigation noise. This curated seed file is intended to tighten the signal toward primary artifacts.

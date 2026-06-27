# Prefetch external datasets (HF/GitHub) for later multilingual translation + refusal-policy evaluation

Created: 2026-03-15
Status: draft

## Goal
Make it easy to **download and cache** all research-relevant adversarial prompt datasets *now*, so they are available later for:

1. measuring **language effects on prompt efficacy** (same prompt translated into many languages)
2. measuring how different **refusal policies** behave across languages and **code-mixed / script-mixed** variants

This is *not* a commercial project, so non-commercial datasets may be included **for research use** (but licenses must be recorded).

## Non-goals
- No MT/translation generation in this change (handled by existing transform stages).
- No embedding/clustering/splitting in this change.

## Requirements
1. Add a **fetch-only CLI command** (Stage 0 only) so we can prefetch without running Python-heavy stages.
2. Register additional external sources (beyond current `promptbench.corpus.external`) with deterministic filenames.
3. Support common dataset packaging needs:
   - TSV sources
   - compressed JSONL (`.jsonl.gz`, optional `.xz`)
   - Hugging Face “gated=auto” datasets via `HF_TOKEN` / Authorization header
4. Produce artifacts under `data/raw/` with deterministic names: `data/raw/<source>.<format>`.

## Candidate datasets to prefetch (initial set)
From docs notes / research report:
- CohereForAI/aya_redteaming (JSONL per language)
- AiActivity/All-Prompt-Jailbreak (at least the 800k CSV and/or key sub-corpora)
- allenai/wildjailbreak (TSV train/eval)
- ToxicityPrompts/XSafety (Parquet)
- Anthropic/hh-rlhf (red-team-attempts JSONL.GZ)
- PKU-Alignment/BeaverTails (30k JSONL.GZ train/test; optionally 330k JSONL.XZ)
- walledai/ForbiddenQuestions (Parquet)
- qualifire/Qualifire-prompt-injection-benchmark (CSV)
- sorry-bench/sorry-bench-202406 (CSV)

## Open questions
- “Pull **all** datasets” meaning:
  - A) all datasets referenced in our docs (recommended default)
  - B) *everything* inside AiActivity/All-Prompt-Jailbreak (very large; many sub-corpora)
- Whether we should include BeaverTails 330k (XZ) by default (size + additional dependency).

## Risks
- **Disk usage**: some sources are large (e.g., All-Prompt-Jailbreak 800k).
- **Gated datasets**: `gated=auto` may return 401/403 until the account accepts terms; requires `HF_TOKEN`.
- **Network**: timeouts and partial downloads.

## Plan
### Phase 1 — Fetch-only command + robust downloader
- Add `promptbench fetch --config <edn>` which runs pipeline `:fetch` stage only.
- Make Stage 0 HTTP download streaming (avoid `:byte-array` in memory).
- Add HF token support via request headers when `HF_TOKEN` or `HUGGINGFACE_TOKEN` is present.
- Add decompression for `.gz` (and optionally `.xz`).

### Phase 2 — Register additional sources + prefetch config
- Extend `promptbench.corpus.external/register-all!` (or a new registry namespace) to register all HF/GitHub sources.
- Add `pipelines/prefetch-all.edn` with the full `:sources` list.

### Phase 3 — Tests
- TSV parsing test (canonicalize reads TSV correctly).
- Gzip fetch+decompress test.
- Registry tests for new sources.

## Definition of done
- `promptbench fetch --config pipelines/prefetch-all.edn` downloads all listed sources into `data/raw/`.
- Fetch is idempotent: re-run does not re-download if manifest+files already match.
- Tests pass: `clj -M:test`.

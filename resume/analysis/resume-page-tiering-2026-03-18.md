# Resume Page Tiering Verification — 2026-03-18

## Goal
Allow richer 2-page resume variants **and** maintain explicit 1-page variants for submission pressure.

This report verifies the new explicit `-1p` tier is:
- actually 1 page
- text-extractable
- parser-sane (within the limits of the OSS parsers we’re using)

## New 1-page artifacts created
- `resume/aaron-beavers-ml-oss-1p.{md,tex,pdf}`
- `resume/aaron-beavers-devsecops-ai-1p.{md,tex,pdf}`

## Current page-count matrix (PDFs)
### Explicit compact 1-page tier
- `resume/aaron-beavers-ml-oss-1p.pdf` (1 page)
- `resume/aaron-beavers-devsecops-ai-1p.pdf` (1 page)

### Existing 1-page tier (already in repo)
- `resume/aaron-beavers-devsecops-ai.pdf` (1 page)
- `resume/aaron-beavers-devsecops-ai-ats.pdf` (1 page)
- `resume/aaron-beavers-ml-oss-ats.pdf` (1 page)
- `resume/aaron-beavers-ichi-costanoa-v1-ats.pdf` (1 page)
- `resume/aaron-beavers-jorie-ai-v2.pdf` (1 page)
- `resume/aaron-beavers-jorie-ai-v2-ats.pdf` (1 page)
- `resume/aaron-beavers-resume.pdf` (1 page)
- `resume/aaron-beavers-resume-ats.pdf` (1 page)

### Richer 2-page tier (allowed)
- `resume/aaron-beavers-ml-oss.pdf` (2 pages)
- `resume/aaron-beavers-ichi-costanoa-v1.pdf` (2 pages)

## Verification method (reproducible)
All machine-readable outputs were written under `resume/analysis/tmp/`:
- `page-tiering-1p-structure.json`
- `page-tiering-1p-pyresume.json`
- `page-tiering-1p-sereena.json`
- `page-tiering-1p-verification.json`

Toolchain:
- `pdfinfo` + `pdftotext -layout` (structural + extraction)
- `pyresume` (`ResumeParser().parse(path)`) from `tmp/resume-ats-audit-venv`
- `sereena-parser` CLI from `tmp/resume-ats-audit-venv`

Notes:
- `dsresumatch` was not used here because its section-detection remains structurally unreliable in our environment (it strips line breaks before regexing headings).

## Results summary
### Structural checks (`pdfinfo` / `pdftotext`)
Both new PDFs are:
- 1 page
- text-extractable
- contain headings `CONTACT`, `OPEN SOURCE EXPERIENCE`, `WORK EXPERIENCE`
- contain the string `Mythloom` (as intended)
- do **not** contain `fnord:` (compact tier is fnord-free)

### Parser checks
From `resume/analysis/tmp/page-tiering-1p-verification.json`:

#### `aaron-beavers-ml-oss-1p.pdf`
- `pyresume`:
  - email present: `foamy125@gmail.com`
  - phone present: `+1 515-388-0539`
  - sections_found: `summary, skills, experience, education`
  - education_count: 1
  - experience_count: **0** (known limitation: experience segmentation remains weak)
  - skills_count: 21
  - overall_confidence: 0.83
- `sereena-parser`:
  - parsed successfully
  - technical_score: 64
  - experience_count: **0** (same limitation)

#### `aaron-beavers-devsecops-ai-1p.pdf`
- `pyresume`:
  - email present: `foamy125@gmail.com`
  - phone present: `+1 515-388-0539`
  - sections_found: `summary, skills, experience, education`
  - education_count: 1
  - experience_count: **0**
  - skills_count: 24
  - overall_confidence: 0.83
- `sereena-parser`:
  - parsed successfully
  - technical_score: 60
  - experience_count: **0**

## Comparison vs ATS baselines
We compared `pyresume` outputs for the new `-1p` variants against their corresponding `-ats` PDFs:
- `ml-oss-1p.pdf` vs `ml-oss-ats.pdf`
- `devsecops-ai-1p.pdf` vs `devsecops-ai-ats.pdf`

Outcome: for `pyresume`, the compact `-1p` PDFs matched the `-ats` PDFs on:
- email
- phone
- education_count
- experience_count
- skills_count

So compacting and renaming did **not** introduce new parser regressions relative to the `-ats` baseline.

## Known limitations (unchanged)
- Experience segmentation is still weak across both `pyresume` and `sereena-parser` for these PDFs.
  - This appears to be a parser limitation + our compact single-page structure, not a new regression.

## What this buys us
We now have an explicit, submission-ready 1-page tier that:
- keeps Mythloom represented
- stays ATS-oriented and extractor-friendly
- avoids fnord contamination
- doesn’t worsen parser outcomes relative to the already-validated `-ats` PDFs

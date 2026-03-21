# Resume Parser Sweep — 2026-03-18

## Goal
Run a **full reproducible sweep** across all PDFs in `resume/` using:
- structural extraction (`pdfinfo`, `pdftotext -layout`)
- `pyresume` (lever-style regex parser)
- `sereena-parser`

…and record what they do (and do not) extract.

## Outputs (reproducible)
All raw outputs are saved under:
- `resume/analysis/tmp/sweep-2026-03-18/`
  - `structure.json`
  - `pyresume.json`
  - `sereena.json`
  - `summary.json`
  - `texts/*.txt` (pdftotext output per PDF)

## Files swept
Total PDFs: **16** (including 3 cover letters).

## Summary table (resumes only)
| file | pages | fnord | mythloom | pyresume exp | pyresume skills | pyresume edu | sereena exp | sereena tech |
|---|---:|:---:|:---:|---:|---:|---:|---:|---:|
| aaron-beavers-devsecops-ai-1p.pdf | 1 | N | Y | 0 | 24 | 1 | 0 | 60 |
| aaron-beavers-devsecops-ai-ats.pdf | 1 | N | Y | 0 | 24 | 1 | 0 | 60 |
| aaron-beavers-devsecops-ai.pdf | 1 | Y | Y | 1 | 24 | 2 | 0 | 60 |
| aaron-beavers-ichi-costanoa-v1-1p.pdf | 1 | N | Y | 0 | 29 | 1 | 0 | 42 |
| aaron-beavers-ichi-costanoa-v1-ats.pdf | 1 | N | Y | 0 | 27 | 1 | 0 | 42 |
| aaron-beavers-ichi-costanoa-v1.pdf | 2 | Y | Y | 1 | 24 | 3 | 1 | 48 |
| aaron-beavers-jorie-ai-v2-ats.pdf | 1 | N | N | 1 | 17 | 1 | 0 | 38 |
| aaron-beavers-jorie-ai-v2.pdf | 1 | Y | N | 1 | 16 | 2 | 0 | 44 |
| aaron-beavers-ml-oss-1p.pdf | 1 | N | Y | 0 | 21 | 1 | 0 | 64 |
| aaron-beavers-ml-oss-ats.pdf | 1 | N | Y | 0 | 21 | 1 | 0 | 64 |
| aaron-beavers-ml-oss.pdf | 2 | Y | Y | 1 | 22 | 2 | 0 | 64 |
| aaron-beavers-resume-ats.pdf | 1 | N | N | 0 | 6 | 1 | 0 | 48 |
| aaron-beavers-resume.pdf | 1 | Y | N | 1 | 6 | 2 | 0 | 48 |

Legend:
- `fnord`: whether `pdftotext` output contains `fnord:`
- `mythloom`: whether `pdftotext` output contains `Mythloom`
- `pyresume exp`: number of extracted experience entries (not necessarily correct)
- `sereena exp`: number of extracted experience entries (not necessarily correct)

## Aggregates (resumes only)
From `summary.json` + the additional Ichi 1-page companion verification:
- resumes swept: **13**
- 1-page resumes: **11**
- 2-page resumes: **2**
- fnord present in resumes: **5**
- mythloom present in resumes: **9**

Experience segmentation (coarse):
- `pyresume` experience_count > 0 for: 
  - `aaron-beavers-devsecops-ai.pdf`
  - `aaron-beavers-ichi-costanoa-v1.pdf`
  - `aaron-beavers-jorie-ai-v2-ats.pdf`
  - `aaron-beavers-jorie-ai-v2.pdf`
  - `aaron-beavers-ml-oss.pdf`
  - `aaron-beavers-resume.pdf`
- `sereena-parser` experience_count > 0 for:
  - `aaron-beavers-ichi-costanoa-v1.pdf`

## Interpretations (limited)
1. The **ATS-clean + compact tiers are doing what we want structurally**: fnord is absent from `-ats` and `-1p` PDFs.
2. Mythloom is consistently visible in the targeted variants (ML/OSS, DevSecOps, Ichi), and absent where not included (Jorie v2, baseline resume).
3. Both parsers still struggle with reliable experience segmentation on these compact single-column PDFs; this appears to be a parser limitation rather than a new regression.

## Tool notes
- `dsresumatch` section detection was not included in this sweep because its `read_pdf()` routine removes newlines before section regex checks, producing structurally unreliable “missing section” results in our environment.

## Next steps
1. If we want to improve experience segmentation for the parsers, we can try one controlled formatting experiment on **one** ATS PDF (e.g., ensuring each job entry begins with an unbroken `Company — Title` line + date range on same line) and rerun the sweep for that file only.
2. (Done) Added an explicit `aaron-beavers-ichi-costanoa-v1-1p.*` compact companion and verified it with `pyresume` + `sereena-parser`.
3. (Done) Compiled and swept the two markdown-only cover letters into TeX/PDF and included them in the sweep artifacts.

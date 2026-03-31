# resume-apply

Worker-side job application helper.

You still apply by hand.

This CLI automates:
- source capture (job posting + optional company pages)
- requirement/keyword extraction
- selecting a base resume variant (or using one you specify)
- producing a draft cover letter + a “quiz” file for truth-binding
- verification outputs (pdfinfo/pdftotext + pyresume + sereena-parser + local lexical scoring)
- receipts (both per-bundle and appended to repo `receipts.log`)

## Usage

```bash
pnpm resume:apply -- \
  --company "Costanoa / Ichi" \
  --role "Staff/Senior Full-Stack" \
  --job-url "https://..." \
  --company-url "https://..."
```

Optional:

```bash
pnpm resume:apply -- \
  --company "Acme" \
  --role "DevSecOps Engineer" \
  --job-file /path/to/jd.txt \
  --resume resume/aaron-beavers-devsecops-ai-1p.pdf
```

## Output bundle

Creates:

`resume/applications/<yyyy-mm-dd>/<company-slug>/<role-slug>/`

With subdirectories:
- `sources/`   (raw + normalized sources)
- `extracted/` (requirements + keywords)
- `synthesis/` (base resume copies + draft cover letter + quiz prompts)
- `verification/` (parser + workbench outputs)

## Truth-binding policy

- The tool never invents resume claims.
- If the job requires something that is not found in the selected resume text,
  it produces `synthesis/QUIZ.md` with targeted questions instead of adding claims.

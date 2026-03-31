# Job Application Research + Synthesis Process (Draft) — 2026-03-18

## Goal
Formalize a reproducible, evidence-backed process to:
1) research a company/job
2) collect data locally (worker-side)
3) synthesize resume + cover letter variants
4) preserve strict truthfulness constraints
5) emit receipts and artifacts for every run

This process explicitly assumes:
- you apply to jobs by hand
- automation is for data collection + drafting + evidence linkage

## Non-negotiables
- Nothing on a resume is invented.
- Every claim must be grounded in either:
  - existing repo evidence (links, commits, READMEs, manifests, test runs), or
  - facts you explicitly confirm in-session.
- If evidence is missing or ambiguous: ask targeted questions (“quiz mode”).
- Government work: treat as NDA-grade; do not elicit classified/controlled details; use high-level role framing only.

## Inputs
- Job posting URL (or pasted text)
- Company website
- Optional recruiter email thread
- Your existing resume variants in `resume/`
- Existing artifacts:
  - `resume/analysis/resume-parser-sweep-2026-03-18.md`
  - `resume/analysis/resume-ml-workbench-2026-03-18.md`
  - Mythloom outputs under `orgs/octave-commons/mythloom/analysis/`

## Outputs (per application)
Create an application bundle under:
- `resume/applications/<yyyy-mm-dd>/<company>/<role>/`

Suggested files:
- `sources/`
  - `job-posting.html` or `job-posting.md`
  - `company-about.html`
  - `notes.md` (manual notes)
- `extracted/`
  - `requirements.json` (normalized requirements)
  - `keywords.json`
  - `redflags.json` (e.g., suspicious claims, missing salary, role mismatch)
- `synthesis/`
  - `resume-selected.txt` (which base resume variant chosen)
  - `resume-targeted.md` / `.tex` / `.pdf`
  - `cover-letter.md` / `.tex` / `.pdf`
- `verification/`
  - `pdf-structure.json` (`pdfinfo` + `pdftotext`)
  - `parser-pyresume.json`
  - `parser-sereena.json`
  - `workbench-scores.json` (if using resume-workbench/Mythloom)
- `RECEIPTS.md` (human-readable receipt summary)

Also append receipts in repo root `receipts.log`.

## Phases

### Phase 0 — Safety + truth boundary setup
- Declare what is in-bounds:
  - role title, employer type, high-level responsibilities
- Declare what is out-of-bounds:
  - sensitive government details, classified information, customer identities

### Phase 1 — Collect sources (evidence-first)
- Fetch and store:
  - job posting text
  - company about/values page
  - relevant engineering blog posts
  - public product docs (if any)
- Record URLs + timestamps.

### Phase 2 — Normalize requirements
- Extract into a structured schema:
  - must-have skills
  - nice-to-have skills
  - responsibilities
  - seniority signals
  - location/remote constraints
  - security clearance requirements

### Phase 3 — Choose base resume variant(s)
Rules:
- Prefer existing variants (`-1p`, `-ats`, role-targeted) over creating new from scratch.
- If the job expects ATS import: choose `-ats` or `-1p` as base.
- If recruiter expects narrative: choose richer 2p as base.

### Phase 4 — Synthesize targeted drafts
- Only adjust:
  - ordering
  - emphasis
  - verified metrics
  - section naming
- Do not add new projects/claims without evidence.

### Phase 5 — Quiz mode (if needed)
Trigger when:
- a JD requirement seems to match your past work but is not in repo evidence.

Protocol:
- Ask 3–7 very specific questions.
- Record answers as “user-confirmed facts” in the application bundle notes.
- Never ask for sensitive details; ask for safe abstractions.

### Phase 6 — Verification
- Compile PDFs.
- Run:
  - `pdfinfo` page count
  - `pdftotext -layout` check for headings + contact
  - `pyresume` + `sereena-parser`
  - optional: `pnpm resume:workbench` or Mythloom for keyword/phrase coverage

### Phase 7 — Finalize bundle
- Ensure:
  - filenames are deterministic
  - receipts are appended
  - sources are stored
  - verification outputs exist

## Definition of Done
- A human can reproduce the bundle from stored sources + commands.
- Resume/cover letter artifacts are truthful and evidence-linked.
- Verification outputs exist and show no obvious extraction regressions.

## Next questions
- Do you want a canonical naming convention for per-company bundles?
- Do you want a single CLI entrypoint (e.g. `pnpm resume:apply -- --job <url>`), or keep it as documented steps + scripts?

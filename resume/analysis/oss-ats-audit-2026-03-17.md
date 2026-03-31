# OSS ATS / Resume Audit — 2026-03-17

## Scope
Audited the current PDF resume set in `resume/` using a broad practical set of open-source ATS / parsing / optimization tools.

Audited PDFs:
- `resume/aaron-beavers-resume.pdf`
- `resume/aaron-beavers-jorie-ai-v2.pdf`
- `resume/aaron-beavers-ichi-costanoa-v1.pdf`
- `resume/aaron-beavers-devsecops-ai.pdf`
- `resume/aaron-beavers-ml-oss.pdf`

Out of scope for scoring: cover letters.

---

## Axes (sharpened)
This audit is organized around 5 axes:
1. **Structural ATS compatibility** — is the PDF parseable and one-page, with recognizable sections?
2. **Parser interoperability** — do multiple OSS parsers agree on the same structure?
3. **Targeted JD alignment** — for targeted resumes, do open-source matchers see the right job terms?
4. **Footer contamination** — does the `fnord:v1` footer help, hurt, or confuse parsers?
5. **Metadata readiness** — do the PDFs expose structured ATS metadata (RMS/XMP)?

---

## Tool Inventory

### Runnable / used
1. **Poppler `pdftotext` + `pdfinfo`**
   - Purpose: baseline text extraction, page count, section presence
   - Result: fully runnable

2. **`sereena-parser` (PyPI)**
   - Purpose: resume parsing / completeness / technical scoring
   - Result: runnable

3. **`pyresume` / `leverparser` (PyPI / GitHub)**
   - Purpose: ATS-style resume parsing, Lever-compatible heuristics
   - Result: runnable

4. **`dsresumatch` (PyPI)**
   - Purpose: keyword + section ATS-style scoring
   - Result: runnable
   - Note: baseline is data-science biased; targeted keyword mode is more useful

5. **`CV-Matcher` (GitHub)**
   - Purpose: resume/job description parsing and keyword extraction
   - Result: **partially runnable**
   - Parsing / keyword extraction works locally after dependency fixes
   - Similarity module requires Cohere + Qdrant config, so not used for numeric similarity

6. **`resume-standard` / RMS parser (GitHub)**
   - Purpose: detect structured resume metadata embedded in PDF XMP
   - Result: runnable

7. **`paramchoudhary/resumeskills` (GitHub)**
   - Purpose: OSS optimization guidance
   - Reviewed skills:
     - `resume-ats-optimizer`
     - `resume-formatter`
     - `resume-quantifier`
     - `tech-resume-optimizer`
     - `resume-version-manager`

### Installed / reviewed but not practically runnable in this audit
1. **`resume-parser` (PyPI)**
   - Install succeeded
   - Import failed due missing packaged spaCy model config (`degree/model/config.cfg`)
   - Verdict: broken package in this environment

2. **`cvinsight` (PyPI)**
   - Install succeeded
   - CLI import failed (`langchain.prompts` mismatch)
   - Also appears Gemini-dependent
   - Verdict: broken / cloud-bound

### Discovered but not executed
Many ATS scanners/builders discovered via GitHub/web search were Streamlit/web-app demos or required proprietary APIs/keys. They are worth surveying, but not trustworthy as headless local batch tools without more time:
- `ai-powered-resume-analyzer`
- `Smart-Resume-Analyzer`
- `ResumeAtsChecker`
- `atsresume`
- `Reactive-Resume`

---

## High-level Findings

### 1) Structural ATS compatibility: baseline is decent
**Good news:**
- All 5 audited PDFs are **1 page**.
- All 5 are **text-based PDFs**.
- `pdftotext` extracts clean text from all 5.
- All 5 expose obvious headers such as `SUMMARY`, `SKILLS`, `EXPERIENCE`, `EDUCATION`.

Baseline structure snapshot:
- Page count: all 5 = 1
- `pdftotext` extraction: clean
- `(cid:...)` artifacts: **not present** in Poppler output

### 2) Parser interoperability: weak on experience segmentation
Multiple OSS parsers disagree with the resumes’ structure in the same places.

#### Cross-tool pattern
- `sereena-parser` extracts contact info and skills reliably, but often fails to segment work history cleanly.
- `pyresume/leverparser` normalizes contact info well, but misclassifies nonstandard or compact sections.
- `dsresumatch` is extremely literal about headings and section naming.

#### Strong signal
The fact that **multiple parsers** struggle with **experience extraction** suggests the resumes are *human-readable but machine-fragile* in the experience/open-source area.

Likely causes:
- compact one-page layout with dense lines
- em dashes / compact separators in title/company/date lines
- open-source work presented outside a standard `Professional Experience` section
- bullet glyphs and PDF text extraction differences across libraries

### 3) Footer contamination: fnord has a measurable parser cost
I generated temporary **ATS-clean shadow PDFs** (analysis only; not replacing your real files) by stripping the fnord footer and re-running parsers.

#### Result
The `fnord:v1` footer **does not materially improve keyword overlap** in targeted matching, but **does contaminate at least one real parser**.

#### Concrete evidence (`pyresume/leverparser`)
For **every audited resume**, the original fnord-bearing PDF leaked the footer into structured fields:
- extra `education` entry
- extra `certification` entry
- explicit `fnord:v1` contamination in parsed structure

After removing the footer in ATS shadow PDFs:
- false `education` entry disappeared
- false `certification` entry disappeared
- keyword overlap stayed effectively unchanged for targeted resumes

#### Example comparison
`aaron-beavers-ml-oss.pdf`
- Original: `education_count=2`, `cert_count=11`, fnord leaked into both
- ATS shadow: `education_count=1`, `cert_count=10`, fnord leakage gone

`aaron-beavers-ichi-costanoa-v1.pdf`
- Original: `education_count=2`, `cert_count=11`, fnord leakage present
- ATS shadow: `education_count=1`, `cert_count=10`, fnord leakage gone

**Interpretation:**
- fnord is fine as an AI-signal footer
- fnord is **not ATS-clean**
- your instinct to maintain separate ATS and fnord variants is correct

### 4) PDF extractor behavior: Poppler good, pdfplumber noisy
Extractor comparison on all 5 resumes:
- `pdftotext` (Poppler): clean, no `(cid:...)`
- `pypdf`: mostly clean
- `pdfplumber`: emits `(cid:136)` bullet artifacts on all 5 resumes

This matters because some downstream parsers are built on `pdfplumber`-style extraction.

**Implication:** the current bullet/output style is compatible with some extractors, but not all.

### 5) Metadata readiness: none
The `resume-standard` RMS parser found **no XMP/RMS metadata** in any current PDF.

Result for all 5:
```json
{ "status": "empty" }
```

This is not a bug — it just means your current PDFs are standard text PDFs, not metadata-enriched ATS documents.

---

## Per-resume Findings

### `aaron-beavers-resume.pdf`
**Best use:** conservative ATS baseline / classic automation resume

**Strengths**
- structurally simplest
- focused role identity
- one page, clean extract

**Weaknesses**
- parser interoperability still weak on experience segmentation
- fnord footer contaminates `pyresume`
- no OSS section, so weaker for AI/LLM/platform roles

**Recommendation**
- keep as ATS-clean baseline for classic automation/RPA submissions
- remove fnord in ATS version
- rename `EXPERIENCE` to `PROFESSIONAL EXPERIENCE`
- consider replacing glyph bullets with plain `-`

### `aaron-beavers-jorie-ai-v2.pdf`
**Best use:** Jorie / Python RPA / Selenium / OCR

**Open-source targeted matching**
- `dsresumatch` targeted score: **63.16**
- `CV-Matcher` targeted overlap sample: `automation, browser, ocr, python, reliability, rpa, selenium, vision, workflows`

**Strengths**
- strong alignment on Python / automation / OCR / Selenium
- recent OSS work expands post-2023 story

**Weaknesses / true JD gaps**
These are absent or weak relative to the Jorie recruiter text:
- `OpenCV`
- `RCM`
- `EHR`
- `claims portals`

Those should only be added if truthful.

**Recommendation**
- best targeted resume for Jorie so far
- ATS-clean version should remove fnord and probably relabel `RECENT WORK` as `OPEN SOURCE EXPERIENCE` or integrate it under `PROFESSIONAL EXPERIENCE`

### `aaron-beavers-ichi-costanoa-v1.pdf`
**Best use:** Ichi / React + Rails + LLM integration

**Open-source targeted matching**
- `dsresumatch` targeted score: **57.89**
- `CV-Matcher` targeted overlap sample: `ai, engineer, full, llm, postgres, product, rails, react, ruby, senior, software, stack, typescript`

**Strengths**
- strongest explicit React/Rails/full-stack framing
- direct multi-provider LLM integration story
- good architecture/product-language overlap

**Weaknesses / likely missing target terms**
- `GraphQL` (not present)
- `AWS` (not present explicitly)
- `construction` / `code compliance` domain terms are not present
- `startup experience` is implied but not foregrounded explicitly

**Recommendation**
- best targeted resume for Ichi so far
- if truthful, add startup/0→1 language and more product-lifecycle language
- ATS-clean version should remove fnord

### `aaron-beavers-devsecops-ai.pdf`
**Best use:** AI platform / infra / DevSecOps roles

**Strengths**
- strongest security/reliability keyword density
- good Open Hax / Battlebussy / Terraform / Docker story
- `sereena` technical score highest among non-ML variant set except ML-OSS

**Weaknesses**
- OSS section not parsed as experience by literal tools
- experience extraction weak in both `sereena` and `pyresume`
- fnord contamination present in original

**Recommendation**
- ATS-clean version should fold OSS items into `PROFESSIONAL EXPERIENCE` or `OPEN SOURCE EXPERIENCE`
- likely strongest basis for senior platform/infra targeting

### `aaron-beavers-ml-oss.pdf`
**Best use:** research/platform/ML infra/open-source roles

**Strengths**
- highest `sereena` technical score in the audited set (**64**)
- best keyword density for ML/LLM/data pipeline roles
- Shibboleth + Open Hax + Battlebussy gives real signal

**Weaknesses**
- same parser fragility around experience segmentation
- fnord contamination in original
- `Open Source` header may not be treated as experience by simplistic ATS tools

**Recommendation**
- strong story for ML/LLM infra roles
- ATS-clean version should remove fnord and consider renaming/folding OSS into an ATS-recognized section

---

## Guidance applied from OSS optimization skills

### From `resume-ats-optimizer`
Relevant recommendations that apply directly:
- avoid headers/footers for important info
- use standard section headers
- avoid special characters that break parsers

**Applied conclusion:**
- the fnord footer belongs only in AI-signal variants
- `Open Source` / `Recent Work` should be ATS-normalized
- compact PDF glyph bullets are a risk

### From `resume-formatter`
Relevant recommendations:
- single-column good
- standard fonts good
- section order should be conventional
- `Professional Experience` is more ATS-recognizable than plain `Experience`

**Applied conclusion:**
- layout is already good
- naming and line formatting are the bigger issues

### From `resume-quantifier`
Biggest missed opportunity across the current resumes:
- more concrete numbers in OSS bullets and Raft bullets

**Already available numbers you can truthfully use:**
- **3 providers** in Open Hax proxy routing (OpenAI / Anthropic / Ollama)
- **7-stage** pipeline in Shibboleth (from README)
- **2 architectures** in Battlebussy multi-arch builds (ARM64 + AMD64)
- **5-stage** Raft file pipeline (`parse -> validate -> summarize -> report -> notify`)
- **429** rate-limit rotation behavior in Open Hax proxy

### From `tech-resume-optimizer`
Relevant recommendations:
- show scale + systems + architecture boundaries
- include GitHub / portfolio
- make technical bullets concrete and achievement-oriented

**Applied conclusion:**
- current targeted resumes are directionally right
- strongest future improvement is quantified technical bullets, not more adjectives

### From `resume-version-manager`
Relevant recommendations:
- maintain a master source of truth
- track tailored variants systematically

**Applied conclusion:**
- your new `resume-fnord-ats` skill is the right model
- you should produce **paired variants** for serious use:
  - `<base>-ats.*`
  - `<base>-fnord.*`

---

## Ranked Recommendations

### Priority 0 — keep both worlds separate
1. **Do not submit fnord PDFs through ATS portals.**
2. Generate paired outputs:
   - ATS-clean: no fnord footer
   - fnord: footer retained for AI-first contexts

### Priority 1 — improve parser interoperability
3. Rename sections to standard ATS labels:
   - `SUMMARY` -> `PROFESSIONAL SUMMARY`
   - `EXPERIENCE` -> `PROFESSIONAL EXPERIENCE`
   - `OPEN SOURCE` -> `OPEN SOURCE EXPERIENCE` or `PROJECTS`
4. Consider moving OSS work under `PROFESSIONAL EXPERIENCE` for ATS versions.
5. Replace the PDF bullet glyph style with plain `-` or the most extractor-safe bullet you can tolerate.

### Priority 2 — add quantification
6. Add concrete numbers where already verified:
   - 3 providers
   - 7-stage pipeline
   - 2-arch build/deploy
   - 5-stage file pipeline
   - 429 rotation

### Priority 3 — trim optional noise in ATS-clean variants
7. Consider dropping `Upwork:` from ATS-clean versions.
8. Keep contact block minimal and body-only (already mostly good).

### Priority 4 — future-proof machine readability
9. If you want true machine-first parsing, explore **Resume Metadata Standard (RMS)** generation for ATS-clean exports. Right now your PDFs have no structured metadata.

---

## Optimization Pass Applied After Audit

Following the audit, ATS-clean variants were created for the current resume set:

- `resume/aaron-beavers-resume-ats.pdf`
- `resume/aaron-beavers-jorie-ai-v2-ats.pdf`
- `resume/aaron-beavers-ichi-costanoa-v1-ats.pdf`
- `resume/aaron-beavers-devsecops-ai-ats.pdf`
- `resume/aaron-beavers-ml-oss-ats.pdf`

### Applied changes
- removed the `fnord:v1` footer from ATS variants
- removed Upwork line from ATS variants
- normalized ATS structure so all variants remain one-page and text-based
- changed the original ATS baseline (`aaron-beavers-resume-ats.tex`) to plain hyphen bullets, removing the last `pdfplumber` `(cid:...)` holdout

### Material improvements verified
1. **Fnord contamination removed**
   - `pyresume/leverparser` no longer leaks fnord into education/certification fields on the ATS variants.

2. **Extractor interoperability improved**
   - final ATS PDFs now show:
     - `pdftotext_has_cid = false` for all 5
     - `pypdf_has_cid = false` for all 5
     - `pdfplumber_has_cid = false` for all 5

3. **Page count preserved**
   - all 5 ATS variants remain **1 page**.

### Remaining limitations
- OSS parsers still disagree on experience segmentation for some compact one-page variants.
- ATS-clean variants reduce parser noise, but they do not magically make simplistic parsers smart.
- RMS/XMP metadata is still absent.

---

## Bottom Line

### If the goal is “best chance through a normal ATS”
Use **ATS-clean** variants with:
- no fnord footer
- ATS-normalized section names
- open-source work folded into recognized experience/projects sections
- simpler bullets

### If the goal is “signal to AI-first reviewers / founders / direct email”
Use the **fnord** variants.
The footer does not appear to help targeted keyword overlap much, but it does act as an intelligible machine-readable appendix.

### If the goal is “single best current resume”
- **Jorie-specific funnel:** `aaron-beavers-jorie-ai-v2.pdf`
- **Ichi-specific funnel:** `aaron-beavers-ichi-costanoa-v1.pdf`
- **Infra/platform:** `aaron-beavers-devsecops-ai.pdf`
- **Research/ML/OSS:** `aaron-beavers-ml-oss.pdf`
- **Conservative ATS baseline:** `aaron-beavers-resume.pdf`

---

## Artifacts produced
Temporary analysis artifacts:
- `resume/analysis/tmp/sereena-all.json`
- `resume/analysis/tmp/pyresume-all.json`
- `resume/analysis/tmp/dsresumatch-results.json`
- `resume/analysis/tmp/cv-matcher-targeted.json`
- `resume/analysis/tmp/resume-standard-results.json`
- `resume/analysis/tmp/pdf-structure.json`
- `resume/analysis/tmp/pdf-extractor-comparison.json`
- `resume/analysis/tmp/parser-footer-comparison.json`
- `resume/analysis/tmp/ats-shadow/*.pdf` (analysis-only ATS shadow copies)

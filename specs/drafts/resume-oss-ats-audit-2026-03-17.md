# Resume OSS ATS Audit Draft

## Goal
Run a broad, reproducible audit of current resume artifacts in `resume/` using open-source ATS/resume evaluation/optimization tools and produce a report.

## Scope
- Inventory current resume variants in `resume/`
- Run practical open-source parsers/analyzers/matchers
- Review open-source resume optimization guidance/skills
- Summarize findings per resume
- Distinguish structural ATS findings from JD-specific matching findings

## Candidate Tool Classes
- Text extraction / parseability: `pdftotext`, `pdfinfo`, open-source resume parsers
- Resume parsing: `resume-parser`, `sereena-parser`, `cvinsight`, `pyresume` (if runnable)
- ATS/JD match: `CV-Matcher`, `dsresumatch`, other runnable OSS tools
- Resume optimization guidance: `paramchoudhary/resumeskills` skill set and similar OSS artifacts

## Risks
- Some tools may require cloud API keys or external models
- Some repos may be demos or partially broken
- JD-specific matchers require representative job descriptions
- Exhaustive literal coverage is impossible; practical exhaustive = all accessible/runnable credible OSS tools found in time window

## Deliverables
- `resume/analysis/oss-ats-audit-2026-03-17.md`
- Installed/cloned tool inventory with pass/fail status
- Actionable findings per resume

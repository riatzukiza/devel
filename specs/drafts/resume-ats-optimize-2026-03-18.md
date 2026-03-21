# Resume ATS Optimize Draft — 2026-03-18

## Goal
Tighten the existing `-ats` resume variants using the completed OSS ATS audit so the ATS versions better preserve parser-recognizable structure while keeping claims factual and one-page.

## Scope
- Update reusable resume skills with audit-backed lessons
- Normalize section labels and contact labeling in current `resume/*-ats.{md,tex}` files
- Quantify bullets only with verified metrics already present in README/docs
- Rebuild ATS PDFs and rerun parser sanity checks

## Open Questions
- None blocking; optimization will stay within already verified claims and metrics from project READMEs.

## Risks
- One-page LaTeX layouts may overflow after clearer headings or quantified bullets
- Some parser failures are extractor-specific and may not fully disappear
- Over-optimizing for one naive tool can reduce human readability

## Priorities
1. Preserve truthfulness
2. Preserve one-page PDFs
3. Improve parser-recognizable structure
4. Keep ATS/fnord variants semantically aligned

## Implementation Phases
1. Update resume skills from audit findings
2. Tighten ATS source files (`.md` + `.tex`)
3. Rebuild ATS PDFs
4. Rerun parser sanity checks and summarize deltas

## Affected Files
- `/home/err/.agents/skills/resume-fnord-ats/SKILL.md`
- `/home/err/.agents/skills/resume-ats-optimize/SKILL.md`
- `/home/err/.agents/skills/resume-oss-ats-audit/SKILL.md`
- `resume/aaron-beavers-*-ats.md`
- `resume/aaron-beavers-*-ats.tex`
- `resume/aaron-beavers-*-ats.pdf`
- `resume/analysis/tmp/*` (verification outputs)

## Definition of Done
- Skills capture the new audit lessons
- ATS resumes use more parser-friendly labels/structure
- ATS PDFs rebuild successfully and stay one page
- At least one parser sanity check is rerun on updated ATS PDFs
- Receipts are appended for the optimization phase

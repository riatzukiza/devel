# Resume ML Workbench Draft — 2026-03-18

## Goal
Review the current `resume/` corpus, research credible ML techniques for resume evaluation/improvement, author new reusable skills for that workflow, and build a local resume-processing workbench that can be cited as a real artifact.

## Scope
- Re-review current resumes using the newly authored resume skills
- Research practical ML methods for resume/JD evaluation and improvement
- Write new skills that encode the research + artifact workflow
- Build a local CLI/workbench that processes resumes and optional job descriptions
- Produce a reproducible report and sample outputs under `resume/analysis/`

## Open Questions
- Which local embedding backend is available right now? (Ollama check in progress; design should gracefully degrade if unavailable.)
- What is the minimum credible artifact we can ship today? (Current answer: parser ensemble + lexical scorer + optional dense scorer hook + report generator.)

## Risks
- Local embedding runtime may be unavailable, forcing lexical-only mode for now
- Existing ATS parser outputs are noisy, so ensemble logic must preserve provenance and uncertainty
- Resume artifact should remain truthful and not overclaim ML sophistication beyond what ships

## Priorities
1. Produce a real, runnable artifact in-repo
2. Keep the design evidence-backed and reproducible
3. Make outputs explainable enough to improve resumes safely
4. Capture the workflow as reusable skills

## Implementation Phases
1. Research + architecture synthesis
2. Skill authoring
3. CLI/workbench implementation
4. Run on current resumes and write analysis report
5. Feed artifact back into resume optimization recommendations

## Affected Files
- `/home/err/.agents/skills/resume-*/`
- `.opencode/skill/resume-*/`
- `AGENTS.md`
- `src/resume-workbench/**`
- `package.json`
- `resume/analysis/**`
- `specs/drafts/resume-ml-workbench-2026-03-18.md`

## Definition of Done
- New skills load and are linked into `.opencode/skill/`
- A local resume-processing CLI exists and runs in this workspace
- The CLI can analyze current resume PDFs and optional JDs
- A research/report document explains the ML techniques and chosen design
- Outputs are concrete enough to credibly cite as a resume-processing artifact

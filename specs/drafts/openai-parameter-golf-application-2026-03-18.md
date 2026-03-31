# OpenAI Parameter Golf Participation + Application Pack (Draft) — 2026-03-18

## Goal
Turn the user's scattered but relevant experience into a concrete OpenAI Parameter Golf application package by:
1. bringing `openai/parameter-golf` into this workspace as an SSH git submodule,
2. inspecting the challenge and the early public landscape,
3. scanning this workspace for reusable ideas/artifacts that map well to the challenge,
4. producing a truth-bound, targeted resume variant for this effort.

## User intent
- Participate in the project/challenge.
- Tailor a resume specifically toward this opportunity.
- Use this workspace as evidence, not vague self-description.
- Reduce scattered experience into a coherent application narrative.

## Known facts
- Official repo resolves at `git@github.com:openai/parameter-golf.git` and `org-14957082@github.com:openai/parameter-golf.git`.
- Default branch is `main`.
- Existing workspace convention stores OpenAI repos under `orgs/openai/`.
- Current best resume base is likely one of:
  - `resume/aaron-beavers-ml-oss-1p.md`
  - `resume/aaron-beavers-ml-oss-ats.md`
- Existing application workflow/tooling already lives in `src/resume-apply/` and `resume/applications/`.

## Open questions
- Should this pass generate only a resume, or also a cover letter/application note?
- Do we want ATS-clean only, or ATS + fnord variants for the targeted resume?
- Do we want a first local baseline experiment for Parameter Golf after submodule install, or stop at setup + application materials?

## Risks
- The challenge is fresh, so public solution signal may be sparse or noisy.
- Resume claims must stay tightly evidence-bound; easy to oversell model-training depth if not careful.
- The workspace is already dirty; edits must stay localized and traceable.
- Upstream repo/tooling may require GPU/runtime assumptions we cannot fully exercise in this pass.

## Affected files
- `.gitmodules`
- `orgs/openai/parameter-golf/` (new submodule)
- `resume/applications/2026-03-18/openai/parameter-golf/`
- `resume/aaron-beavers-openai-parameter-golf-ats.{md,tex,pdf}`
- `resume/aaron-beavers-openai-parameter-golf-fnord.{md,tex,pdf}` (if produced)
- `receipts.log`

## Phase plan

### Phase 1 — Research + evidence gathering
- Inspect official challenge materials.
- Check current leaderboard / notable runs / public forks if available.
- Scan local workspace for challenge-relevant artifacts and evidence.

### Phase 2 — Workspace setup
- Add `orgs/openai/parameter-golf` as an SSH submodule.
- Verify checkout + branch/default state.
- Record exact submodule path and remote.

### Phase 3 — Application bundle assembly
- Create a deterministic bundle under `resume/applications/2026-03-18/openai/parameter-golf/`.
- Store job/challenge sources, normalized notes, and a concise local research memo.

### Phase 4 — Resume targeting
- Derive a targeted resume from the ML/OSS base.
- Emphasize truthful evidence relevant to Parameter Golf: reproducible evaluation pipelines, dataset work, performance-minded systems, benchmark/eval design, and shipping discipline.
- Build ATS output first; add fnord variant second if time/fit allows.

### Phase 5 — Verification + handoff
- Verify submodule state.
- Verify resume artifacts compile and remain parser/text sane if PDFs are built.
- Summarize strongest workspace-to-challenge connections and recommended next action.

## Definition of done
- `orgs/openai/parameter-golf` exists as an SSH submodule on `main`.
- An application bundle exists with stored sources/notes.
- A targeted resume artifact exists and is grounded in verifiable workspace evidence.
- `receipts.log` contains start/progress receipts for this work.

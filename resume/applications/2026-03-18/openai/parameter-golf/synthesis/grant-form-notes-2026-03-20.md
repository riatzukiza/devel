# OpenAI Parameter Golf compute grant / participant form notes — 2026-03-20

## Resume to upload / use
Recommended resume for this form flow:
- `resume/aaron-beavers-openai-parameter-golf-grant-ats.pdf`

## Recommended field answers
### Current role
- Dropdown: `Other`

### Describe your role
Use one of these:
1. `Independent open-source ML systems engineer`
2. `Independent open-source ML systems engineer and OSS maintainer`
3. `Independent open-source ML systems engineer building evaluation pipelines, model infrastructure, and compact experiment systems`

Avoid `Open source Product Owner` by itself unless you specifically want a more product-facing frame. The engineering/research framing is stronger for this challenge.

## Compute support recommendation
### Recommended ask
- **Development grant (~$500 / ~160 compute hours)**

### Why not quick-start
Quick-start is too small for the current state of the project:
- you already have a local RTX 4070 proving ground
- you already have an ACO-guided search scaffold
- you already have candidate ranking and a local proxy eval loop
- you need enough runway for multiple meaningful cloud experiments, not just a hello-world baseline

### Why not advanced competitor grant yet
Advanced competitor grant is better once you have:
- at least one serious official-style run result,
- or evidence you are already near the public frontier.

Right now the strongest honest position is:
- concrete plan,
- active experimentation,
- local validation already underway,
- need more compute to iterate and validate the best candidates.

## Suggested rationale for the grant form
Short version:

> I already have a local RTX 4070 workflow for proxy evaluation, an ACO-guided search scaffold, and a fork/PR path set up for Parameter Golf. I’m ranking candidate recipes using real local GPU runs plus public PR/leaderboard signals, then selecting only the strongest candidates for cloud validation. I’m requesting a development grant so I can turn this into a real submission loop with meaningful ablations and confirmation runs instead of spending most of the budget on first-contact setup.

Longer version:

> I’m approaching Parameter Golf with an experiment-systems mindset: local proxy evaluation first, then selective cloud runs for the candidates that survive. I’ve already built a containerized local CUDA workflow on an RTX 4070, an ACO-guided search lab for candidate recipes, and a signal-sync step that incorporates public PR/leaderboard motifs like quantization, sliding-window evaluation, optimizer tuning, and architecture variants. I also opened an upstream PR from my fork so the project already has a public contribution path. Local proxy runs are now identifying a stronger neighborhood around shallower 512-width models with leaner KV structure. A development grant would let me convert that filtered local evidence into real official-environment runs, ablations, and confirmation attempts instead of burning credits on setup and blind exploration.

## Updated form-ready text

### Brief description of your approach (paste-ready, ~1.1k chars)

> I’m approaching Parameter Golf as a disciplined search problem rather than a blind sweep. I already have a local RTX 4070 containerized workflow, an ACO-guided experiment lab, and a fork/PR path set up for the repo. The lab ranks candidate recipes using two inputs: real local GPU proxy runs and public PR/leaderboard signal from the unofficial dashboard, which lets me bias exploration toward patterns that are actually showing up at the frontier (quantization, sliding-window eval, optimizer tuning, and architecture variants). I’m using the local loop to narrow the search space before spending cloud credits, then planning to run only the strongest candidates in the official environment. This should let me spend a development grant on meaningful ablations and confirmation runs rather than first-contact setup. My immediate goal is a credible Parameter Golf submission; longer term, I want to extend that into a compact model artifact optimized for safe, graph-aware reasoning under hard resource constraints.

### What have you tried so far? (paste-ready, <=255 chars)

> Built a local RTX 4070 Docker/CUDA workflow, ACO search lab, leaderboard-signal sync, and records-only submission branches. Ran local proxy sweeps plus 3 stronger full-validation 500-step runs. Current best full-val local candidate is `de7915d3d64c`.

### PR links (paste-ready)

> https://github.com/openai/parameter-golf/pull/240, https://github.com/openai/parameter-golf/pull/247, https://github.com/openai/parameter-golf/pull/248

## Practical spend plan for ~$500 / 160h
A reasonable plan is:
1. several cheap single-GPU ablations / sanity sweeps
2. a smaller number of stronger longer runs
3. a few official-style confirmation attempts on the best candidates

The exact mix depends on Runpod pricing and GPU choice, but the key point is that the budget is large enough to support an actual search loop.

## Current local direction
Current local proxy evidence favors testing these families next:
1. `Throughput push` (`de7915d3d64c`)
2. `free-ant≈Wide balance` (`2d0731942b8d`)
3. `free-ant≈KV-thin attention` (`9fbd60b89a28`)

See:
- `labs/parameter-golf-ant-lab/board/local-proxy-summary-2026-03-20.md`
- `labs/parameter-golf-ant-lab/board/signals/latest.md`
- `resume/applications/2026-03-18/openai/parameter-golf/verification/full-val-local-summary-2026-03-20.md`

## Public contribution path
- Fork: `https://github.com/riatzukiza/parameter-golf`
- Submission PR: `https://github.com/openai/parameter-golf/pull/240`
- Submission PR: `https://github.com/openai/parameter-golf/pull/247`
- Submission PR: `https://github.com/openai/parameter-golf/pull/248`
- Earlier tooling/docs PR: `https://github.com/openai/parameter-golf/pull/227`

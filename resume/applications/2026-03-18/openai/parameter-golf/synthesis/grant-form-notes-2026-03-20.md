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

> I already have a local RTX 4070 workflow for proxy evaluation and an ACO-guided search scaffold that ranks candidate Parameter Golf recipes using local runs plus public leaderboard signals. I am requesting a development grant so I can run multiple real ablations in the official environment, validate the strongest local candidates, and converge on a reproducible submission rather than spending the budget on first-contact setup.

Longer version:

> I’m approaching Parameter Golf with an experiment-systems mindset: local proxy evaluation first, then selective cloud runs for the candidates that survive. I have already set up a local CUDA/container workflow, a reproducible candidate search lab, and ranking based on local measurements and public PR/leaderboard signals. A development grant would let me run a focused series of meaningful ablations and confirmation runs rather than just a one-off baseline. My goal is to produce a real submission and then extend that work into a more novel compact model artifact around safe, graph-aware reasoning.

## Practical spend plan for ~$500 / 160h
A reasonable plan is:
1. several cheap single-GPU ablations / sanity sweeps
2. a smaller number of stronger longer runs
3. a few official-style confirmation attempts on the best candidates

The exact mix depends on Runpod pricing and GPU choice, but the key point is that the budget is large enough to support an actual search loop.

## Current local direction
Current local proxy evidence favors testing these families next:
1. `KV-thin attention`
2. `Throughput push`
3. `Baseline anchor`

See:
- `labs/parameter-golf-ant-lab/board/local-proxy-summary-2026-03-20.md`
- `labs/parameter-golf-ant-lab/board/signals/latest.md`

# OpenAI Parameter Golf — Official Source Notes

Sources:
- https://openai.com/index/parameter-golf/
- https://github.com/openai/parameter-golf
- local checkout: `orgs/openai/parameter-golf/README.md`

## Core challenge facts
- Goal: train the best language model that fits in a **16 MB artifact**.
- Leaderboard constraint: model must reproduce in **under 10 minutes on 8xH100s**.
- Metric: **compression on the FineWeb validation set**, reported as tokenizer-agnostic **bits per byte (`val_bpb`)**.
- OpenAI explicitly invites creative approaches including:
  - parameter tying / depth recurrence
  - low-rank or compressed parameterizations
  - quantization / bit-level compression
  - test-time compute or other unconventional evaluation ideas

## Hiring / participant signal
- The landing page includes a **Challenge Participant Form** intended to help OpenAI attribute submissions and reach out about opportunities.
- The page states OpenAI plans to hire a small cohort of early-career researchers and that exceptional participants may stand out to researchers and recruiters.

## Current official baseline (from README at checkout time)
- Leaderboard baseline: **1.2244 val_bpb**
- Baseline summary: **9 layers, 512 dim, 1024 vocab, tied embeddings, 4 KV heads**
- Notable non-record run: **1.2074 val_bpb** after a 4-hour run on the same basic layout

## Submission mechanics
Leaderboard or non-record submissions are PR-based and should add a new folder under the appropriate `records/` track containing:
1. `README.md`
2. `submission.json`
3. `train.log`
4. `train_gpt.py` and dependencies required to run the submission from the record folder

## Environment / data notes
- Official getting-started path supports Apple Silicon (`train_gpt_mlx.py`) and remote CUDA (`train_gpt.py`).
- Dataset helper: `data/cached_challenge_fineweb.py`
- Data docs emphasize a manifest-driven cached FineWeb export and exact tokenizer/data provenance.

## Why this matters for the application pack
The strongest fit signal is not generic “AI enthusiasm”; it is demonstrated ability to:
- work under hard constraints,
- produce reproducible evaluation artifacts,
- explain experimental deltas clearly,
- and ship a submission others can rerun.

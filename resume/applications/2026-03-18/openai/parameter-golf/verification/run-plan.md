# Suggested next run plan

## Fastest path to a real first result
1. Use a clean remote CUDA machine.
2. Clone `orgs/openai/parameter-golf` (or your fork) on remote disk.
3. Download cached challenge data:
   - `python3 data/cached_challenge_fineweb.py --variant sp1024 --train-shards 1`
4. Run a cheap smoke on 1 GPU first.
5. Only then move to longer or 8-GPU runs.

## Baseline-style remote command
```bash
RUN_ID=baseline_sp1024 \
DATA_PATH=./data/datasets/fineweb10B_sp1024/ \
TOKENIZER_PATH=./data/tokenizers/fineweb_1024_bpe.model \
VOCAB_SIZE=1024 \
torchrun --standalone --nproc_per_node=1 train_gpt.py
```

## What to record for every run
- git commit / diff state
- tokenizer + dataset variant
- architecture knobs
- train/eval wallclock
- model bytes + total artifact bytes
- final `val_bpb`
- short note about what changed vs prior run

## First useful local contribution ideas
- reproduce the official baseline cleanly on remote hardware
- build a receipts/ledger script for sweeps
- try one non-record idea built around recurrence / weight sharing with disciplined reporting

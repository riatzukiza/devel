# Lisp-Fixer (Qwen3-4B, QLoRA)

Goal: a tiny model that turns **broken Lisp** into **compilable Lisp** with repo context.

## Quickstart

### 0) Requirements
- Node 20+, pnpm
- Python 3.10+, CUDA drivers
- GPU: 4070 Ti (8GB VRAM), RAM: 32GB

### 1) Install TS tooling
pnpm i

### 2) Curate buildable repos
# scans ~/devel/* recursively and probes repos
pnpm tsx src/buildset.ts --root ~/devel --prompt "build" --out data/buildset.jsonl

### 3) Generate dataset
pnpm tsx src/mutate.ts --in data/buildset.jsonl --out data/train.jsonl --val data/val.jsonl --dialects clj,lisp,el,scm

### 4) (Optional) Inspect a few records
pnpm tsx src/dataset.ts --peek data/train.jsonl --n 3

### 5) Train (QLoRA SFT)
python -m venv .venv && source .venv/bin/activate
pip install -U torch transformers peft datasets bitsandbytes accelerate sentencepiece
python py/train_qlora.py --model Qwen/Qwen2.5-4B --train data/train.jsonl --val data/val.jsonl --out out/lora

### 6) Serve + infer
# (A) run your own infer (simple) or
pnpm tsx src/infer.ts --model out/lora --mode diff --file /path/to/broken.lisp

# (B) or start a Python server (stub provided)
python py/serve_vllm.py --model Qwen/Qwen2.5-4B --adapters out/lora

## Licensing
GPL-3.0-only
# Parameter Golf local setup status

## Submodule
- Path: `orgs/openai/parameter-golf`
- Remote: `org-14957082@github.com:openai/parameter-golf.git`
- Branch: `main`
- Checkout: upstream `HEAD` on 2026-03-18

## Validation performed
- `python3 -m py_compile train_gpt.py train_gpt_mlx.py data/cached_challenge_fineweb.py data/download_hf_docs_and_tokenize.py` → **passed**
- Local resume artifacts for this application were built and checked separately.

## Current blocker on this machine
Attempting a direct `import train_gpt` under the current global Python hit:
- `ImportError: libcusparseLt.so.0: cannot open shared object file`

Interpretation:
- the current local Python environment has a CUDA-linked `torch` install,
- but the expected CUDA shared library is not available on this host,
- so this machine is not yet a clean local CUDA runtime for the upstream trainer.

## Practical next setup options
1. Use the upstream-recommended remote CUDA path (Runpod / H100 or another GPU box).
2. Create an isolated Python environment with the exact torch/CUDA combo needed for this host.
3. If testing on Apple Silicon, follow the upstream `train_gpt_mlx.py` path instead.

## Recommendation
For fastest progress: treat this workspace as the control tower (notes, receipts, bundle assembly, result analysis) and do the first serious training runs in a clean remote GPU environment.

# ML CUDA base image + global container skill

## Goal
Create a reusable, local-registry-friendly ML base image that:
- fixes CUDA runtime/library issues for Python ML stacks in containers
- includes a broad default toolbox for local ML/dev workflows
- can be consumed by this repo and others via `localhost:5000/...`
- is paired with a global skill contract that triggers on ML container issues and ML local-service setup work

## User-requested outcome
- Search for existing container images to base from.
- Reuse an existing official image rather than rebuilding the CUDA stack from scratch.
- Produce a reusable image with a broad ML toolbox.
- Add a global skill contract for ML container issues / ML local services.

## Research conclusions
### Primary base choice
Use an official **PyTorch CUDA runtime** image as the image root, not a plain Debian/Java image.

Why:
- it already bundles the CUDA user-space stack + cuDNN expected by torch-based libraries
- it is much more likely to contain the runtime libs behind failures like `libcusparseLt.so.0`
- it gives us a real ML runtime, not just Python + package installs layered on top of a non-ML base

Candidate chosen:
- `pytorch/pytorch:2.4.1-cuda12.4-cudnn9-runtime`

### Secondary fallback
If PyTorch tags drift or become unsuitable, fallback to official NVIDIA CUDA runtime images:
- `nvidia/cuda:<version>-cudnn-runtime-ubuntu22.04`

### Service-specific official images to reference
- embeddings service: Hugging Face **Text Embeddings Inference** official image
- local proxy/model gateway service: **Open Hax** service/proxy image(s)

These are better as dedicated service containers, not the generic base image.

## Planned implementation
### Phase 0 — doc + skill
- update `docs/dev/docker.md`
- update `infra/registry/README.md`
- update the global `local-container-registry` skill + contract so it also handles ML container failures and local ML services
- update project-local skill link
- update `AGENTS.md` note

### Phase 1 — reusable image
- rewrite `Dockerfile.ml-base` around the official PyTorch CUDA runtime image
- include:
  - CUDA/cuDNN runtime from base image
  - Java 21 + clojure CLI/tooling
  - Python CLI aliases (`python3`, `pip3`) if needed
  - ML toolbox libs (`transformers`, `sentence-transformers`, `datasets`, `accelerate`, `pandas`, `polars`, `pyarrow`, `scikit-learn`, `hdbscan`, etc.)
  - cache/env defaults for HF models
  - optional model preloading

### Phase 2 — repo consumption
- ensure docs show how to tag/push to `localhost:5000/shibboleth/ml-base:<tag>`
- keep `PROMPTBENCH_BASE_IMAGE` as the consumption mechanism

## Acceptance criteria
- Dockerfile is based on an official CUDA-capable ML image.
- Docs clearly explain why that base was chosen.
- Global skill triggers on CUDA/ML container failures and ML local service setup requests.
- Project-local skill link is updated.
- `AGENTS.md` points to the skill for ML container/service tasks.

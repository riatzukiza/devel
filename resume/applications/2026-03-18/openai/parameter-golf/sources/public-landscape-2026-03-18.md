# Public landscape snapshot — 2026-03-18

Derived from fresh GitHub API reads plus the upstream README.

## Repo activity snapshot
- Repo: `openai/parameter-golf`
- Default branch: `main`
- Approx stats at collection time:
  - stars: **526**
  - forks: **311**
  - open issues / PRs: **11**

## Early public patterns people are exploring
These are from open issues / PRs and are **signals of exploration**, not verified winning directions.

### 1. Weight sharing / depth recurrence
Observed in PRs and descriptions such as:
- PR #5 — sparse attention + recursive weight sharing
- PR #8 — depth recurrence + SwiGLU
- PR #11 — looped transformer with per-loop specialization
- PR #15 — recursive weight sharing for the 16MB limit

**Interpretation:** the first obvious design frontier is increasing effective depth without paying full artifact cost.

### 2. Efficient specialization around a tiny core
Examples:
- PR #11 mentions LoRA adapters on looped blocks
- PR #16 explores a central hypernetwork / “DNA” style parameter generation idea

**Interpretation:** people are probing ways to keep the stored artifact tiny while recovering some per-layer specialization at run time.

### 3. Compute-aware attention and MLP choices
Examples:
- PR #5 mentions sliding-window attention
- PR #8 mentions SwiGLU
- several descriptions emphasize balancing parameter efficiency with the 10-minute wallclock limit

**Interpretation:** the challenge is not just parameter-count minimization; it is parameter-count under an evaluation-time budget.

### 4. Experiment operations are already becoming a differentiator
- PR #13 adds an experiment workflow, sweep helpers, isolated run directories, and log extraction.

**Interpretation:** disciplined experimentation is likely to matter quickly because tiny improvements need clean evidence.

## Open questions visible in the issue tracker
- Issue #12 asks whether the 10-minute budget means total reproduce time or separate training/eval windows.
- Issue #17 asks for exact eval environment clarification (PyTorch/CUDA/H100 specifics).

**Interpretation:** before spending serious compute, confirm the exact environment assumptions.

## Fresh fork signal
At collection time, very new forks were already appearing rapidly (examples included `lsb/parameter-golf`, `letwinbrayden/parameter-golf`, `PiotrGrzybowski/parameter-golf`, `sapirl7/parameter-golf`).

This suggests the public field is broad right now, but verified result depth is still shallow. That is good for entering early with a disciplined approach.

## Practical takeaway
The public frontier appears to be converging on three things already:
1. recurrence / sharing,
2. compression-aware architecture tricks,
3. better experiment bookkeeping.

That means a strong first contribution does not have to be a final SOTA model. It can also be:
- a reproducible local-to-remote experiment harness,
- a clearly justified non-record run,
- or a well-documented weird architecture that teaches the field something.

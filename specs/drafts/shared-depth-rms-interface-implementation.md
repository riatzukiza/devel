# Shared-Depth RMS Interface — Parameter Golf Implementation Draft

## Goal
Turn the `Shared-depth RMS interface` frontier family into a concrete implementation plan for `openai/parameter-golf`.

This family is meant to test the synthesis:
- shared depth / recurrent reuse
- extra pre-projection normalization
- tiny phase-conditioned specialization
- compression-aware survival after quantization

## Why this family
Current board search is telling us that compact, disciplined architectures can do well under local full-validation runs.
The frontier profile says the most interesting *next* code-changing family is not just “more recurrence,” but **recurrence with a better compression interface**.

The strongest prior-art connection is:
- recursive/shared-depth literature
- plus low-bit stabilization via extra RMSNorm
- plus tiny role/phase hints rather than storing many unique layers

## Concrete hypothesis
A recurrent/shared block with:
1. extra RMSNorm before fragile projections,
2. phase-conditioned micro-scales/gates,
3. protected precision only for tiny control tensors,

can outperform a naïve shared-depth model at the same final byte budget.

## Minimal implementation target
Start with a **single shared block repeated multiple times**, not full per-layer uniqueness.

### Proposed architecture delta
Instead of:
- `num_layers` unique `Block`s

Use:
- `num_physical_layers` unique blocks
- `num_logical_layers` total passes
- reuse the physical blocks cyclically or in a small schedule

Example:
- `NUM_PHYSICAL_LAYERS=3`
- `NUM_LAYERS=9`
- logical depth 9 using 3 stored blocks

### Shared-depth interface additions
For each physical block add:
1. **extra projection RMSNorms**
   - before `c_q`, `c_k`, `c_v`, and `fc`
2. **phase-conditioned scales/gates**
   - tiny learned vectors indexed by logical pass id or pass bucket
3. **protected control tensors**
   - keep these tiny interface tensors in the already-protected float path during export

## Suggested code changes

### A. Hyperparameters
Add env/config knobs:
- `NUM_PHYSICAL_LAYERS`
- `PHASE_BUCKETS`
- `EXTRA_PROJ_RMSNORM=1`
- `PHASE_CONDITIONED_SCALES=1`
- `SHARED_DEPTH_MODE=cyclic|mirror|encoder-decoder`

### B. Attention module
Current attention already uses RMSNorm on `q` and `k` and block-level norms.
Add optional extra norms on the *inputs* to the linear projections:
- `q_input_norm`
- `k_input_norm`
- `v_input_norm`

Minimal version:
- one extra `RMSNorm` before `c_q/c_k/c_v`
- maybe one extra `RMSNorm` before MLP `fc`

### C. Block interface
Add tiny per-phase tensors:
- `phase_attn_scale[phase_bucket, dim]`
- `phase_mlp_scale[phase_bucket, dim]`
- optional `phase_resid_mix[phase_bucket, 2, dim]`

Map logical layer index → phase bucket.
Use a small number of buckets, e.g. 3 or 4.

### D. GPT block schedule
Replace the `ModuleList` assumption that every logical layer owns unique weights.
Introduce a logical-to-physical mapping.

Minimal first mapping:
- `physical_index = logical_index % num_physical_layers`

Alternative later:
- mirrored schedule
- encoder/decoder reuse schedule

### E. Quantization/export
Make sure phase scales / gate tensors are matched by protected-control patterns so they survive compression cleanly.
Likely extend control tensor patterns with names like:
- `phase_attn_scale`
- `phase_mlp_scale`
- `phase_resid_mix`

## Experiment matrix

### Phase 0 — structural sanity
1. baseline unique-depth model
2. shared-depth without extra RMS interface
3. shared-depth + extra RMSNorm only
4. shared-depth + extra RMSNorm + phase scales

### Phase 1 — byte/perf frontier
Hold total bytes roughly fixed and compare:
- more unique depth
- fewer unique layers + more width
- fewer unique layers + phase-conditioned specialization

### Phase 2 — compression survival
Measure:
- pre-quant val_bpb
- post-roundtrip val_bpb
- quantization gap

This family wins only if the post-roundtrip story improves, not just pre-quant.

## Acceptance criteria
The family is promising if at least one shared-depth RMS-interface variant shows one of:
1. better post-roundtrip `val_bpb` than a comparable shared-depth baseline,
2. better quantization-gap behavior than plain shared-depth,
3. competitive `val_bpb` while storing fewer unique blocks.

## Failure conditions
Kill or downrank the family if:
- shared-depth instability remains even with extra RMSNorm,
- phase scales add bytes without measurable gain,
- the quantization gap stays worse than non-shared baselines,
- implementation complexity explodes before a meaningful signal appears.

## Recommended first branch
Create a dedicated experimental branch/fork branch named like:
- `frontier/shared-depth-rms-interface-v0`

Scope it narrowly:
- no tokenizer changes
- no eval-time tricks yet
- just shared depth + extra RMS interface + phase scales

## Why this is the right next frontier
It is novel enough to matter,
but grounded enough to implement without vanishing into mythology.

It is also the best bridge between:
- Parameter Golf board pressure,
- research-garden synthesis,
- and the Presence intuition that one small mechanism can wear many roles if given the right lens.

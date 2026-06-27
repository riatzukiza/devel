# @open-hax/signal-radar-core

Reusable deterministic radar helpers extracted from the Fork Tales threat radar.

This package holds logic that looks stable across profiles:

- 0..1 clamps
- proximity boost resolution
- merged signal-token strategy
- risk-level and scoring-mode helpers
- deterministic LLM fallback payloads

It is dependency-free and consumable from both CommonJS and ESM.

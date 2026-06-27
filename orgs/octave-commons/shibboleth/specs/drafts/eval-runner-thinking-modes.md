# Eval runner: model mix + thinking/reasoning modes

## Goal
Enable evaluation runs that:
- include additional baseline models (e.g. Kimi + Claude)
- vary "thinking/reasoning" knobs where supported (e.g. `reasoning_effort`)
- record which knob was used per request so the paper can quantify impact

## Context
- Proxy exposes model IDs like `kimi-k2.5` and `factory/claude-opus-4-6`.
- Some upstreams accept `reasoning_effort` (e.g. Kimi), others reject it (e.g. Claude).
- We must not silently fall back to a different reasoning mode when the user explicitly requested one.

## Requirements
1. CLI supports a global reasoning setting:
   - `--reasoning-effort none|low|medium|high` (optional)
2. CLI supports per-model overrides:
   - `--reasoning-effort-by-model "model=effort,model2=effort"`
3. Runner passes `reasoning_effort` through to the proxy (OpenAI-compatible).
4. Events record what was requested/used:
   - requested reasoning effort (string)
   - whether it was user-specified vs auto
   - whether adapter used `content` vs `reasoning` field as `:text`
5. If the user explicitly set a reasoning effort and the upstream rejects it, record an error (no silent fallback).

## Non-goals
- Multi-dimensional sweeps (reasoning as an additional axis) inside a single run.
- Changing refusal judgment logic.

## Affected files
- `src/promptbench/eval/runner.clj`
- `src/promptbench/eval/openai_adapter.clj`

## Definition of done
- A run can include: `glm-5,gpt-5.2,kimi-k2.5,factory/claude-opus-4-6`.
- Kimi can be run with `reasoning_effort=high` and Claude without reasoning effort.
- Events contain reasoning metadata + no silent mode changes.

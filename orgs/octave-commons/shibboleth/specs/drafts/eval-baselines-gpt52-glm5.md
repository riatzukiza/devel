# Eval baselines: gpt-5.2 vs glm-5

## Goal
Run the repo’s baseline evaluation runner against the existing prompt bundle to compare:
- (P0) model-only behavior (refusal rate / attack-success proxy)
- (P1) hard-block baseline (optional; uses deterministic risk scorer)

Target models (via local OpenAI-compatible proxy):
- `gpt-5.2`
- `glm-5`

## Context
- Bundle exists locally at `data/build/0.1.0/` (gitignored output).
- Evaluation runner: `src/promptbench/eval/runner.clj`.
- Proxy requires `PROXY_AUTH_TOKEN` (available in env as `OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN`).

## Blockers / fixes
- `promptbench.eval.runner` docstring used shell-style `\` line continuations, which breaks the Clojure reader.
  - Fix: remove literal backslashes from the docstring so the namespace can load.

## Open questions
1. Run scope: sample (`--max-cases 200`) vs full test split (`1996` prompts)?
2. Include `P1` runs? If yes, use `oracle-intent` (upper bound) or `regex` (cheap realistic baseline)?
3. Evaluate MT variants too? Current `variants.parquet` appears to be `split=train` only.

## Risks
- Cost/time: API calls scale with `cases × models × policies`.
- Safety: prompts are adversarial; we should avoid persisting raw model outputs. (Runner already stores only hashes + heuristic judgments.)

## Phases
### Phase 1 — Make eval runner load
- Remove invalid backslash escapes in `src/promptbench/eval/runner.clj` docstring.

### Phase 2 — Pilot run
- Run `promptbench.eval.runner` on `split=test`, `suite=native`, `--max-cases 200`, `--models gpt-5.2,glm-5`.
- Record run dir under `data/runs/<run-id>/`.

### Phase 3 — Expand (optional)
- Full test split native prompts.
- Variants evaluation (likely `split=train` or `split=all` due to current bundle contents).

## Affected files
- `src/promptbench/eval/runner.clj`
- (outputs) `data/runs/**` (gitignored)

## Definition of done
- `clj -M -m promptbench.eval.runner ...` completes successfully.
- Metrics produced in `data/runs/<run-id>/metrics.edn` and summarized for both models.

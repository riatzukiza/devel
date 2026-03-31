# Clock Model Evolver

Use this skill to improve the Hormuz clock itself over time through deep research, model redesign, and new signal integration.

## Purpose
Advance the clock architecture by identifying better state variables, better public signal sources, and better rendering strategies.

## When to use
Use this skill when asked to:
- improve the clock design
- add new signal classes
- compare analyst frameworks
- stress-test branch priors and thresholds
- create prompts for multi-model scheduled updates

## Inputs
Expected inputs can include:
- the current methodology markdown
- current state JSON and config files
- prior reports and rendered clocks
- a design question (for example: "replace static branch priors with rules")

## Workflow
1. Read `methodology/clock_methodology_v4.md` and the latest state/config files.
2. Identify the model bottleneck: missing signals, brittle thresholds, poor visuals, or weak branch logic.
3. Propose additive schema changes first.
4. Add new signal extractors or normalization rules.
5. Update prompts under `prompts/research/` so outside models can critique the design.
6. Record what changed and how to verify it.

## Guardrails
- Distinguish facts, inferred scores, and branch priors.
- Prefer additive changes over breaking rewrites.
- Keep source provenance visible.
- If a signal cannot be measured reliably, mark it experimental.

## Evolution rule
The clock is a living model. Any part of it may evolve if the change improves explainability, signal quality, or reversibility tracking.

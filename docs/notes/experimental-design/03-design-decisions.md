---
title: "Design Decisions with References"
date: "2026-01-30T01:30:44"
tags: [experimental-design, citations, leakage-prevention, methodology]
summary: "Cites research on split-before-translate to prevent semantic leakage, with references to VT AAAI22 and MIT TACL papers."
---

We want C:
## Make leakage impossible
Splitting at a canonical `source_id` (or “problem level”) before any translation/augmentation is the right invariant, because otherwise translated variants can leak semantics across splits and inflate measured generalization. [people.cs.vt](https://people.cs.vt.edu/~reddy/papers/AAAI22.pdf)
There’s empirical evidence that translation-based cross-lingual evaluation can over-estimate transfer performance, so your “split-first, translate-later” rule is not just pedantry—it’s central to defensible claims. [direct.mit](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00539/114596/Cross-Lingual-Dialogue-Dataset-Creation-via)

## Dataset shape: prompt-level first
Start with a flat prompt dataset where each row is `source_id`, `intent_label` (benign vs adversarial + taxonomy), and a canonical English text (or another pivot), then generate language variants *after* the split and keep a `variant_id` that always points back to the same `source_id`. [people.cs.vt](https://people.cs.vt.edu/~reddy/papers/AAAI22.pdf)
This gives you a clean baseline to report safety/availability tradeoffs without session dynamics confounding the result, aligning with guardrail evaluation notions like safety “granularity” (token/sequence/session). [arxiv](https://arxiv.org/html/2506.10597v2)

## Dataset shape: session-level next
Add a session dataset where each example is a turn-indexed conversation with `session_id`, `source_id_set` (the prompts used), a deterministic RNG seed, and per-turn labels (benign/probe/attack/recovery). [arxiv](https://arxiv.org/html/2506.10597v2)
This directly supports the research question guardrail SoK work highlights—how effective session-level guardrails actually are against multi-turn jailbreaks—and it lets you measure cost/latency overheads that single-turn datasets hide. [arxiv](https://arxiv.org/html/2506.10597v2)

## Multilingual expansion without “template inflation”
Do translations only for the *train* `source_id`s and *eval* `source_id`s separately, and record translation metadata (engine/model, direction, timestamp, confidence, and back-translation similarity score) so you can filter drifted items rather than silently training on corrupted labels. [direct.mit](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00539/114596/Cross-Lingual-Dialogue-Dataset-Creation-via)
Keeping “meaning preserved” as a logged, testable constraint is also how you avoid code-mix suites devolving into stylistic noise that breaks the label invariants. [direct.mit](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00539/114596/Cross-Lingual-Dialogue-Dataset-Creation-via)

## Code-mix + homoglyph suites (eval-only)
Treat code-mixed prompts and Unicode/homoglyph perturbations as explicit robustness suites with deterministic transforms (seeded swaps, controlled percentages, normalized/un-normalized variants), because cross-script and special-character attacks are a known bypass vector. [arxiv](https://arxiv.org/html/2508.14070v2)
Recent work specifically stresses that homoglyph/script-mixing and hybrid code-mix attacks can materially increase jailbreak success and that normalization/script-detection can reduce it—exactly the kind of “controlled obfuscation extension” you’re proposing. [academia](https://www.academia.edu/143809742/HinGlyph_Attacks_Cross_Script_Adversarial_Vulnerabilities_in_Multilingual_LLMs)

## Align your axes to prior SEU framing
Your safety–availability–cost triad maps cleanly onto published tri-objective framings like Security–Efficiency–Utility (SEU): security ≈ safety, utility ≈ availability (false positives on benign), and efficiency ≈ cost/overhead. [arxiv](https://arxiv.org/html/2506.10597v2)
That linkage matters because it anchors your metrics in an existing evaluation vocabulary, while still letting you innovate on multilingual sparsity + session dynamics. [arxiv](https://arxiv.org/html/2506.10597v2)

## Cost measurement needs real instrumentation
Define cost as measured quantities (tokens, tool calls, wall-clock latency, and number of “guardrail invocations”) and log them per turn so you can plot “token burn trajectory” under attack sessions. [arxiv](https://arxiv.org/html/2506.10597v2)
Even practitioner reports emphasize that guardrails can add noticeable latency and cost due to extra model calls, which your framework can quantify rigorously rather than anecdotally. [cyberark](https://www.cyberark.com/resources/threat-research-blog/jailbreaking-every-llm-with-one-simple-click)

## Concrete decision: how to do “C” without exploding scope
Implement C as:
- Phase 1 (publishable alone): prompt-level corpus + translation-after-split + eval suites (native, translated, code-mix, obfuscation). [direct.mit](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00539/114596/Cross-Lingual-Dialogue-Dataset-Creation-via)
- Phase 2 (novelty amplifier): session generator + session dataset + per-turn cost accounting + session-level safety granularity evaluation. [arxiv](https://arxiv.org/html/2506.10597v2)

## Minimal schema (suggested)
- `prompts.parquet`: `source_id`, `label`, `category`, `canonical_text`, `notes`, `split` (train/eval). [people.cs.vt](https://people.cs.vt.edu/~reddy/papers/AAAI22.pdf)
- `variants.parquet`: `variant_id`, `source_id`, `language`, `text`, `variant_type` (native/mt/backtrans/codemix/homoglyph), `transform_seed`, `quality_flags`. [arxiv](https://arxiv.org/html/2508.14070v2)
- `sessions.jsonl`: `session_id`, `turns[]` (each has `variant_id`, `role`, `expected_policy_outcome`, `attack_stage`), `session_template`, `seed`. [arxiv](https://arxiv.org/html/2506.10597v2)

You can absolutely evaluate **multiple target LLMs behind the same policy layers**, but you need to treat “LLM choice” as a first-class experimental factor and aggressively control *interface* and *routing* confounds (especially with gateways that can silently swap models). [arxiv](https://arxiv.org/html/2506.10597v2)

## Architecture to keep it clean
Implement a single “policy router” that owns: (1) your prompt/session generator, (2) policy layer(s) P1…P7, and (3) a target-model adapter that is intentionally dumb (just sends bytes, returns bytes). [arxiv](https://arxiv.org/html/2506.10597v2)
This matches the spirit of tri-objective guardrail evaluation—measure security/safety, efficiency/cost overhead, and utility/availability impacts as properties of the *whole pipeline* (policy + target LLM), not just the classifier. [arxiv](https://arxiv.org/html/2506.10597v2)

## Experimental design (factor it)
Model your experiment as a matrix: `policy_layer × target_llm × language_suite × attack_suite × session_template`, and report metrics per cell plus aggregate tradeoff curves. [arxiv](https://arxiv.org/html/2506.10597v2)
The SoK framing explicitly argues for a tri-objective evaluation (Security–Efficiency–Utility) with metrics like attack success rate and overhead/utility costs, which maps directly onto your safety–availability–cost axes. [arxiv](https://arxiv.org/html/2506.10597v2)

## Interface normalization (where most “noise” comes from)
Normalize the request contract across providers: same message schema, same max output tokens, same temperature, same stop conditions, and the same “system/policy” prefixing strategy per policy layer. [github](https://github.com/ollama/ollama/blob/main/docs/api.md)
For local models, you’ll also want the ability to send a fully templated prompt (no provider-side formatting) so that “policy layer text” is identical across targets; Ollama supports a `raw` option for this in its generate API. [github](https://github.com/ollama/ollama/blob/main/docs/api.md)

## Vivgrid specifics (gateway confound)
Be careful using Vivgrid “managed” routing for research comparisons, because the docs describe it as a gateway that can handle underlying model selection/upgrades/routing—great operationally, but it can blur attribution if the backing model changes mid-study. [vivgrid](https://www.vivgrid.com/docs/tutorial/clawdbot)
If Vivgrid lets you pin exact model IDs (instead of “managed”), do that for the paper, and log the returned model identifier (or any equivalent metadata) per request. [vivgrid](https://www.vivgrid.com/docs/tutorial/clawdbot)

## Ollama specifics (local baselines + reproducibility)
With Ollama you can run models locally via an HTTP API (e.g., `/api/generate`) and control things like streaming, JSON-mode formatting, and “raw prompt” handling. [docs.ollama](https://docs.ollama.com/api/introduction)
Ollama also documents OpenAI-compatibility, which can make it easier to plug into the same adapter interface you use for Vivgrid/OpenAI-style providers. [docs.ollama](https://docs.ollama.com/api/openai-compatibility)

## Logging (make your results defensible)
At minimum, log per turn: `(policy_layer, target_llm, provider, model_id, language, suite, session_id, turn_index, prompt_hash, response_hash, tokens_in/out, latency_ms, tool_calls, decision_trace)`. [arxiv](https://arxiv.org/html/2506.10597v2)
The SoK explicitly highlights efficiency/overhead (delay, resource consumption) and utility impact (false positives on benign), so your token+latency+refusal-loop telemetry is not “extra”—it’s core to the evaluation claim. [arxiv](https://arxiv.org/html/2506.10597v2)

## Two practical recommendations
- Treat “policy layer” as *purely deterministic* whenever possible (seeded transforms, fixed thresholds), so variance mostly comes from the target LLM rather than your evaluator.  
- Add a “provider behavior” suite: same prompt, different transport modes (raw vs templated, OpenAI-compatible vs native) to quantify how much the interface alone changes outcomes. [docs.ollama](https://docs.ollama.com/api/openai-compatibility)

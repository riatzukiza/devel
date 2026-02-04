# GPT-5.1 + Codex Mini Integration Plan

**Date:** 2025-11-13  
**Owner:** Codex agent  
**Status:** Draft

## Background & References
- OpenAI: [Introducing GPT-5.1 for developers](https://openai.com/index/gpt-5-1-for-developers/) — announces adaptive reasoning, `reasoning_effort: "none"`, 24h prompt cache, and first-party `apply_patch` + `shell` tools (Nov 13 2025).
- GitHub: [GPT-5.1, GPT-5.1-Codex, GPT-5.1-Codex-Mini public preview](https://github.blog/changelog/2025-11-13-openais-gpt-5-1-gpt-5-1-codex-and-gpt-5-1-codex-mini-are-now-in-public-preview-for-github-copilot/).
- OpenRouter model page: [openai/gpt-5.1-codex](https://openrouter.ai/openai/gpt-5.1-codex) for positioning, token limits, reasoning tuning.
- Upstream Codex repo references for naming/tool behavior:
  - `orgs/openai/codex/codex-rs/common/src/model_presets.rs:45-191`
  - `orgs/openai/codex/codex-rs/core/src/model_family.rs:168-191`
  - `orgs/openai/codex/codex-rs/core/src/tools/spec.rs:1245-1366`
- Tracking issue: [sst/opencode#4316](https://github.com/sst/opencode/issues/4316) — "Feature: first-class GPT-5.1 models and reasoningEffort="none" support". No linked PR yet.

## Current Implementation Touchpoints
- **Plugin side (open-hax/codex)**
  - Model normalization & reasoning heuristics: `orgs/open-hax/codex/lib/request/request-transformer.ts:293-905`.
  - Config + type definitions: `lib/types.ts:33-49`, `config/full-opencode.json:17-194`, `config/minimal-opencode.json:1-12`.
  - CLI validation script: `scripts/test-all-models.sh:66-193`.
  - Docs: `README.md:37-386`, `docs/development/CONFIG_FIELDS.md:24-335`.
  - Prompt/tool guidance: `lib/prompts/codex.ts:163-210`, `lib/prompts/codex-opencode-bridge.ts:17-140`.
- **Core opencode gaps (sst/opencode)**
  - No GPT-5.1 model IDs or presets in docs/UI: `packages/web/src/content/docs/models.mdx:70-138`, `packages/web/src/content/docs/zen.mdx:65-81`.
  - Provider transform lacks `reasoningEffort: "none"` awareness and defaults: `packages/opencode/src/provider/transform.ts:138-151`.
  - Title-generation fallback still clamps GPT-5.* small models to `"minimal"`: `packages/opencode/src/session/prompt.ts:1799-1804`.
  - Zen OpenAI proxy always emits `reasoning: { effort: "medium" }`: `packages/console/app/src/routes/zen/util/provider/openai.ts:310-326`.

## Problem Statement
The plugin only knows about GPT-5 era slugs (`gpt-5`, `gpt-5-codex`, `codex-mini-latest`). GPT-5.1 models (including Codex Mini) are live upstream and exposed in Codex CLI. Without updates:
- Requests for new slugs fall back to legacy defaults, losing new reasoning/latency benefits.
- `reasoning_effort: "none"` is unsupported in types and logic.
- Tool specs now include `shell` and `apply_patch`, but normalization may still strip or mis-handle them.
- User-facing configs/docs/scripts remain out-of-date.

## Requirements
1. **Model Support**
   - Normalize any `gpt-5.1*` inputs (general, codex, codex-mini) to the correct backend slugs (`gpt-5.1`, `gpt-5.1-codex`, `gpt-5.1-codex-mini`).
   - Maintain backward compatibility for existing gpt-5 preset names, but prefer 5.1 variants.
   - Ensure codex-mini aliases (`gpt-5.1-codex-mini-*`, `codex-mini-latest`) resolve consistently.

2. **Reasoning Configuration**
   - Extend `reasoningEffort` union to include `"none"`.
   - Default `gpt-5.1` to `none`, `gpt-5.1-codex` to `medium`, and enforce `medium` minimum for `gpt-5.1-codex-mini` per Codex CLI behavior.
   - Keep legacy behavior for older presets (e.g., map `minimal`→`low` for codex) for compatibility.

3. **Tool Handling**
   - Preserve native `shell` & `apply_patch` tool descriptors emitted by Codex CLI instead of demoting to custom local fallbacks.
   - Continue normalizing other shapes (function/custom) and ensure `parallel_tool_calls` defaults align with Codex 5.1 families.

4. **Configurations & Scripts**
   - Update `config/full-opencode.json` and `config/minimal-opencode.json` to feature gpt-5.1 presets (low/med/high, mini med/high, etc.) while documenting legacy ones as deprecated but still supported.
   - Refresh `scripts/test-all-models.sh` expectation table to cover new presets and verify normalized output, reasoning effort, and verbosity.

5. **Documentation**
   - README and docs must describe new models, reasoning options (including `none`), tooling changes, and mention extended prompt caching.
   - CONFIG_FIELDS guide should highlight `reasoningEffort` updates and new preset naming.
   - Add CHANGELOG entry summarizing GPT-5.1 rollout.

6. **Testing & Verification**
   - Extend unit tests (`test/request-transformer.test.ts`) to cover new normalization + reasoning cases, tool retention, and end-to-end body transforms.
   - Run vitest + `scripts/test-all-models.sh`; capture results in `test-results.md`.

## Dependencies / Related Work
- No open issues/PRs found yet; coordinate with upstream Codex release notes if available.
- Rely on existing prompt cache + session handling (no changes expected).

## Risks & Mitigations
- **Risk:** Users pinned to gpt-5 may prefer legacy behavior. → Keep fallback mapping and document migration path.
- **Risk:** Tool changes could violate internal safety rules about `apply_patch`. → Ensure prompts still instruct models to use `edit` in this workspace, even if Codex exposes `apply_patch`.
- **Risk:** Config proliferation. → Provide clear documentation and mark legacy presets as deprecated.

## Definition of Done
- All requirements above implemented.
- Tests and validation script updated/passing.
- Documentation + CHANGELOG refreshed.
- Todos in AGENTS tracker closed for this effort.

## 2025-11-14 Notes
- Aiden requested clarification on issue #4316 chat thread (Slack, 10:16–11:17). Need to explain that "reasoningEffort: \"none\"" lives in core schema for auto-complete + validation, not to enforce UI gating per provider.
- Emphasize that plugins/providers can still send any OpenAI option; core change gives schema awareness + IDE UX parity with Codex CLI.
- Highlight that GPT-5.1 is now canonical default family, so schema + picker updates exist to help discovery.

## Reasoning Effort Matrix (Research 2025-11-14)
- Source of truth for enforcement is the Codex OAuth plugin’s `getReasoningConfig` (`orgs/open-hax/codex/lib/request/request-transformer.ts:303-425`) plus its unit tests (`orgs/open-hax/codex/test/request-transformer.test.ts:104-124`). The public README table documents the presets users see in opencode (`orgs/open-hax/codex/README.md:430-459`).
- **GPT-5.1 (general)**: default `none`; accepts `none`, `low`, `medium`, `high`. Any user-supplied `minimal` is auto-upgraded to `none`, keeping the new “no reasoning” path exclusive to this family.
- **GPT-5 (general)**: default `medium` (or `minimal` for lightweight slugs such as `gpt-5-nano`/`gpt-5-mini`). Permitted values are `minimal`, `low`, `medium`, `high`; attempting `none` downgrades to `minimal` for backwards compatibility.
- **GPT-5/GPT-5.1 Codex (full Codex family)**: default `medium`; valid values are `low`, `medium`, `high`. Inputs of `minimal` or `none` clamp to `low` before dispatching to ChatGPT (`getReasoningConfig` guards at lines 409-420).
- **GPT-5/GPT-5.1 Codex Mini**: default `medium`, only `medium` or `high` survive; everything else (including `minimal`, `low`, `none`) is forced back to `medium` (`lines 399-415`). Presets `*-codex-mini-medium` / `*-codex-mini-high` in README reflect that limitation.
- **Lightweight “nano/mini” general models**: anything matching `nano` or `mini` but *not* Codex (e.g., `gpt-5-nano`) gets the low-cost profile—defaults to `minimal`, but user overrides up to `high` are honored except that `none` is down-converted to `minimal` because the backend never exposed it for legacy GPT-5 SKUs.
- Table below (derived from `config/full-opencode.json`) lists every shipping preset and its reasoning slot to help documentation/IDE teams keep completion hints accurate:
  | Variant | Default reasoning | Allowed values | Notes |
  |---------|-------------------|----------------|-------|
  | `gpt-5.1-none` | `none` | `none`, `low`, `medium`, `high` | Only family where `none` is legal.
  | `gpt-5.1-low/medium/high` | `low`/`medium`/`high` | same set as general | Adds friendly display names.
  | `gpt-5.1-codex-{low,medium,high}` | as labeled | `low`, `medium`, `high` | `none`→`low`.
  | `gpt-5.1-codex-mini-{medium,high}` | shown value | `medium` or `high` | clamp prevents lighter efforts.
  | `gpt-5-{minimal,low,medium,high}` | as labeled | `minimal`, `low`, `medium`, `high` | `none`→`minimal`.
  | `gpt-5-mini` | `low` | {`low`,`medium`,`high`} | flagged as lightweight but allows upgrades.
  | `gpt-5-nano` | `minimal` | {`minimal`,`low`,`medium`,`high`} | best-effort speed tier.
  | `gpt-5-codex-{low,medium,high}` | as labeled | `low`,`medium`,`high` | `minimal`/`none` normalized to `low`.
  | `gpt-5-codex-mini-{medium,high}` | shown value | `medium`,`high` | same clamp rules as 5.1 mini.

- Action item: if opencode core ever surfaces schema-enforced enums, reuse this matrix so completions highlight when `none` is valid (only general GPT-5.1) vs when to suggest `minimal`/`low` fallback.

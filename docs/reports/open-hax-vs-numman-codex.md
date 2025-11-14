# Report: Difference Between @orgs/open-hax/codex and @orgs/numman-ali/opencode-openai-codex-auth

Both repositories package an OpenCode plugin that swaps API-key auth for ChatGPT Plus/Pro OAuth, yet they target different user needs. Open Hax extends the original plugin with GPT-5.1 coverage, diagnostics tooling, and cache/session infrastructure, while Numman Ali's upstream project stays closer to the official Codex CLI surface area. The sections below summarize the most important divergences so you can decide which codebase to rely on.

## High-Level Comparison

| Dimension | @orgs/open-hax/codex | @orgs/numman-ali/opencode-openai-codex-auth | Practical impact |
| --- | --- | --- | --- |
| **Model catalog** | Ships the new GPT-5.1 Codex + GPT-5 legacy presets (20 variants) with tuned reasoning/text defaults and guidance on prompt caching [orgs/open-hax/codex/README.md:32-468] | Limited to 11 GPT-5 / GPT-5 Codex presets; no GPT-5.1 slugs yet, matching the historical Codex CLI options [orgs/numman-ali/opencode-openai-codex-auth/README.md:33-360] | Open Hax users can immediately experiment with GPT-5.1 models; Numman Ali users must wait for pending updates (see issue #38) or customize configs manually. |
| **Runtime internals** | Adds dedicated cache/session managers (e.g., cache warming, prompt reuse snapshots, diagnostics commands) [orgs/open-hax/codex/lib/cache/cache-warming.ts:8-151; orgs/open-hax/codex/lib/commands/codex-metrics.ts:2-195] | Core runtime centers on request normalization + CODEX_MODE bridging inside a single transformer module [orgs/numman-ali/opencode-openai-codex-auth/lib/request/request-transformer.ts:2-400] | Open Hax prioritizes cold-start avoidance and on-demand observability, trading more code for predictable latencies; upstream keeps a leaner surface with fewer moving parts. |
| **Testing & tooling** | Extends Vitest suite with cache-metric scenarios and exposes mutation testing via `pnpm test:mutation` (Stryker) [orgs/open-hax/codex/test/cache-metrics.test.ts:2-226; orgs/open-hax/codex/package.json:30-69] | Focuses tests on the request pipeline and omits mutation analysis or cache-specific suites [orgs/numman-ali/opencode-openai-codex-auth/test/request-transformer.test.ts:2-200; orgs/numman-ali/opencode-openai-codex-auth/package.json:30-64] | Open Hax users gain richer regression coverage (especially for caching), while upstream remains simpler but offers less insight into observability code paths. |
| **License & governance** | GPL-3.0-only distribution with added operational scripts (pnpm workspace) [orgs/open-hax/codex/package.json:2-69] | MIT-licensed package with npm-style workflow (package-lock) [orgs/numman-ali/opencode-openai-codex-auth/package.json:2-65] | GPL inheritance requires downstream projects to stay copyleft compliant if they ship Open Hax modifications; Numman Ali's MIT base is easier to embed commercially. |

## Detailed Findings

### Model Coverage and Defaults
- Open Hax folds in every GPT-5.1 Codex/general preset plus the historical GPT-5 lineup, documenting how to drop its `config/full-opencode.json` into either user or project config so all 20 variants (with reasoning/text defaults and prompt caching) appear in the OpenCode model selector [orgs/open-hax/codex/README.md:32-468].
- Numman Ali's README still reflects the earlier 11 GPT-5/GPT-5 Codex presets, emphasizing Codex Mini and the GPT-5 minimal/low/high tiers but lacking any GPT-5.1 references [orgs/numman-ali/opencode-openai-codex-auth/README.md:33-360]. The backlog itself acknowledges this gap via issue #38 "Hey GPT 5.1 Just Dropped" (see Backlog section).
- Implication: If you need GPT-5.1-specific reasoning modes or want prompt caching tuned for those models, only the Open Hax fork is ready out-of-the-box; the upstream project still requires manual overrides or pending PR #39.

### Runtime Architecture & Diagnostics
- Open Hax carved out `lib/cache/*` and `lib/session/*` layers to warm prompts/instructions, detect expired entries, and expose metrics snapshots; `warmCachesOnStartup` proactively fetches Codex instructions and the OpenCode prompt to avoid cold starts, recording the outcome for later inspection [orgs/open-hax/codex/lib/cache/cache-warming.ts:8-151].
- The same fork bundles chat commands intercepted before any OpenAI request. `maybeHandleCodexCommand` parses `codex-metrics` / `codex-inspect`, compiling hit rates, session stats, and cache warmth before returning an SSE response that never touches OpenAI [orgs/open-hax/codex/lib/commands/codex-metrics.ts:2-195].
- Upstream keeps the runtime concentrated in `lib/request/request-transformer.ts`, which normalizes model names, merges config, strips OpenCode system prompts, and injects CODEX_MODE/tool remap guards [orgs/numman-ali/opencode-openai-codex-auth/lib/request/request-transformer.ts:2-400]. There is no cache subsystem to reference or command router to invoke because the plugin leans on OpenCode itself for metrics.
- Implication: Open Hax is better suited when you want visibility into cache hits or need the plugin to self-heal warm caches; upstream offers a smaller attack surface if you prefer to avoid extra background work.

### Testing, Tooling, and Developer Experience
- Open Hax's cache metrics receive dedicated Vitest coverage that asserts hit/miss accounting, eviction alerts, snapshot summaries, and bridge decision metrics [orgs/open-hax/codex/test/cache-metrics.test.ts:2-226]. Combined with the `test:mutation` script and Stryker dev dependency, this indicates a desire to harden new observability code [orgs/open-hax/codex/package.json:30-69].
- Numman Ali's Vitest suite focuses on the canonical surface (normalizeModel/getModelConfig/filterInput/etc.) plus CODEX_MODE bridging, as seen in `test/request-transformer.test.ts` [orgs/numman-ali/opencode-openai-codex-auth/test/request-transformer.test.ts:2-200]. Its `package.json` lacks mutation testing or cache-specific suites, matching the leaner architecture [orgs/numman-ali/opencode-openai-codex-auth/package.json:30-64].
- For tooling, Open Hax's pnpm workspace (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) and extra script (`scripts/force-localhost.cjs`) signal integration with a multi-package environment. Upstream remains a single-package npm project (presence of `package-lock.json`).

### Licensing & Compliance Considerations
- Open Hax releases under GPL-3.0-only (see `package.json` `license`), meaning redistributors must publish derivative source if they ship plugin changes to others [orgs/open-hax/codex/package.json:2-69].
- Numman Ali's MIT license is permissive and aligns with the original community plugin terms, easing inclusion in commercial or closed-source environments [orgs/numman-ali/opencode-openai-codex-auth/package.json:2-65].
- Choose GPL if you prefer copyleft reciprocity or plan to contribute back; choose MIT if license compatibility with proprietary clients is mandatory.

### Backlog & Community Signals (Nov 14, 2025)
- `gh issue list --repo open-hax/codex --limit 3` shows that Open Hax is actively pursuing deeper diagnostics (#6 richer metrics/#5 compaction/#4 prompt cache overrides), aligning with the new cache/session subsystems.
- `gh issue list --repo numman-ali/opencode-openai-codex-auth --limit 3` highlights an enhancement ask for GPT-5.1 plus a Codex-mini bug (#36). Two open PRs (#39 aligning slugs, #37 codex-mini naming) confirm upstream is still iterating but has not merged GPT-5.1 yet.
- Interpretation: Open Hax's roadmap doubles down on observability and enterprise readiness, while upstream is racing to catch up on new models and fix regressions around Codex mini.

## Recommendations
1. **Need GPT-5.1 today, along with plugin-owned diagnostics?** Adopt @orgs/open-hax/codex despite the heavier GPL obligations and extra moving parts.
2. **Need a minimal, MIT-licensed baseline or want to stay close to the historical plugin?** Stay with @orgs/numman-ali/opencode-openai-codex-auth until its GPT-5.1 work (issue #38 / PR #39) lands.
3. **Hybrid approach:** Use Open Hax's architectural ideas (cache warming & command handlers) as upstream contributions if you want those benefits without GPL; this would require porting the relevant modules into the MIT codebase.

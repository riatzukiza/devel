# Spec: Compare @orgs/open-hax/codex and @orgs/numman-ali/opencode-openai-codex-auth

## References
- Feature set and configuration breadth for Open Hax fork: `orgs/open-hax/codex/README.md:32-468`
- Feature set and configuration breadth for Numman Ali fork: `orgs/numman-ali/opencode-openai-codex-auth/README.md:33-360`
- Cache warming + instrumentation code unique to Open Hax fork: `orgs/open-hax/codex/lib/cache/cache-warming.ts:8-151`
- Codex metrics/inspect commands (Open Hax only): `orgs/open-hax/codex/lib/commands/codex-metrics.ts:2-195`
- Cache metrics test coverage (Open Hax only): `orgs/open-hax/codex/test/cache-metrics.test.ts:2-226`
- Shared request transformation logic baseline (Numman Ali fork): `orgs/numman-ali/opencode-openai-codex-auth/lib/request/request-transformer.ts:2-400`

## Existing Issues & PRs
- `open-hax/codex` open issues (via `gh issue list --repo open-hax/codex --limit 3`): #6 richer metrics, #5 conversation compaction, #4 prompt_cache_key overrides (all feature requests dated 2025-11-14)
- `open-hax/codex` open PRs: none reported by `gh pr list --repo open-hax/codex`
- `numman-ali/opencode-openai-codex-auth` open issues: #38 "Hey GPT 5.1 Just Dropped" (enhancement), #36 "[BUG] Codex-mini doesn't work" (bug)
- `numman-ali/opencode-openai-codex-auth` open PRs (via `gh pr list --repo numman-ali/opencode-openai-codex-auth --limit 3`): #39 (align configs/docs with gpt-5.1 slugs), #37 (normalize Codex Mini naming)

## Requirements
1. Produce a detailed comparison report saved under `docs/reports/` describing:
   - Model coverage & configuration depth (GPT-5.1 vs GPT-5 only) with citations.
   - Architectural/runtime differences (cache warming, metrics command, session/cache utils, request pipeline) citing concrete files.
   - Testing/documentation breadth (number/type of spec + test files) referencing repo directories/tests.
   - Operational choices (tooling, package managers, release tooling, scripts) referencing manifest files.
   - Licensing & governance differences (GPL-3.0 vs MIT) referencing README/license sections.
   - Outstanding issues/PRs impacting divergence with links/IDs noted above.
2. Include at least one structured artifact (table or bullet comparison) plus narrative analysis describing implications for users choosing between repos.
3. Highlight gaps/opportunities (e.g., GPT-5.1 coverage missing in Numman repo or unique instrumentation available in Open Hax fork).
4. Keep tone factual and cite every major claim with inline references in the report (`path:line`).

## Definition of Done
- `/docs/reports/<descriptive-name>.md` exists, contains all required comparison sections, citations, and structured summary.
- Report references both repositories' distinguishing files and the logged open issues/PRs.
- Content reviewed for accuracy + alignment with instructions, and todos updated.

## Phases / Plan
1. **Research & Source Mapping** – Extract key differentiators from READMEs, cache/session/command modules, and request transformer baseline. Log issue/PR context (completed).
2. **Spec & Outline** – Capture requirements (this document) then outline report structure (in progress now, to guide writing).
3. **Report Drafting** – Write `docs/reports/<name>.md` with cited comparisons, table(s), and recommendations. Ensure coverage of licensing/tests/tooling.
4. **Verification** – Proofread citations, ensure todos resolved, reference spec & user request before final response.

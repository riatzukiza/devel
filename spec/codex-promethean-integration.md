# Codex ↔ Promethean Packages Integration Opportunities

## Context & Pain Points
- `orgs/open-hax/codex/lib/logger.ts:1-153` implements bespoke logging (file writes, ad-hoc console output, Opencode client piping) with env-flag toggles and manual directory management.
- Stateful fetch/session flow spans `orgs/open-hax/codex/lib/request/codex-fetcher.ts:32-105`, `orgs/open-hax/codex/lib/request/fetch-helpers.ts:44-327`, and `orgs/open-hax/codex/lib/session/session-manager.ts:1-431`, layering token refresh, prompt caching, compaction and session eviction without shared primitives.
- Prompt management/compaction code in `orgs/open-hax/codex/lib/compaction/codex-compaction.ts:1-172` and bridge orchestration in `orgs/open-hax/codex/lib/request/request-transformer.ts:1-375` duplicates adaptive routing, fallback prompts, and experimentation logic already solved elsewhere.
- Cache utilities in `orgs/open-hax/codex/lib/cache/session-cache.ts:1-115` and filesystem helpers in `orgs/open-hax/codex/lib/utils/file-system-utils.ts:8-83` reimplement TTL storage and safe writes.

## Promethean Packages With Overlap
1. **@promethean-os/logger** (`promethean/packages/logger/src/winston-logger.ts:1-184`, `.../factory.ts:1-81`) – structured logging, rotating file transports, child loggers, service tags.
2. **@promethean-os/level-cache** (`promethean/packages/level-cache/src/index.ts:1-264`) – namespaced LevelDB cache with TTL, sweep + batch helpers.
3. **@promethean-os/prompt-optimization** (`promethean/packages/prompt-optimization/src/deployment-manager.ts:1-575`) – adaptive routing, fallback templates, health/metrics for prompt experiments.
4. **@promethean-os/utils** (`promethean/packages/utils/src/retry.ts:1-55`, `.../files.ts:1-20`) – composable retry helper with pluggable backoff + safe async file IO wrappers.

## Existing Issues / PRs
- No GitHub issues or PRs currently link Codex plugin work to Promethean packages. Internal specs such as `orgs/open-hax/codex/spec/codex-compaction.md` and `orgs/open-hax/codex/spec/cache-analysis.md` highlight the same pain points but reuse is not planned yet.

## Opportunities & Requirements
1. **Replace bespoke logging with @promethean-os/logger**
   - Wire plugin bootstrap to `loggerFactory.configure` with `service: "codex-plugin"`, enabling JSON/console/file parity with the rest of Promethean.
   - Map existing `logRequest`, `logInfo`, etc. to `logger.child({ module: ... })` instances, ensuring Opencode client audit trails continue via logger hooks instead of hand-rolled fetches.
   - Requirement: preserve `ENABLE_PLUGIN_REQUEST_LOGGING` semantics by toggling logger levels/transports rather than custom booleans; emit structured metadata for request stages (stage, status, headers) so downstream Promethean monitoring can consume them.

2. **Adopt @promethean-os/level-cache for session + prompt caches**
   - Swap `codexInstructionsCache` / `openCodePromptCache` Maps for Level-backed namespaces to gain persistence across process restarts and automatic TTL sweeping (`cache.sweepExpired`).
   - Reuse `withNamespace` for session-specific histories in `SessionManager`, eliminating manual eviction logic in `session-manager.ts:300-410`.
   - Requirement: expose cache path via OpenCode config/env, ensure `prompt_cache_key` semantics stay consistent (namespacing conversation+fork), add integration tests covering restart recovery.

3. **Leverage @promethean-os/prompt-optimization for compaction + experimentation**
   - Feed serialized conversations (`serializeConversation`) into `deploymentManager.processRequest` instead of hand-crafted compaction prompts when auto-compaction/bridge decisions are needed.
   - Use template fallback/AB testing from `deployment-manager.ts:82-255` to A/B Codex bridge prompts (Codex bridge vs OpenCode defaults) without bespoke fingerprint caches (`prompt-fingerprinting.ts`).
   - Requirement: define mapping between Codex models and optimization templates, surface monitoring outputs back into plugin metrics (existing `lib/cache/cache-metrics.ts`).

4. **Centralize retry + file IO with @promethean-os/utils**
   - Wrap Codex fetch pipeline with `retry()` to handle transient 5xx/connection resets with consistent backoff rather than one-shot `fetch` (`codex-fetcher.ts:44-85`).
   - Replace `safeWriteFile` / manual `mkdirSync` blocks with `writeText`/`readMaybe` to reduce sync IO and share error handling.
   - Requirement: expose retry knobs via plugin config, ensure async rewrites do not break Vitest expectations, and keep cache-clearing CLI compatible.

## Definition of Done
- Codex plugin builds/tests (`pnpm build`, `pnpm test`) pass after introducing Promethean packages for the selected subsystems.
- New dependencies declared in `orgs/open-hax/codex/package.json` with workspace-aware version pins; lockfile updated.
- Observability parity demonstrated via structured logs or cache metrics snapshots referencing the Promethean implementations.
- Documentation updates in `orgs/open-hax/codex/docs/development/ARCHITECTURE.md` summarizing the shared components.

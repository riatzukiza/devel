# Cephalon TS import resolution for tests

## Context
Tests in `services/cephalon-ts` fail under AVA + tsx with `ERR_MODULE_NOT_FOUND` because TS source imports relative modules using `.js` extensions (e.g., `./config/policy.js`). tsx executes TS source directly, so `.js` paths do not exist.

## Requirements
- Fix module resolution for AVA + tsx when running tests against TS source.
- Keep production build behavior intact (tsup bundles `src/index.ts` and `src/cli.ts`).
- Apply minimal changes; no refactors beyond import specifier updates.
- Update spec as needed while working.

## Files and line references
Key `.js`-extension import/export locations (non-exhaustive sample set of failing paths):
- `services/cephalon-ts/src/app.ts`:11-35
- `services/cephalon-ts/src/index.ts`:1-16
- `services/cephalon-ts/src/cli.ts`:3
- `services/cephalon-ts/src/main.ts`:9-37
- `services/cephalon-ts/src/llm/tools/executor.ts`:9-12, 23-24, 157
- `services/cephalon-ts/src/llm/tools/registry.ts`:8-10
- `services/cephalon-ts/src/llm/turn-processor.ts`:16-20, 26, 31
- `services/cephalon-ts/src/llm/ollama.ts`:17, 23-31, 319, 965, 970, 1179, 1236, 1240, 1263, 1391
- `services/cephalon-ts/src/chroma/client.ts`:8-9, 217
- `services/cephalon-ts/src/sessions/manager.ts`:13, 15
- `services/cephalon-ts/src/embeddings/service.ts`:71
- `services/cephalon-ts/src/config/defaults.ts`:7
- `services/cephalon-ts/src/config/policy.ts`:24
- `services/cephalon-ts/src/core/memory-store.ts`:10-11, 320
- `services/cephalon-ts/src/core/minting.ts`:8-10
- `services/cephalon-ts/src/core/memory-factory.ts`:15
- `services/cephalon-ts/src/core/mongodb-memory-store.ts`:9, 15-16
- `services/cephalon-ts/src/context/assembler.ts`:21, 28-30
- `services/cephalon-ts/src/discord/integration.ts`:15-16
- `services/cephalon-ts/src/llm/index.ts`:7-12
- `services/cephalon-ts/src/llm/provider.ts`:14-16, 252
- `services/cephalon-ts/src/llm/message.ts`:8
- `services/cephalon-ts/src/llm/tools/types.ts`:7-10
- `services/cephalon-ts/src/prompts/index.ts`:15, 25, 36, 44
- `services/cephalon-ts/src/prompts/system-prompts.ts`:8
- `services/cephalon-ts/src/normalization/discord-message.ts`:18
- `services/cephalon-ts/src/proactive/behavior.ts`:17-20
- `services/cephalon-ts/src/proactive/meme-handler.ts`:11-12
- `services/cephalon-ts/src/ui/server.ts`:8-10

Test runner configuration:
- `services/cephalon-ts/ava.config.mjs`:4-21
- `services/cephalon-ts/package.json`:30-36 (scripts), 61-66 (devDependencies)

## Plan
Phase 1: Decide resolution strategy
- Prefer removing `.js` extensions from relative imports in `src/**` so tsx can resolve TS source.
- Avoid changing test runner unless import edits are insufficient.

Phase 2: Implement
- Update all relative import/export specifiers that end with `.js` under `services/cephalon-ts/src` to be extensionless.
- Update type-only `import("...")` specifiers in TS to extensionless where they target local modules.

Phase 3: Verify
- Run `lsp_diagnostics` on touched files.
- Run `pnpm test` in `services/cephalon-ts`.

## Existing issues/PRs
- None checked in this session.

## Definition of Done
- AVA + tsx tests no longer error with `ERR_MODULE_NOT_FOUND` for local `.js` imports.
- All updated files use `.ts` relative imports with `allowImportingTsExtensions` enabled.
- `lsp_diagnostics` clean for changed files.
- `pnpm test` passes (or failures are unrelated and noted).

## Additional Change: CEPHALON_NAME Environment Variable
Added support for dynamic Discord token lookup via `CEPHALON_NAME` environment variable.

### Changes
- `services/cephalon-ts/src/app.ts`:74-84 - Updated token lookup to use `${CEPHALON_NAME}_DISCORD_TOKEN` with fallback to `DISCORD_TOKEN`
- `services/cephalon-ts/src/main.ts`:66-74 - Same pattern applied to CLI entry point

### Usage
```bash
# Default (CEPHALON_NAME="DUCK")
export DUCK_DISCORD_TOKEN=your_token

# Custom name
export CEPHALON_NAME="MyCephalon"
export MYCEPHALON_DISCORD_TOKEN=your_token

# Generic fallback
export DISCORD_TOKEN=your_token
```

## Additional Change: Session subscriptions
Each session declares a subscription filter (defaults used for current sessions) and the event router now broadcasts to all sessions, letting filters decide.

### Changes
- `services/cephalon-ts/src/sessions/manager.ts`: createSession accepts `subscriptionFilter`; routing returns all sessions unless a specific `sessionId` is provided
- `services/cephalon-ts/src/app.ts`: default subscription filter applied to janitor and conversational sessions
- `services/cephalon-ts/src/main.ts`: default subscription filter applied to janitor and conversational sessions

## Additional Change: Ollama request queue
Added a shared request queue for Ollama with per-session serialization and global parallelism.

### Changes
- `services/cephalon-ts/src/llm/ollama-request-queue.ts`: queue implementation (maxParallel=4, maxBacklog=512, per-key=1)
- `services/cephalon-ts/src/llm/ollama.ts`: queue used for LLM requests; queueKey is sessionId
- `services/cephalon-ts/src/llm/provider.ts`: queue used for LLM requests; queueKey supported
- `services/cephalon-ts/src/llm/turn-processor.ts`: passes queueKey
- `services/cephalon-ts/src/embeddings/service.ts`: embeds go through queue
- `services/cephalon-ts/src/chroma/client.ts`: embed/search accept queueKey
- `services/cephalon-ts/src/llm/tools/types.ts`: ToolDependencies includes sessionId
- `services/cephalon-ts/src/llm/tools/executor.ts`: passes sessionId to handlers
- `services/cephalon-ts/src/llm/tools/registry.ts`: memory.lookup uses queueKey

## Additional Change: TypeScript config
- `services/cephalon-ts/tsconfig.json`: moduleResolution set to bundler; allowImportingTsExtensions enabled

# Pantheon REPL ask compatibility plan

## Prompt summary

- Ensure Pantheon Lisp REPL `(ask ...)` works with both `opencode` and `openai` harnesses using the same agent instruction files.
- Support OpenAI-compatible endpoints (zen) via environment map and use AGENTS.md-style instructions for both harnesses.
- Add e2e tests covering the sample forms provided in the request.

## Relevant code & docs

- `src/repl.ts` lines ~1-210: ask parsing, provider selection, openai/opencode implementations.
- `README.md` lines ~1-850: project overview and CLI references.
- AGENTS docs: `./AGENTS.md` and package-specific `AGENTS.md` patterns referenced in instructions.

## Existing issues / PRs

- None observed locally.

## Requirements

- Parse `:environment { :OPENAI_COMPATABLE_API "..." }` in `(ask ...)` forms.
- Load instruction files (including globs like `./packages/*/AGENTS.md`) and apply them consistently for both `opencode` and `openai` harnesses.
- Allow OpenAI harness to use OpenAI-compatible endpoint (zen) through the same ask form.
- Provide end-to-end tests that execute the two sample `(ask ...)` expressions without hitting real services (mocked providers) and verify streaming output handling.

## Definition of done

- REPL ask parser and providers handle environment map and instruction files; OpenAI provider uses compatible base URL when provided.
- Instructions from files are combined into the agent/system text for both harnesses.
- Two new AVA e2e tests cover opencode and openai harness usage with the provided sample forms and pass with mocked dependencies.
- Build/tests succeed locally (or documented if not run).

## Change log

- Added instruction glob loading and environment parsing to `src/repl.ts` for opencode/openai harnesses.
- Introduced injectable provider overrides plus `executeAsk` helper for testability.
- Added AVA E2E coverage for opencode and openai harness flows (including instruction glob patterns) in `src/tests/repl/ask-e2e.test.ts`.
- Documented how to run the OpenAI harness against a local Ollama endpoint in `README.md`.
- Adjusted AVA config to treat experimental packages as roots and added entrypoint smoke test to improve coverage and fix `pnpm --filter @promethean-os/pantheon coverage`.

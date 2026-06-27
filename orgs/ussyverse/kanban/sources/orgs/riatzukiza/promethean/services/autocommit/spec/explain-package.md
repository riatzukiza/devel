# Explain @promethean-os/autocommit

## Request
Provide a clear explanation of what this package does, how it works, and how to use it.

## Code references
- src/index.ts:1-401 — main autocommit service: config validation, PM2 action wiring, watcher + scheduler, commit flow, fallback messaging.
- src/cli.ts:1-34 — CLI definition and option parsing; kicks off `start` with parsed config.
- src/config.ts:1-90 — zod schema, defaults from env, coercion and validation for path, API, model, debounce, diff limits, exclude, signoff, dry-run.
- src/git.ts:1-159 — git helpers: repo detection, submodules, status/diff gathering, commit creation, message sanitization.
- src/llm.ts:1-114 — chat completion client: safe headers, request body creation, response validation, error handling.
- src/messages.ts:1-20 — system/user prompts for Conventional Commit generation.
- src/constants.ts:1-43 — defaults and limits for debounce, diff size, commit message constraints.
- src/tests/* — ava tests covering config validation, git helpers, LLM client behavior, and simple smoke tests.

## Existing issues / PRs
- Not reviewed in this session.

## Definition of done
- Deliver a concise package explanation covering purpose, key features, architecture flow, CLI usage, safety mechanisms, defaults, and dependencies, referencing the code above. No code changes required.

## Requirements
- Keep explanation self-contained and actionable for new users.
- Highlight defaults (LLM base URL/model, debounce, diff limits) and safety behaviors (ignore patterns, fallback commit message generation).
- Mention PM2 action support and multi-repo/submodule handling.

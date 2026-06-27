# Smoke test integration plan

## Requirements
- provide a minimal OpenCode plugin tool that the smoke test can trigger; it must live in `.opencode/plugins/` so the CLI loads it automatically.
- add infrastructure (`package.json`, `.gitignore`) describing how to install/develop the plugin and smoke test runner.
- create `scripts/smoke-test.mjs` that launches `opencode run` with `--format json`, supplies a deterministic prompt asking for the custom tool, and watches the resulting JSON stream for the `tool.execute.after` event to prove the tool was called.
- document how to run the smoke test, what the custom tool returns, and what to expect from the JSON output.

## Code files referenced
- `.opencode/plugins/smoke-tool.js` – defines the tool (exports `smokeTool` via `@opencode-ai/plugin`).
- `package.json` – lists dependencies (`@opencode-ai/plugin`) and a `test:smoke` script that kicks off the smoke test runner.
- `scripts/smoke-test.mjs` – orchestrates `opencode run` and inspects its JSON stream.
- `README.md` – describes the tool, how to run the smoke test, and how to interpret the JSON log.

## Definition of done
- The repo has a functioning custom tool plugin and the smoke-test script can parse `opencode run --format json` output, exiting non-zero when the expected tool event is missing.
- Documentation explains the tool’s behavior, the expected JSON event, how to install dependencies, and how to run the smoke test.

## Phases
1. Add package metadata, dependencies, `.opencode/plugins/` directory, and `.gitignore` entries so the plugin and node code can live in the repo.
2. Implement the custom `smokeTool` plugin via `@opencode-ai/plugin` and ensure it exports through `.opencode/plugins/`.
3. Create `scripts/smoke-test.mjs` that spawns `opencode run`, watches the NDJSON stream for the `tool.execute.after` event, and fails if the tool never fires.
4. Update `README.md` with usage instructions for the tool and smoke test.

# Documentation and Graph Run

- Goal: produce user-facing documentation for @promethean-os/knowledge-graph and demonstrate it by building a graph for this repository.
- Code refs: README.md:3 (package summary), README.md:35 (CLI quickstart), src/cli.ts:94 (build command), src/cli.ts:195 (mermaid export), src/cli.ts:210 (CLI usage text), src/builder.ts:14 (repository graph build orchestration), src/builder.ts:60 (single file processing), src/builder.ts:82 (extracted data handling), src/builder.ts:294 (path validation helpers).
- Existing issues: not reviewed in this session.
- Existing PRs: not reviewed in this session.
- Requirements:
  - Add concise documentation explaining what the tool does, how to install, and how to run the CLI and mermaid export.
  - Run the CLI to build a graph for the current repository and note the result/location of outputs.
- Definition of done: documentation file added/updated with usage steps and options; CLI build executed successfully on this repo with output recorded (path to DB/graph noted); no broken builds/tests introduced.
- Progress log: ran `pnpm --filter @promethean-os/knowledge-graph run cli -- build <repo>` after workspace install; native binding for better-sqlite3 was missing, attempted `pnpm rebuild better-sqlite3` and manual install script.
- Blocker: better-sqlite3@8.7.0 fails to compile against Node v22.18.0 (SetAccessor signature change), so the CLI run still fails. Likely needs Node 22.20 with a compatible prebuild or a bump to a Node 22-compatible better-sqlite3 release.
- New run (after switching to node:sqlite): `pnpm --filter @promethean-os/knowledge-graph run cli build <repo>` succeeds; database written to `knowledge-graph.db`. Builder logged 9 import-path validation errors (files under src/* and test-security.js) due to safety checks, but overall build completed with successCount=30, errorCount=9.
- Research: community reports (e.g., actualbudget/actual#3946) indicate better-sqlite3 >=11.7.0 builds on Node 22/23 after V8 API changes; older 8.x/9.x fail. Alternatives: switch to Node’s built-in `node:sqlite` (added v22.5, async API) or use a different SQLite client like `sqlite3`/`better-sqlite3` upgrade.

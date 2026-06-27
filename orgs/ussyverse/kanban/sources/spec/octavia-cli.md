---
uuid: 2c85be73-882f-4f6a-849f-c36105d2d4c2
title: "Octavia CLI (\"octavia\")"
slug: octavia-cli
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.408448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Octavia CLI ("octavia")

## Context & Inputs
- Request (err 8:29 PM) requires a Commander-based wrapper CLI named `octavia` that can execute pm2, pnpm, bun, opencode, uv, git, Promethean CLIs (kanban, autocommit, pipelines/piper, opencode-client) plus every script/bin under the project tree.
- Bootstrap instructions from `system/README.md:33-110` highlight the existing automation stack and pm2 process expectations.
- LMDB persistence utilities exist at `orgs/riatzukiza/promethean/packages/lmdb-cache/src/cache.ts:2-303` (exposes `openLmdbCache`).
- Root `package.json:2-56` already depends on Commander and is the launch point for new bins.

## Planned Files / Changes
1. `package.json`
   - Add `@promethean-os/lmdb-cache` workspace dependency.
   - Define a `bin` entry mapping `octavia` → `dist/octavia/index.js` and add supporting build script plus `postinstall` hook to compile it.
   - Add focused scripts (`build:octavia`, `test:octavia`) so `pnpm build`/`pnpm test` exercise the CLI and its e2e coverage.
2. `src/octavia/types.ts` (new)
   - Shared types: `DiscoveredCommand`, `CommandSource`, `IndexRecord`, etc.
3. `src/octavia/fs-utils.ts` (new)
   - Recursive directory walk with ignore list (`.git`, `node_modules`, `dist`, `.pnpm-store` etc.).
   - Helpers to detect `scripts`/`bin` directories, package.json discovery, and Commander detection regex.
4. `src/octavia/indexer.ts` (new)
   - Main discovery routine: collects tool wrappers plus every script/bin entry, extracts package.json scripts, inspects Commander files for subcommands, writes `index.jsonl` (project root), seeds LMDB cache under `.octavia/cache`.
   - Calculates alias set (full path, minimal unique tokens, package-script notation, globally unique script names).
5. `src/octavia/cache.ts` (new)
   - Thin wrapper around `openLmdbCache` providing `getCommand`, `setCommand`, namespace management, and convenience for storing index metadata (last scan time, version, root hash).
6. `src/octavia/completion.ts` (new)
   - Generates bash completion script from cached command list + Commander declarations (including nested subcommands extracted during indexing).
7. `src/octavia/runner.ts` (new)
   - Resolves CLI invocation into an executable by matching selector tokens against alias sets, constructs the process command (respecting shebangs, `.ts`/`.mjs` requiring `bun` or `tsx`, package.json scripts via pnpm, built-in binaries like pm2/pnpm/bun/opencode/uv/git), and spawns it.
8. `src/octavia/index.ts` (new entry point)
   - Commander CLI with commands: `run [selector]`, `list`, `refresh`, `completion`, `which`, `info`.
   - On startup, ensures cache/index exist (runs discovery if missing/stale).
   - Wires `run` to `runner.ts`, `refresh` to `indexer.ts`, and `completion` to `completion.ts`.
9. `index.jsonl` (generated artifact in repo root) documenting each command; contents appended/overwritten by discovery step (not committed but spec notes location).
10. `tsconfig.octavia.json`
    - Thin project config compiling only `src/octavia/**` into `dist/octavia/**` so the bin stays buildable even though the monorepo-wide `tsconfig` fails on unrelated Bun/Nx files.
11. `tests/octavia.e2e.test.ts`
    - Mock workspace generator + assertions verifying discovery, alias resolution, and execution across bash/node/package-script targets.

## Functional Requirements
- First execution of `octavia` triggers a discovery pass:
  - Walk entire repository to identify files inside `scripts/` or `bin/` directories (any depth) plus selected package paths (kanban/bin, pipelines/piper, opencode-client, autocommit) and root-level wrappers (pm2, pnpm, bun, opencode, uv, git).
  - For each `package.json`, index `scripts` section using notation `<package-path>:<script-name>`.
  - Extract Commander subcommands from Node scripts importing `commander` (regex for `.command('sub')`, `.addCommand`).
  - Write `index.jsonl` at `<repo>/octavia.index.jsonl` (or `index.jsonl` if mandated) containing metadata rows (id, relative path, command type, alias list, runtime, commanderSubcommands?).
  - Populate LMDB cache under `<repo>/.octavia/cache` storing command metadata keyed by alias for quick lookup.
- Command resolution:
  - Accept selectors comprised of whitespace or `/` separated tokens. Determine candidate commands whose alias sets contain all tokens sequentially (with support for `package.json` + script names and globally unique script names). If multiple matches remain, prompt user with ranked list.
  - Provide wrappers for pm2/pnpm/bun/opencode/uv/git by default even without scanning.
- Execution semantics:
  - Determine runner: Node `.ts/.tsx` (use `bunx tsx` or `bun run`), `.mjs/.js` (use `node` or `bun`), shell scripts (respect shebang), package.json scripts (use `pnpm run <script>` in that directory), binary files (spawn directly), `pm2/pnpm/bun/...` (spawn via PATH) or `pnpm --filter` for workspace packages when scanning explicitly named packages.
  - Forward extra args (via `--` handling) to underlying command.
  - Surface command errors with exit code + captured stderr.
- Autocompletion:
  - Provide `octavia completion` that prints bash script hooking into `_octavia` and uses cached alias list plus Commander subcommands for suggestions.
- Refresh/listing:
  - `octavia refresh` forces re-index (rewrites JSONL/cache), `octavia list [--json]` prints available commands with alias/resolution hints.

## Definition of Done
1. New Commander CLI `octavia` builds, exposes `octavia` binary via `pnpm dlx`/`pnpm octavia` (bin entry works after `pnpm install`).
2. First invocation creates `index.jsonl` and `.octavia/lmdb` directory at repo root populated with command metadata; repeated runs reuse cache unless `refresh` is invoked or tree hash changes.
3. CLI can resolve and execute at least:
   - Top-level wrappers (`octavia pm2 <args>`, `octavia pnpm <args>`, `octavia bun <args>`, `octavia git <args>`, `octavia uv <args>`, `octavia opencode <args>`).
   - Scripts located under `orgs/riatzukiza/promethean/packages/kanban/bin/`, `orgs/riatzukiza/promethean/packages/autocommit/src/cli.ts`, `orgs/riatzukiza/promethean/packages/pipelines/piper/`, and `orgs/riatzukiza/promethean/packages/opencode-client/src/cli.ts` using minimal selector tokens.
   - Package.json script invocation via `<package-path>:<script>` selectors.
4. Autocomplete script generation surfaces all indexed aliases/subcommands, including Commander-derived subcommands when available.
5. Automated coverage via `pnpm run test:octavia` provisions a mock mixed-language workspace, runs `discoverAndPersist`, and executes representative commands (shell, Node, package scripts) to prove the CLI works end-to-end.
6. Unit tests (`tests/octavia.unit.test.ts`) exercise selector resolution edge cases (unique, nested, ambiguous, missing) so vitest can guard alias logic before running e2e.
7. Coverage and mutation workflows (`pnpm run test:octavia:coverage` with `c8` + `pnpm run stryker:octavia`) report metrics for the CLI and run against the same Vitest suite configured via `vitest.config.ts`.

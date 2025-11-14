# Workspace Cleanup & Submodule Commit Plan

## Summary
- User request: stage and commit every outstanding change across the entire git-submodule hierarchy, keeping commits logically grouped and pushing upstream once clean.
- Scope covers `.emacs.d`, `orgs/riatzukiza/book-of-shadows`, `orgs/riatzukiza/openhax`, `orgs/riatzukiza/promethean` (and nested `packages/mcp`), and `orgs/sst/opencode`, plus fixing the broken nested submodule mapping under `orgs/riatzukiza/stt`.
- Submodule `orgs/riatzukiza/stt` ultimately removed at the user's request to avoid recurring pointer errors.

## Code References
- `.emacs.d/elgrep-data.el:1-2` — new elgrep call list stub that needs tracking or explicit ignore decision.
- `orgs/riatzukiza/book-of-shadows/docs/notes/2025.08.15.*.md:1+` — three dated note files staged for deletion.
- `orgs/riatzukiza/openhax/.gitignore:19-22` and `.clj-kondo/**`, `.cpcache/**`, `.lsp/.cache/db.transit.json` — cached analyzer artifacts removed from source control and ignored going forward.
- `orgs/sst/opencode/.gitignore:16` plus `logs/*.log` (e.g. `logs/.2c5480b...json`, `logs/mcp-puppeteer-2025-10-07.log`) — add `logs/` ignore and drop tracked log files.
- `orgs/riatzukiza/promethean/package.json:130-134` and `package-list.json:135-140` — remove the upstream `mcp-auth` dependency after in-repo implementation.
- `orgs/riatzukiza/promethean/packages/pantheon/mcp/src/index.ts:65-75,216-220` — stop defaulting MCP tool handlers to a stub so missing handlers surface immediately.
- `orgs/riatzukiza/promethean/spec/mcp-oauth-fastify-fix.md#L1-L72` and `spec/mcp-oauth-login.md#L1-L38` — documentation describing the OAuth fix and validation plan that must ship with the code.
- `orgs/riatzukiza/promethean/packages/mcp/src/auth/oauth/routes.ts:5-370` — Fastify cookie typing import, safer cookie helpers, redirect signature updates, and unused parameter cleanup.
- `orgs/riatzukiza/promethean/packages/mcp/src/auth/ui/oauth-login.ts:45-480` — rename internal handlers, register global window hooks, and propagate callback successes/errors through `handleOAuthCallback`.
- `orgs/riatzukiza/promethean/packages/mcp/src/config/auth-config.ts:251-310` — standardize configuration to the `OAUTH_` prefix and tighten admin whitelist parsing.
- `orgs/riatzukiza/promethean/packages/mcp/src/core/transports/fastify.ts:795-810` — switch Fastify transport toggle to the unified `OAUTH_ENABLED` flag.
- `orgs/riatzukiza/promethean/packages/mcp/src/types/fastify-cookie.d.ts:1-22` — local Fastify cookie type augmentation needed for the route helpers.

## Existing Issues / PRs
- No open issues or PRs found covering this workspace-wide cleanup. The provided spec files already capture the MCP OAuth fix context.

## Requirements
1. Decide whether `.emacs.d/elgrep-data.el` should be tracked; if so, commit with appropriate metadata, otherwise add to ignore list.
2. Remove stale dated notes from `book-of-shadows` if they are meant to be pruned, and ensure no accidental data loss.
3. Delete analyzer caches (`.clj-kondo`, `.cpcache`, `.lsp`) from `openhax` and extend `.gitignore` so they stay untracked.
4. Purge committed log files from `orgs/sst/opencode`, add `logs/` to `.gitignore`, and verify no tooling depends on those artifacts.
5. Land Promethean root updates dropping the `mcp-auth` dependency, updating changelog/docs/specs, and regenerating `ecosystem.config.enhanced.mjs`.
6. In the nested `packages/mcp` repo, include both source and generated `dist/**` artifacts for the OAuth fixes, along with the new `.env.example` template and Fastify cookie types.
7. Ensure `.env` (real secrets) remains ignored while `.env.example` is tracked.
8. Repair the missing `orgs/riatzukiza/stt/opencode-feat-clojure-syntax-highlighting` submodule metadata so recursive status commands no longer fail.
9. After each repo commit, push to its upstream branch (`develop`, `main`, `devel/hacks`, `promethean/dev`, etc.) and finally update/push the root superproject pointers.

## Definition of Done
- `git status -sb` is clean inside every affected submodule and the superproject.
- `git submodule foreach --recursive git status` runs without errors (no missing URL complaints).
- All commits are pushed to their respective tracking branches and origin reports no divergence.
- `.env` remains local-only while `.env.example` is in source control.
- Document/spec updates accompany code changes so future readers understand the OAuth migration.
- Root repository HEAD includes updated submodule SHAs covering each cleaned child repo.

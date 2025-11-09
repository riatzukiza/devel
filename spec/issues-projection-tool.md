# Issues & PR Projection Tool

## Context
- User needs a local mirror of every GitHub issue/PR for all repos tracked under `orgs/**`, organized under `issues/org/<remote>/<number>-<slug>/`.
- Existing scripts cover other automations (e.g., `src/hack.ts:1-169` for repo/worktree scanning) but nothing aggregates GitHub discussions.
- The workspace already exposes repo metadata via `.gitmodules` for paths such as `orgs/riatzukiza/promethean` and `orgs/moofone/codex-ts-sdk`.
- `package.json:6-23` contains runnable scripts that should expose this new tool for `bun run` / `pnpm` workflows.

## Code References
- `package.json:6-23` — add a `issues:project` script/s to execute the projector with Bun.
- `src/` root — house new module `src/issues/projector.ts` plus helper files (e.g., `src/issues/renderers.ts`).
- `.gitmodules:1-43` — authoritative list of submodules to derive remote owner/repo pairs.

## Existing Issues / PRs
- No tracked GitHub issue or PR; feature requested directly by workspace owner.

## Definition of Done
1. CLI scans every repo under `orgs/**`, derives the GitHub owner/repo, and fetches both issues and pull requests (open + closed) via authenticated API calls.
2. For each issue/PR, tool writes `thread.md` containing metadata, body, and chronological conversation mirroring GitHub.
3. For each pull request review, tool writes `reviews/<review-id>.md` that interleaves review comments with the exact code context referenced on GitHub.
4. Every changed file in a PR receives a projection under `files/<path>.md` containing the diff plus inline review comment anchors.
5. Directory layout is deterministic (`issues/org/<owner>/<repo>/<type>/<number>-<slug>/...`) and idempotent (reruns update existing files only when content changes).
6. Tool exits non-zero if the GitHub token is missing or a repo lacks a reachable remote, preventing silent partial mirrors.
7. Documentation in the spec + README section explains usage and prerequisites (token, rate limits).

## Requirements
1. Discover repos: parse `.gitmodules` and/or scan `orgs/**` for `.git` links; resolve remotes and normalize owner/repo names (handle SSH + HTTPS patterns).
2. Fetch data: use Octokit (REST v3) or `gh api` to retrieve issues, comments, pull requests, reviews, review comments, and diffs with pagination + state filters.
3. Rendering: convert fetched payloads to Markdown with timestamps, authors, and quoting. Maintain consistent heading hierarchy and escape code fences.
4. Review projection: for every review (not just top-level PR comments), create dedicated Markdown showing file path, diff hunk, and inline comments in order.
5. Diff projection: store each file diff (unified patch) and weave inline comments around the affected lines so local browsing matches GitHub.
6. Output management: ensure directories are created lazily, clean invalid characters from slugs, and support `--clean` / `--force` options for regeneration.
7. CLI ergonomics: implement arguments for `--repo <owner/name>`, `--type issues|prs`, `--limit`, `--state`, and `--output issues/org` with sane defaults.
8. Error handling/logging: surface per-repo failures, continue other repos, and summarize successes/failures at the end.
9. Tests (where feasible): add unit coverage for slugging, remote parsing, and Markdown rendering; document manual test steps for live API interactions.

## Phased Plan

### Phase 1 — Discovery & Configuration
- Build module to enumerate submodule paths (parse `.gitmodules` or glob `orgs/*/*/.git`).
- Implement remote parser that returns `{ host, owner, repo }` for SSH/HTTPS URLs, with validation + helpful errors.
- Expose CLI arguments + configuration loading (env vars for token, output root, concurrency limits).

### Phase 2 — GitHub Data Fetching
- Introduce Octokit client with retry + pagination helpers; respect `GITHUB_TOKEN`.
- Implement fetchers:
  - `collectIssues(owner, repo)` → issues + comments
  - `collectPullRequests(owner, repo)` → PR metadata, timeline notes, reviews, review comments, diff patches
- Normalize JSON payloads into internal types (IssueThread, PullRequestProjection, ReviewProjection, FileDiffProjection).

### Phase 3 — Rendering Pipeline
- Implement Markdown renderer for threads (metadata header, body, comments with timestamps + author handles + reactions if available).
- Create review renderer that stitches inline comments with diff context (grab patch via `original_position`/`path`).
- Generate per-file diff projections that embed inline comments at the closest matching hunk line.
- Ensure deterministic ordering and stable filenames (`<number>-<slug>` sanitized).

### Phase 4 — Orchestration & Output
- Walk repos sequentially or with limited concurrency; write `thread.md`, `reviews/<id>.md`, and `files/<path>.md` under `issues/org/<owner>/<repo>/<kind>/`.
- Implement change detection (skip writes when content unchanged) and summary logging per repo.
- Add README section plus new npm script; document manual invocation + environment requirements.
- Provide test coverage / manual verification notes.

## Open Questions
1. Should projections include historical timeline events (label changes, state changes) or just conversation comments? (Assume conversation-only unless clarified.)
2. How should very large repos (hundreds of issues) be scoped? Need pagination limit flag to avoid rate-limit exhaustion.
3. Do we need to mirror attachments (images) locally or just preserve URLs? Current assumption: keep markdown references only.
4. Should closed / merged PR diffs capture the merge commit diff or the head patch? We'll use `octokit.pulls.get` with `mediaType: diff` for the head.

# Agent: Issues Projector

## Goal
Automate projection of GitHub issues and PRs from submodules into the local workspace, mirroring repository state for tracking and review.

## Scope
- Work with `src/issues/projector.ts` and issue/PR data across `orgs/**`
- Project issues, PRs, and their metadata into structured markdown files
- Filter by repo, type (issues/prs), state (open/closed), and limit count

## Workflow Hints
- **CLI Options**: `--repo`, `--type` (all/issues/prs), `--state` (open/closed/all), `--limit`, `--clean`
- **Output Structure**: `issues/org/<owner>/<repo>/issues/<number>-<slug>/thread.md`
- **PR Reviews**: Stores review comments in `reviews/<review-id>.md` interleaved with diffs
- **File Diffs**: Each file in PR has `files/<path>.md` with patch and inline annotations
- **GitHub Token**: Requires `GITHUB_TOKEN` environment variable with `repo` scope
- **Rate Limits**: Octokit handles rate limits; use pagination for large repos

## Repository Pointers
- Issues projector: `src/issues/projector.ts`
- Issue thread rendering: `renderIssueThread`, `renderIssueComment`, `renderPullRequestProjection`
- PR review handling: `renderReviewProjection`, `renderReviewComment`
- File diff rendering: `renderFileDiff`

## Required Skills (Use When Applicable)
- `.opencode/skills/github-integration.md`

## References
- Issues projector CLI options in `CliOptions` type definition
- Output format specification in projector output
- GitHub API integration using Octokit

## Common Workflows

### Project All Issues and PRs
```bash
# Project everything for all tracked repos
GITHUB_TOKEN=<token> pnpm issues:project

# Clean output first
GITHUB_TOKEN=<token> pnpm issues:project -- --clean
```

### Project Only Issues
```bash
# Project issues only
GITHUB_TOKEN=<token> pnpm issues:project -- --type issues

# Project open issues only
GITHUB_TOKEN=<token> pnpm issues:project -- --type issues --state open

# Limit to 50 issues
GITHUB_TOKEN=<token> pnpm issues:project -- --type issues --limit 50
```

### Project Only Pull Requests
```bash
# Project PRs only
GITHUB_TOKEN=<token> pnpm issues:project -- --type prs

# Project merged PRs only
GITHUB_TOKEN=<token> pnpm issues:project -- --type prs --state closed

# Limit to 10 newest PRs
GITHUB_TOKEN=<token> pnpm issues:project -- --type prs --limit 10 --state open
```

### Project Specific Repository
```bash
# Project only promethean issues
GITHUB_TOKEN=<token> pnpm issues:project -- --repo riatzukiza/promethean --type issues

# Project open PRs for codex-ts-sdk
GITHUB_TOKEN=<token> pnpm issues:project -- --repo moofone/codex-ts-sdk --type prs --state open
```

## Output Structure
```
issues/org/<owner>/<repo>/
  issues/<number>-<slug>/
    thread.md              # Mirrored GitHub conversation
  prs/<number>-<slug>/
    thread.md              # PR thread with reviews
    reviews/<review-id>.md # Review comments with diff hunks
    files/<path>.md        # Per-file diffs with annotations
```

## Important Constraints
- **Repository Discovery**: Discovers all tracked submodules under `orgs/`
- **Slugify**: Converts issue titles to URL-safe slugs for folder names
- **Clean Flag**: Removes output root before projection to avoid stale data
- **Pagination**: Uses GitHub API pagination for large repositories
- **Rate Limits**: Octokit automatically handles GitHub API rate limits
- **Private Repos**: Requires proper token with `repo` scope for private repos

## Data Models
- **IssueThread**: Number, title, state, url, author, labels, assignees, milestone, body, comments
- **IssueComment**: ID, body, createdAt, updatedAt, author
- **PullRequestProjection**: Full PR with reviews, comments, files
- **ReviewProjection**: Review state, body, submittedAt, author, comments
- **ReviewComment**: Review ID, position, path, diffHunk, line, body, author

## Error Handling
- **Missing Token**: Exits with error if `GITHUB_TOKEN` not set
- **No Repos**: Exits with error if no matching repos found
- **Network Errors**: Octokit handles transient errors; fails fast on persistent failures
- **Invalid Options**: Validates repo, type, state options
- **Missing Repo**: Gracefully skips repos without matching data

# OpenCode Command: issues-project

```yaml
name: issues-project
description: Project GitHub issues and PRs into the workspace
usage: |
  ## Usage
  pnpm issues-project [options]

  ## Options
  --repo <repo> (optional): Specific repository to project (e.g., riatzukiza/promethean)
  --type <type> (default: "all"):
    - "all": Project both issues and PRs
    - "issues": Project only issues
    - "prs": Project only PRs
  --state <state> (default: "open"):
    - "open": Open issues/PRs only
    - "closed": Closed issues/PRs only
    - "all": All issues/PRs
  --limit <n> (optional): Limit number of issues/PRs
  --clean (optional): Clean output directory before projection

  ## Required Environment
  GITHUB_TOKEN: GitHub token with repo scope

  ## Examples
  pnpm issues-project
  pnpm issues-project --repo riatzukiza/promethean
  pnpm issues-project --type issues --state open
  pnpm issues-project --type prs --limit 10 --state open
  pnpm issues-project --clean
```

name: pr-mirror
description: Mirror PRs between sst/opencode and riatzukiza/opencode
usage: |
  ## Usage
  pnpm pr-mirror

  ## Description
  This command:
  1. Syncs dev branches between both remotes
  2. Creates mirror PRs for any open PRs that don't exist in target repo

  ## Required Remotes
  - origin: sst/opencode
  - riatzukiza: riatzukiza/opencode

  ## Examples
  pnpm pr-mirror

  ## Notes
  - Requires both remotes configured with correct authentication
  - Uses force push for dev branch sync (safe for mirrors)
  - Only mirrors PRs created by riatzukiza user in source repo
```

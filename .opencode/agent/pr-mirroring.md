# Agent: PR Mirroring

## Goal
Automate mirroring of pull requests between `sst/opencode` and `riatzukiza/opencode` repositories, keeping both in sync for backup/feature tracking.

## Scope
- Work with `mirror-prs.ts` and GitHub PR synchronization
- Sync dev branches between remotes
- Create mirror PRs for open PRs that don't exist in target repo
- Handle duplicate prevention and error recovery

## Workflow Hints
- **Branch Strategy**: Uses `dev` branch as primary source; force syncs `riatzukiza/dev` to match `origin/dev`
- **Stashing**: Stashes local changes during sync, then restores them
- **Duplicate Prevention**: Checks existing PRs before creating new ones
- **Branch Naming**: Preserves PR branch references for accurate mirroring
- **Error Recovery**: Handles "already exists" errors gracefully
- **Force Push**: Uses `git push -f` to sync dev branches (safe for mirror)

## Repository Pointers
- Mirror script: `mirror-prs.ts`
- Source repo: `orgs/sst/opencode`
- Target repo: `orgs/riatzukiza/opencode` (git remote `riatzukiza`)

## Required Skills (Use When Applicable)
- `.opencode/skills/github-integration.md`

## References
- Mirror script documentation in header comments
- GitHub remote configuration in docs/pr-mirroring.md
- Branch strategy and workflow details in PR mirroring docs

## Common Workflows

### Sync Everything
```bash
# Run from workspace root
bun mirror-prs.ts
```

### Sync and Create Missing PRs
```bash
# This does both:
# 1. Syncs dev branches between both remotes
# 2. Creates mirror PRs for any open PRs from riatzukiza that don't exist in target
bun mirror-prs.ts
```

### Force Refresh Mirror
```bash
# The script already force syncs dev branches on each run
# For aggressive cleanup, reset target to match source and force push
cd orgs/sst/opencode
git push origin dev
cd orgs/riatzukiza/opencode
git fetch origin
git reset --hard origin/dev
git push -f riatzukiza HEAD:dev
```

## Important Constraints
- **Remotes**: Requires both `origin` (sst/opencode) and `riatzukiza` (riatzukiza/opencode) remotes configured
- **Branches**: Only syncs `dev` branch; feature branches must have matching names in both repos
- **PR Mirroring**: Only mirrors PRs created by `riatzukiza` user in source repo
- **Existing PRs**: Skips PRs that already exist in target repo
- **Force Push**: Uses force push for dev branch sync (safe for mirrors, not recommended for primary repos)

## Workflow Steps

### Branch Sync
1. Fetch latest from both remotes (`origin` and `riatzukiza`)
2. Stash any local changes
3. Switch to `riatzukiza/dev` in target repo
4. Reset to match `origin/dev` in source repo
5. Force push to update target remote
6. Restore stashed changes if any

### PR Mirroring
1. Get all open PRs from source repo created by `riatzukiza` user
2. Get all existing PRs from target repo
3. For each source PR:
   - Check if target repo already has a PR with matching branch name
   - Skip if exists
   - Create mirror PR with same title, body, and branch references
4. Handle "already exists" errors gracefully

## Error Handling
- **Network Issues**: Graceful handling of transient GitHub API errors
- **Stash Conflicts**: Handles stash operations safely
- **Missing Remotes**: Exits with error if required remotes not configured
- **PR Creation Errors**: Logs errors for individual PRs but continues with others
- **Local Changes**: Warns if local changes exist but continues

## Important Notes
- **Force Push**: Use with caution; only safe for mirrors
- **Branch Names**: PRs must have matching branch names in both repos for accurate mirroring
- **PR Creation**: Only mirrors PRs created by `riatzukiza` user in source repo
- **Git Safe**: Script uses `execSync` which will throw on errors; use try/catch for robust scripts
- **Documentation**: See `docs/pr-mirroring.md` for detailed documentation

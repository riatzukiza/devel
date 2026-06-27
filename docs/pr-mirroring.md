# PR Mirroring: sst/opencode ↔ riatzukiza/opencode

This document describes the process for mirroring pull requests between the sst/opencode and riatzukiza/opencode repositories.

## Overview

The mirroring setup maintains synchronization between:
- **Source**: `sst/opencode` (primary development repository)
- **Mirror**: `riatzukiza/opencode` (personal fork for backup/feature tracking)

## Repository Configuration

### Remote Setup

The sst/opencode repository has two remotes configured:

```bash
# In orgs/sst/opencode
git remote -v
origin          git@github.com:sst/opencode.git (fetch)
origin          git@github.com:sst/opencode.git (push)
riatzukiza      git@github.com:riatzukiza/opencode.git (fetch)
riatzukiza      git@github.com:riatzukiza/opencode.git (push)
```

### Branch Strategy

- **`origin/dev`**: Primary development branch (source of truth)
- **`riatzukiza/dev`**: Mirror of origin/dev, kept in sync via force push
- **Feature branches**: Created in both repos with same names for PR mirroring

## Automation Script

### Location
`/home/err/devel/mirror-prs.ts`

### Usage

```bash
# Run from anywhere in the workspace
bun mirror-prs.ts
```

### What the Script Does

1. **Syncs dev branches**:
   - Fetches latest from both remotes
   - Stashes any local changes
   - Resets `riatzukiza/dev` to match `origin/dev`
   - Force pushes to keep mirror in sync
   - Restores stashed changes

2. **Mirrors open PRs**:
   - Gets all open PRs by riatzukiza from sst/opencode
   - Checks if mirror already exists on riatzukiza/opencode
   - Creates new mirror PRs for any missing ones
   - Preserves PR title, body, and branch references

3. **Avoids duplicates**:
   - Checks existing PRs before creating new ones
   - Handles "already exists" errors gracefully

### Script Features

- **Error handling**: Graceful handling of network issues and conflicts
- **Progress reporting**: Clear console output showing each step
- **Safe stashing**: Preserves local work during sync
- **Duplicate prevention**: Won't create PRs that already exist

## Manual PR Mirroring

When creating a PR manually, follow this format:

```bash
cd orgs/sst/opencode
gh pr create \
  --repo riatzukiza/opencode \
  --title "PR Title" \
  --body "PR description

---

*Mirrored from sst/opencode PR #<original-number>*" \
  --base dev \
  --head <branch-name>
```

## Current Status

### Last Sync
- **Date**: 2025-11-08
- **Dev branches**: ✅ Synced
- **Open PRs mirrored**: 5/17 (some WIP branches excluded)

### Active Mirror PRs

| sst/opencode | riatzukiza/opencode | Status |
|--------------|---------------------|---------|
| #4088 | #57 | Fix parallel edit FileTime behavior |
| #4082 | #58 | Fix undo restoring todo list |
| #3588 | #59 | Add cwd parameter to bash tool |
| #3578 | #60 | Enhance LSP diagnostics |
| #3836 | #61 | Better copy markdown |

## Maintenance

### Regular Tasks

1. **Weekly sync**: Run `bun mirror-prs.ts` to catch new PRs
2. **After major changes**: Manually verify dev branch sync
3. **Cleanup**: Close old mirror PRs when source PRs are merged/closed

### Troubleshooting

#### Force Push Issues
If dev sync fails:
```bash
cd orgs/sst/opencode
git fetch origin
git fetch riatzukiza
git checkout riatzukiza/dev
git reset --hard origin/dev
git push -f riatzukiza HEAD:dev
```

#### PR Creation Conflicts
If script fails to create a PR:
1. Check if branch exists: `git branch -r | grep riatzukiza`
2. Push branch manually: `git push riatzukiza <branch-name>:<branch-name>`
3. Create PR manually using the format above

#### Stash Issues
If stashing causes problems:
```bash
# Commit changes instead of stashing
git add .
git commit -m "WIP: temporary commit for sync"
# Run sync
# Reset after sync
git reset HEAD~1
```

## Integration with Workflow

### Before Creating New PRs

1. Ensure your feature branch is pushed to both remotes:
   ```bash
   git push origin <branch>
   git push riatzukiza <branch>
   ```

2. Create PR on sst/opencode first (primary)

3. Run mirroring script to create mirror:
   ```bash
   bun mirror-prs.ts
   ```

### After Merging PRs

1. Merge PR on sst/opencode
2. Close corresponding mirror PR on riatzukiza/opencode
3. Run script to sync dev branches

## Future Enhancements

Potential improvements to consider:

- **GitHub Actions**: Automate mirroring via CI/CD
- **Webhook integration**: Trigger mirroring on PR creation
- **Batch operations**: Handle multiple PRs more efficiently
- **Status tracking**: Dashboard showing sync status
- **Conflict resolution**: Better handling of merge conflicts

## Related Documentation

- [AGENTS.md](/home/err/devel/AGENTS.md) - Development workspace commands
- [Repository Cross-References](docs/MASTER_CROSS_REFERENCE_INDEX.md) - Ecosystem overview
- [Git Submodules Documentation](docs/worktrees-and-submodules.md) - Repository management

---

*Last updated: 2025-11-08*
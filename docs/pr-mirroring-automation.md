# PR Mirroring Automation

Automated script for mirroring pull requests between sst/opencode and riatzukiza/opencode repositories.

## Quick Start

```bash
# Run the mirroring script
bun mirror-prs.ts
```

## What It Does

- ✅ Syncs dev branches between repositories
- ✅ Creates mirror PRs for all open PRs
- ✅ Avoids duplicate PR creation
- ✅ Handles errors gracefully

## Requirements

- `gh` CLI tool installed and authenticated
- Write access to riatzukiza/opencode
- Network connectivity to GitHub

## Script Location

`/home/err/devel/mirror-prs.ts`

## Output Example

```
🚀 Starting PR mirroring process...

🔄 Syncing dev branches...
💾 Stashed local changes
📤 Restored stashed changes
✅ Dev branches synced

📋 Getting open PRs from sst/opencode...
📋 Getting existing PRs from riatzukiza/opencode...
📊 Found 5 open PRs on sst/opencode
📊 Found 61 existing PRs on riatzukiza/opencode

🔨 Creating mirror PR for #4088: Fix parallel edit FileTime behavior (#2882)
✅ Created PR: https://github.com/riatzukiza/opencode/pull/57

🎉 Successfully created 1 new mirror PRs
🔗 View all PRs: https://github.com/riatzukiza/opencode/pulls
```

## Full Documentation

See [PR Mirroring Documentation](docs/pr-mirroring.md) for detailed information.
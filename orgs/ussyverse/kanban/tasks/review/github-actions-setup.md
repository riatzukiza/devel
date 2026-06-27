---
uuid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
title: Set up GitHub Actions workflows and branch protection for kanban repo
status: done
priority: P1
labels:
  - infrastructure
  - ci-cd
created_at: 2026-03-11T21:45:00Z
---

## Summary

Configure the ussyverse-kanban repository with proper CI/CD integration for Trello sync.

## Completed

- [x] Branch protection on main
  - Requires PR merge (no direct pushes)
  - Requires 1 approval
  - Requires branch to be up-to-date before merge
  - Requires `kanban-dry-run` status check to pass
  - Linear history enabled

- [x] GitHub repository secrets
  - `TRELLO_API_KEY`
  - `TRELLO_API_TOKEN`

- [x] GitHub Actions workflows
  - `.github/workflows/pr-check.yml` - Dry-run sync on PRs to main
  - `.github/workflows/sync.yml` - Live sync to Trello on push to main

## Links

- PR: https://github.com/open-hax/ussyverse-kanban/pull/1
- Board: https://trello.com/b/Mu2BmeDE/ussyverse
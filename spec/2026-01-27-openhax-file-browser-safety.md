---
uuid: "342a2b42-58f4-4881-80ce-2c96bd460a41"
title: "OpenHax file browser safety fixes (2026-01-27)"
slug: "2026-01-27-openhax-file-browser-safety"
status: "done"
priority: "P2"
labels: ["file", "openhax", "browser", "safety"]
created_at: "2026-02-03T06:36:00.407448Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# OpenHax file browser safety fixes (2026-01-27)

## Summary
Address path traversal risk in agentd file listing, avoid re-fetch loops in the UI when directories are empty, and ensure file explorer uses configurable API base.

## Requirements
- Guard file system listing to prevent escaping `REPO_PATH` via path prefix tricks.
- Avoid repeated file fetches when a directory is empty or a prior load failed.
- Use `config/api-base` for file explorer API calls to support split UI/API origins.
- Keep changes scoped to OpenHax submodule.

## Existing issues/PRs
- Issues: none found.
- PRs: none found.

## Files & locations
- `orgs/open-hax/openhax/services/agentd/src/fs.ts:9-16`
- `orgs/open-hax/openhax/packages/opencode-reactant/src/opencode/ui/core.cljs:76-80`
- `orgs/open-hax/openhax/packages/opencode-reactant/src/opencode/ui/files.cljs:20-25`
- `orgs/open-hax/openhax/packages/opencode-reactant/src/opencode/ui/state.cljs:18-52`

## Plan
### Phase 1: Implement safety fixes
- Replace `startsWith` repo root check with `path.relative` validation.
- Track a loaded/initialized flag or gate fetch calls to avoid loops on empty/error.
- Build file explorer URL from `config/api-base`.

### Phase 2: Verify behavior
- Review updated files for existing patterns.
- Run targeted UI/agentd checks if available.

## Definition of done
- `listFiles` rejects paths outside `REPO_PATH` with separator-aware logic.
- File explorer fetch runs once for empty directories and does not retry every render.
- `/api/files` requests route through `config/api-base`.
- Changes summarized with file references.

## Changelog
- 2026-01-27: Spec created.
- 2026-01-27: Implemented repo path validation, fs load gating, and API base usage.

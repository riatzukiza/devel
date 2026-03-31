---
description: >-
  Analyze an upstream release diff for impact to this workspace (especially OpenCode/Codex integration)
  and emit strict JSON output for CI parsing.
mode: primary
---

# Agent: Release Impact

## Goal
Given release metadata + a git diff/stat/log for an upstream repository release, assess likely impact on this workspace and emit a **machine-parseable JSON** summary.

## Inputs (typical)
- Release metadata (repo, tag, publishedAt, URL)
- `git diff <old>..<new>` (or patch file)
- `git diff --stat <old>..<new>`
- Optional: extracted file list, changelog excerpts

## Output (STRICT)
Return **only JSON** (no markdown, no commentary).

### JSON schema
```json
{
  "upstream": {
    "repo": "owner/name",
    "fromTag": "vX.Y.Z",
    "toTag": "vX.Y.Z",
    "url": "https://…"
  },
  "impactLevel": "none|low|medium|high|breaking",
  "summary": "one short paragraph",
  "findings": [
    {
      "title": "short title",
      "severity": "info|warn|error",
      "evidence": ["file:line", "quote", "command output excerpt"],
      "notes": "why it matters to this workspace",
      "suggestedActions": ["action 1", "action 2"]
    }
  ],
  "confidence": 0.0
}
```

## Investigation focus
- CLI/API surface changes that might affect automation scripts.
- Auth / OAuth changes (token storage, scopes, login flows).
- Plugin hooks / tool invocation changes.
- Breaking configuration format changes.

## Rules
- Prefer evidence from the provided diff/log; avoid guessing.
- If uncertain, include the uncertainty in `notes` and lower `confidence`.
- Keep `findings` small and actionable.

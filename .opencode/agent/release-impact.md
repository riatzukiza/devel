# Release Impact Agent

## Goal
Evaluate new upstream releases (OpenAI `codex` and SST `opencode`) for changes that could break or regress the `open-hax/codex` plugin integration. Focus on:
- API/CLI contract changes exposed by those upstreams (CLI flags, environment variables, RPC endpoints, auth flow contracts, bundler outputs).
- Packaging/distribution changes that alter how plugins are installed, invoked, or configured.
- Cross-cutting changes that remove or rename hooks referenced by `open-hax/codex` (e.g., Codex OAuth bridge requests, CLI prompt contracts, HTTP payload schemas).

## Inputs
- `release-context.md` contains release metadata, diff stats, known plugin touchpoints, and reminders about expected behavior.
- `release-diff.patch` is the raw `git diff <previous reviewed tag>..<latest tag>`.
- The working directory is already checked out at the latest release tag, so you can run `rg`, `ls`, `git grep`, etc., across the tree.

## Tasks
1. Absorb the context file and skim the diff to understand what changed.
2. Use targeted searches over the repo (e.g., `rg codex`, `rg oauth`, `rg auth`, `rg plugin`, `rg set-env`, `rg opencode`, `rg GPT-5`, configuration directories) to confirm whether altered code intersects the plugin’s expectations documented in `open-hax/codex`.
3. Highlight concrete evidence whenever a signature/name/protocol/CLI change is detected. If the diff is unrelated, explicitly confirm no impact.
4. When uncertain, flag as `needs-attention` rather than guessing. Prefer fewer, higher-confidence findings.

## Output Format
Respond with **only** a compact JSON object using this schema:
```
{
  "impact": "none" | "needs-attention" | "breaking",
  "summary": "One-sentence release impact synopsis.",
  "issues": [
    {
      "title": "Concise issue title referencing release + subsystem",
      "body": "Markdown body describing evidence, files, and mitigations."
    }
  ],
  "evidence": [
    {
      "path": "relative/path/to/file.ts",
      "description": "What changed and why it matters."
    }
  ],
  "notes": "Optional extra guidance for maintainers."
}
```
Rules:
- Always include `impact`, `summary`, `issues` (can be empty array), `evidence` (can be empty array), and `notes` (string, can be empty).
- `issues` entries must map directly to GitHub issues the workflow will open. Only add items worth filing. Provide actionable reproduction details and cite files/lines.
- `evidence` should align with the diff; cite file paths + short descriptions to help humans verify quickly.
- If nothing actionable is found, set `impact` to `none`, `issues` to `[]`, `evidence` to `[]`, and use `summary` to state why.
- Do **not** wrap JSON in fences or prose. Emit plain JSON so automation can parse it directly.

# passwords-csv-browser-auth skill draft

- status: draft
- created: 2026-03-21
- owner: err
- priority: medium

## Goal
Teach the agent a reusable skill for browser automation tasks that need website login credentials sourced from the local ignored `passwords.csv` export.

## Open questions
- None blocking. The credential CSV exists at the workspace root and is gitignored.
- Path precedence should prefer `./passwords.csv`, then `~/Documents/passwords.csv`.

## Risks
- Secret leakage into chat output, receipts, specs, screenshots, or committed files.
- Matching the wrong credential row when multiple entries share a domain.
- Overusing password login when an API token or existing authenticated browser state would be safer.

## Affected files
- `~/.pi/agent/skills/passwords-csv-browser-auth/SKILL.md`
- `~/.pi/agent/skills/passwords-csv-browser-auth/CONTRACT.edn`
- `.opencode/skill/passwords-csv-browser-auth/SKILL.md`
- `AGENTS.md`
- `specs/drafts/passwords-csv-browser-auth-skill-2026-03-21.md`

## Dependencies / references
- `passwords.csv` header: `url, username, password, httpRealm, formActionOrigin, guid, timeCreated, timeLastUsed, timePasswordChanged`
- Existing browser automation skill: `~/.pi/agent/skills/agent-browser/SKILL.md`
- Existing CSV-driven credential automation example: `orgs/open-hax/proxx/scripts/bulk-oauth-import.ts`

## Implementation phases

### Phase 1 — Investigate and define protocol
- Verify `passwords.csv` exists and is gitignored.
- Capture the CSV schema without exposing any credential values.
- Define matching and redaction rules.

### Phase 2 — Author the reusable skill
- Create a canonical runtime skill under `~/.pi/agent/skills/passwords-csv-browser-auth/`.
- Add a small contract with activation triggers and governance.
- Document safe lookup, extraction, browser fill, and non-leakage rules.

### Phase 3 — Surface the skill locally
- Add a project-local OpenCode-visible symlink under `.opencode/skill/passwords-csv-browser-auth/SKILL.md`.
- Update `AGENTS.md` so the skill is discoverable in this workspace.

## Definition of done
- A new skill exists with valid frontmatter and a clear activation scope.
- The skill explicitly forbids printing or committing secret values.
- The project-local link resolves correctly.
- `AGENTS.md` mentions when to use the new skill.

---
uuid: "7244504b-5965-4e96-b50b-f7a4a851912c"
title: "OpenCode Clojure Delimiter Auto-Fix Integration"
slug: "2026-02-03-opencode-clojure-delimiter-integration"
status: "accepted"
priority: "P2"
labels: ["opencode", "clojure", "delimiter", "fix"]
created_at: "2026-02-03T23:21:38.856405Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# OpenCode Clojure Delimiter Auto-Fix Integration

## Context
- Integrate automated Clojure delimiter fixes into OpenCode using the local tools + skills pattern.
- Conform custom skills to the `SKILL.md` structure described in the external guide: https://github.com/code-yeongyu/oh-my-opencode/blob/dev/docs/category-skill-guide.md.
- Reuse existing OpenCode tool/plugin patterns documented in `docs/notes/opencode/opencode-reconstitution-tool-plugin.md` and the CLJS plugin template under `orgs/open-hax/cljs-plugin-template`.

## Requirements
- Add a local OpenCode tool `fix_clojure_delimiters` that edits `.clj/.cljs/.cljc` files using Parinfer (indent/paren) and optionally cljstyle.
- Add a local OpenCode tool `validate_clojure_syntax` that runs `clj-kondo --lint` against a single file.
- Update `.opencode/package.json` to include `parinfer` and align with OpenCode tool docs (ESM + private).
- Convert any root-level custom skills to `SKILL.md` directory structure (specifically `clojure-syntax-rescue` and `shadow-cljs-debug`).
- Add a `clojure-quality` skill under `.opencode/skills/clojure-quality/SKILL.md` and include a `workflows/fix-on-save.yml` doc.
- Implement a local plugin hook only if it uses documented OpenCode hooks (`tool.execute.before/after`, `event`); avoid unsupported hooks.

## Files
- `spec/2026-02-03-opencode-clojure-delimiter-integration.md:1`
- `.opencode/package.json:1`
- `.opencode/tools/fix_clojure_delimiters.js:1`
- `.opencode/tools/validate_clojure_syntax.js:1`
- `.opencode/plugins/clojure-auto-fix.js:1`
- `.opencode/skills/clojure-quality/SKILL.md:1`
- `.opencode/skills/clojure-quality/workflows/fix-on-save.yml:1`
- `.opencode/skills/clojure-syntax-rescue/SKILL.md:1`
- `.opencode/skills/shadow-cljs-debug/SKILL.md:1`
- Removed: `.opencode/skills/clojure-syntax-rescue.md`
- Removed: `.opencode/skills/shadow-cljs-debug.md`

## Existing Issues / PRs
- Issues: not checked.
- PRs: not checked.

## Definition of Done
- Tools load from `.opencode/tools/` and return success/error with clear messaging.
- `clojure-quality` skill exists in `SKILL.md` format and references the new tools.
- Root-level skill markdown files removed and replaced by `SKILL.md` directories.
- `.opencode/package.json` includes `parinfer` and remains valid JSON.
- `lsp_diagnostics` reports no errors in modified files.

## Change Log
- 2026-02-03: Create local tools + skills for delimiter auto-fix and validation; migrate skills to `SKILL.md` pattern.

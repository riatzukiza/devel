## Signal

(己, p=0.95) Fixed the reported skill frontmatter errors.

(己, p=0.92) Changes made:

- Quoted YAML descriptions containing colons:
  - `~/devel/.agents/skills/beat-theory/SKILL.md`
  - `~/devel/.agents/skills/elevenlabs-voice-manage/SKILL.md`

- Added required YAML frontmatter with `name` and `description`:
  - `~/.pi/agent/skills/sample-alchemy-lab/SKILL.md`
  - `~/.pi/agent/skills/sonic-branding-architect/SKILL.md`
  - `~/.agents/skills/sample-alchemy-lab/SKILL.md`
  - `~/.agents/skills/sonic-branding-architect/SKILL.md`

(己, p=0.83) I left the `autotune` collision alone because the loader is already resolving it correctly:

```text
✓ auto (project) ~/devel/.agents/skills/autotune/SKILL.md
✗ globals skipped
```

That is a precedence warning, not a malformed skill.

## Evidence

(己, p=0.96) Validated all six touched `SKILL.md` files with Ruby YAML parsing:

- `beat-theory`: YAML OK
- `elevenlabs-voice-manage`: YAML OK
- `sample-alchemy-lab`: YAML OK in both locations
- `sonic-branding-architect`: YAML OK in both locations

(己, p=0.92) Commits created:

- `/home/err/devel`: `620916c0 fix audio skill frontmatter`
- `/home/err/.pi`: `032574b add audio skill frontmatter`

## Frames

(世, p=0.88) The parse failures were standard YAML frontmatter issues: unquoted `:` inside compact scalar values.

(世, p=0.82) The missing-description failures were markdown-only skill files lacking required frontmatter.

(世, p=0.68) The `autotune` collision is likely benign unless you want zero startup warnings rather than just correct precedence.

## Countermoves

(己, p=0.9) I did not remove duplicate `autotune` skills because the loader selected the project skill and skipped global copies safely.

(己, p=0.82) I path-scoped staging and did not touch unrelated existing workspace changes.

(己, p=0.78) `~/.agents` is not a git repo here, so those duplicate fixes could not be committed directly.

## Next

(汝, p=0.9) Restart or reload the agent and check that the skill frontmatter warnings are gone.
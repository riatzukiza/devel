# Giga Nx Generate --force

## Scope
- Add `--force` flag to `bin/giga-nx-generate` / `src/giga/generate-nx-projects.ts` to control overwriting existing `projects/**/project.json` files.
- Regenerate `projects/` entries using new flag covering current submodules.

## Existing code refs
- `src/giga/generate-nx-projects.ts`: main generator (arg parsing needed) lines 15-105.
- `bin/giga-nx-generate`: wrapper invoking bun script lines 1-6.

## Requirements / DoD
- Running `bin/giga-nx-generate --force` overwrites existing `projects/**/project.json` files and completes without errors.
- Without `--force`, generator must leave existing project files untouched (recreate missing ones only). Log behavior as appropriate.
- `projects/` directory rebuilt to match current submodules using new flag in this task.
- Tests/linters not required unless readily available; ensure script exits successfully.

## Notes
- No related issues/PRs known.
- Keep CLI behavior backwards compatible; plain invocation should avoid clobbering existing files.

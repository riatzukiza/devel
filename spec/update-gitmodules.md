# Update gitmodules for targeted org repos

## Code files and references
- `.gitmodules` (currently 89 lines; see the Open Hax block starting around lines 53-88) is missing entries for the three requested repos.
- `.git/config` holds active submodule URLs for `open-hax/cljs-plugin-template`, `orgs/riatzukiza/ollama-benchmarks`, and `orgs/octave-commons/promethean-agent-system` (see lines 357-365) and should stay in sync with `.gitmodules`.

## Existing issues / PRs
- None referenced in the workspace or instructions.

## Requirements
1. Add `.gitmodules` entries for the three repos so each points to the correct GitHub remote (`git@github.com:open-hax/cljs-plugin-template.git`, `https://github.com/riatzukiza/ollama-benchmarks.git`, `https://github.com/octave-commons/promethean-agent-system.git`).
2. Use the existing `device/stealth` branch convention for the submodules to match other org entries.
3. Ensure the `path` values match the actual directories under `orgs/open-hax`, `orgs/riatzukiza`, and `orgs/octave-commons`.

## Definition of done
- `.gitmodules` contains the three requested submodule blocks with correct URLs, branches, and paths.
- No additional submodule metadata needs to change, and the workspace can re-sync these entries without errors.

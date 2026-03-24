# Root module usage manifest — 2026-03-21

## Scope
- Root-level outside-structure modules only
- Includes: top-level aliases, top-level standalone roots, and root-level vendor/fork/special checkouts
- Excludes: foreign org repos and aggregation trees, which were inventoried separately in the outside-structure manifest

Machine-readable companion artifact:
- `docs/reports/inventory/root-module-usage-manifest-2026-03-21.json`

## Summary counts
- totalRootModules: **15**
- activeAliases: **2**
- activeStandaloneRoots: **5**
- planningBundles: **1**
- bookkeepingOnly: **6**

## Root module usage summary

| Path | Active status | Reference files | Why it is still used | Suggested next decision |
|---|---|---:|---|---|
| `desktop` | active-alias | 22 | Root alias for orgs/riatzukiza/desktop still supports launcher, desktop-entry, and documentation/manifests that refer to the short root path. | Keep as an explicit operator convenience alias or migrate launcher/docs to orgs/riatzukiza/desktop and retire the alias later. |
| `promethean` | active-alias | 674 | Root alias for orgs/riatzukiza/promethean is still embedded in shadow-cljs source paths, PM2 parity tests, and workspace documentation. | Either bless the alias as a stable compatibility path or rewrite source-path/test/docs references to the canonical org path. |
| `pm2-clj-project` | active-tooling-fixture | 4 | Used as a root-level PM2/ClojureScript tooling fixture and compiler source path for ecosystem parity and manifest docs. | Decide whether this belongs in packages/, orgs/riatzukiza/, or as an explicit root-level tooling exception. |
| `reconstitute` | active-tooling-root | 55 | Acts as a root CLI/tooling entrypoint around the reconstitution workflow and is referenced by root package scripts, OpenCode commands, and skills. | Classify it as an intentional tooling root or normalize it into packages/ or an org repo while leaving a compatibility command path. |
| `reconstitute-mcp` | doc-and-experimental-surface | 5 | Appears to persist mainly as an experimental/documented MCP surface referenced by notes inside the reconstitute project, not as a clearly active standalone module. | Either fold it into reconstitute as documented design material or promote it into a real package/service if it becomes runnable. |
| `mcp-social-publisher-live` | active-standalone-deploy-root | 6 | Standalone repo used as the current source/deploy root for the live ussy deployment, with deployment specs and receipts pointing at it explicitly. | Give it an explicit placement decision rather than leaving it ambiguous at the workspace root. |
| `threat-radar-deploy` | active-product-source-root | 12 | Active product/source surface for the current radar system; user has now directed that it be normalized and consolidated into orgs/open-hax/eta-mu-radar. | Normalize into orgs/open-hax/eta-mu-radar and retarget runtime/deploy references while keeping services/radar-stack as the runtime home. |
| `verathar-server` | bookkeeping-only-for-now | 4 | Currently visible primarily through submodule bookkeeping, receipts, and snapshot artifacts rather than active tracked integration points. | Either mark as an explicit external/fork exception or move it under a clearer home if active work resumes. |
| `threat-radar-next-step` | planning-bundle | 4 | Used as a future/platform design bundle, but user has now directed that all threat-radar-related work consolidate into orgs/open-hax/eta-mu-radar. | Fold useful planning/spec material into orgs/open-hax/eta-mu-radar and retire the standalone bundle once absorbed. |
| `bevy_replicon` | bookkeeping-only-foreign-fork | 4 | Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts. | Treat as a foreign-fork exception or relocate under a clearer vendor/forks area. |
| `egregoria` | bookkeeping-only-foreign-fork | 4 | Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts. | Treat as a foreign-fork exception or relocate under a clearer vendor/forks area. |
| `game_network` | bookkeeping-only-foreign-fork | 4 | Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts. | Treat as a foreign-fork exception or relocate under a clearer vendor/forks area. |
| `ggrs` | bookkeeping-only-foreign-fork | 4 | Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts. | Treat as a foreign-fork exception or relocate under a clearer vendor/forks area. |
| `lightyear` | bookkeeping-only-foreign-fork | 4 | Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts. | Treat as a foreign-fork exception or relocate under a clearer vendor/forks area. |
| `gates-pr35-hardening-main` | active-special-worktree | 5 | Special-purpose hardening checkout is still referenced by the agile-process skill as a work/spec source, beyond ordinary submodule bookkeeping. | Keep as an explicit worktree/sprint exception until the hardening branch is merged or retired. |

## `desktop`
- outside category: `top-level-alias-outside-structure`
- active status: **active-alias**
- tracked reference files outside its own tree: **22**
- reference area counts:
  - `config-or-manifest`: 2
  - `docs`: 10
  - `gitmodules`: 1
  - `opencode`: 1
  - `other`: 6
  - `receipts-or-fork-tax`: 1
  - `specs`: 1
- why used: Root alias for orgs/riatzukiza/desktop still supports launcher, desktop-entry, and documentation/manifests that refer to the short root path.
- key evidence:
  - `bin/codex-open-hax-desktop`
  - `share/applications/codex-open-hax.desktop`
  - `docs/manifests/riatzukiza-repos-manifest-2025-11-06.md`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `.opencode/skills/webring-site/SKILL.md`
  - `README.md`
  - `bin/codex-open-hax-desktop`
  - `docs/Tell me about this AI wargame study recently.md`
  - `docs/agile/reports/nested-submodule-manifest-survey.md`
  - `docs/agile/tasks/orgs-duplication-analysis-report-2025-11-06.md`
  - `docs/manifests/github-remotes-local-manifest-2025-11-06.md`
- suggested next decision: Keep as an explicit operator convenience alias or migrate launcher/docs to orgs/riatzukiza/desktop and retire the alias later.

## `promethean`
- outside category: `top-level-alias-outside-structure`
- active status: **active-alias**
- tracked reference files outside its own tree: **674**
- reference area counts:
  - `config-or-manifest`: 219
  - `docs`: 34
  - `gitmodules`: 1
  - `opencode`: 19
  - `other`: 387
  - `receipts-or-fork-tax`: 1
  - `specs`: 13
- why used: Root alias for orgs/riatzukiza/promethean is still embedded in shadow-cljs source paths, PM2 parity tests, and workspace documentation.
- key evidence:
  - `shadow-cljs.edn`
  - `tests/pm2-clj.parity.test.ts`
  - `docs/PACKAGE_MANIFEST.md`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/\316\240_STATE.sexp"`
  - `".\316\267\316\274/registry.jsonl"`
  - `"docs/agile/tasks/--title Phase 1 \342\200\224 Repo Scanner + PM2 Launcher.md"`
  - `"docs/agile/tasks/--title Phase 2 \342\200\224 GitHub Data Gateway Service.md"`
  - `"docs/agile/tasks/--title Phase 8 \342\200\224 Configuration Update .config opencode opencode.json.md"`
  - `.gitmodules`
  - `.opencode/commands/deploy-promethean-service.md`
  - `.opencode/commands/giga-build.md`
  - `.opencode/commands/giga-test.md`
- suggested next decision: Either bless the alias as a stable compatibility path or rewrite source-path/test/docs references to the canonical org path.

## `pm2-clj-project`
- outside category: `top-level-standalone-root`
- active status: **active-tooling-fixture**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `config-or-manifest`: 1
  - `docs`: 1
  - `other`: 2
- why used: Used as a root-level PM2/ClojureScript tooling fixture and compiler source path for ecosystem parity and manifest docs.
- key evidence:
  - `tests/pm2-clj.parity.test.ts`
  - `shadow-cljs.edn`
  - `docs/PACKAGE_MANIFEST.md`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `docs/PACKAGE_MANIFEST.md`
  - `shadow-cljs.edn`
  - `tests/pm2-clj.parity.test.ts`
- suggested next decision: Decide whether this belongs in packages/, orgs/riatzukiza/, or as an explicit root-level tooling exception.

## `reconstitute`
- outside category: `top-level-standalone-root`
- active status: **active-tooling-root**
- tracked reference files outside its own tree: **55**
- reference area counts:
  - `config-or-manifest`: 7
  - `docs`: 2
  - `opencode`: 10
  - `other`: 33
  - `receipts-or-fork-tax`: 1
  - `specs`: 2
- why used: Acts as a root CLI/tooling entrypoint around the reconstitution workflow and is referenced by root package scripts, OpenCode commands, and skills.
- key evidence:
  - `package.json`
  - `.opencode/commands/opencode-sessions-index.md`
  - `.opencode/skills/opencode-reconstituter/SKILL.md`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `.clobber/index.cjs`
  - `.clobber/index.cjs.map`
  - `.gitignore`
  - `.opencode/commands/opencode-sessions-index.md`
  - `.opencode/commands/opencode-sessions-search.md`
  - `.opencode/skill_graph.json`
  - `.opencode/skills/AGENTS.md`
  - `.opencode/skills/opencode-apply-reconstituted-diffs/SKILL.md`
  - `.opencode/skills/opencode-reconstituter/SKILL.md`
- suggested next decision: Classify it as an intentional tooling root or normalize it into packages/ or an org repo while leaving a compatibility command path.

## `reconstitute-mcp`
- outside category: `top-level-standalone-root`
- active status: **doc-and-experimental-surface**
- tracked reference files outside its own tree: **5**
- reference area counts:
  - `other`: 5
- why used: Appears to persist mainly as an experimental/documented MCP surface referenced by notes inside the reconstitute project, not as a clearly active standalone module.
- key evidence:
  - `reconstitute/docs/notes/reconstitute/reconstitute-mcp-server.md`
  - `reconstitute/spec/notes-extracted/reconstitute--reconstitute-mcp-server.md`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `reconstitute/docs/notes/reconstitute/reconstitute-background-indexer.md`
  - `reconstitute/docs/notes/reconstitute/reconstitute-event-indexing.md`
  - `reconstitute/docs/notes/reconstitute/reconstitute-mcp-server.md`
  - `reconstitute/spec/notes-extracted/reconstitute--reconstitute-mcp-server.md`
- suggested next decision: Either fold it into reconstitute as documented design material or promote it into a real package/service if it becomes runnable.

## `mcp-social-publisher-live`
- outside category: `top-level-standalone-root`
- active status: **active-standalone-deploy-root**
- tracked reference files outside its own tree: **6**
- reference area counts:
  - `gitmodules`: 1
  - `other`: 3
  - `receipts-or-fork-tax`: 1
  - `specs`: 1
- why used: Standalone repo used as the current source/deploy root for the live ussy deployment, with deployment specs and receipts pointing at it explicitly.
- key evidence:
  - `specs/drafts/mcp-social-publisher-ussy-key-auth-deploy-2026-03-21.md`
  - `.gitmodules`
  - `receipts.log`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitignore`
  - `.gitmodules`
  - `receipts.log`
  - `specs/drafts/mcp-social-publisher-ussy-key-auth-deploy-2026-03-21.md`
- suggested next decision: Give it an explicit placement decision rather than leaving it ambiguous at the workspace root.

## `threat-radar-deploy`
- outside category: `top-level-standalone-root`
- active status: **active-product-source-root**
- tracked reference files outside its own tree: **12**
- reference area counts:
  - `config-or-manifest`: 1
  - `gitmodules`: 1
  - `other`: 6
  - `receipts-or-fork-tax`: 1
  - `specs`: 3
- why used: Active product/source surface for the current radar system; user has now directed that it be normalized and consolidated into orgs/open-hax/eta-mu-radar.
- key evidence:
  - `services/radar-stack/docker-compose.yml`
  - `specs/drafts/radar-live-deploy-2026-03-20.md`
  - `specs/drafts/eta-mu-radar-normalization-2026-03-21.md`
- sample reference files:
  - `".\316\267\316\274/\316\240_LAST.md"`
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/\316\240_STATE.sexp"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitignore`
  - `.gitmodules`
  - `receipts.log`
  - `services/radar-stack/Dockerfile.hormuz-clock-mcp`
  - `services/radar-stack/docker-compose.yml`
  - `specs/drafts/radar-crawler-integration-2026-03-20.md`
- suggested next decision: Normalize into orgs/open-hax/eta-mu-radar and retarget runtime/deploy references while keeping services/radar-stack as the runtime home.

## `verathar-server`
- outside category: `top-level-standalone-root`
- active status: **bookkeeping-only-for-now**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `gitmodules`: 1
  - `other`: 2
  - `receipts-or-fork-tax`: 1
- why used: Currently visible primarily through submodule bookkeeping, receipts, and snapshot artifacts rather than active tracked integration points.
- key evidence:
  - `.gitmodules`
  - `receipts.log`
  - `.ημ/registry.jsonl`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `receipts.log`
- suggested next decision: Either mark as an explicit external/fork exception or move it under a clearer home if active work resumes.

## `threat-radar-next-step`
- outside category: `top-level-standalone-root`
- active status: **planning-bundle**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `other`: 3
  - `specs`: 1
- why used: Used as a future/platform design bundle, but user has now directed that all threat-radar-related work consolidate into orgs/open-hax/eta-mu-radar.
- key evidence:
  - `specs/drafts/radar-deployment-declutter-formalization-2026-03-21.md`
  - `specs/drafts/eta-mu-radar-normalization-2026-03-21.md`
  - `inbox/threat-radar-next-step.zip`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `inbox/threat-radar-next-step.zip`
  - `specs/drafts/radar-deployment-declutter-formalization-2026-03-21.md`
- suggested next decision: Fold useful planning/spec material into orgs/open-hax/eta-mu-radar and retire the standalone bundle once absorbed.

## `bevy_replicon`
- outside category: `root-level-vendor-or-fork-repo`
- active status: **bookkeeping-only-foreign-fork**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `gitmodules`: 1
  - `other`: 2
  - `receipts-or-fork-tax`: 1
- why used: Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts.
- key evidence:
  - `.gitmodules`
  - `receipts.log`
  - `.ημ/registry.jsonl`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `receipts.log`
- suggested next decision: Treat as a foreign-fork exception or relocate under a clearer vendor/forks area.

## `egregoria`
- outside category: `root-level-vendor-or-fork-repo`
- active status: **bookkeeping-only-foreign-fork**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `gitmodules`: 1
  - `other`: 2
  - `receipts-or-fork-tax`: 1
- why used: Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts.
- key evidence:
  - `.gitmodules`
  - `receipts.log`
  - `.ημ/registry.jsonl`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `receipts.log`
- suggested next decision: Treat as a foreign-fork exception or relocate under a clearer vendor/forks area.

## `game_network`
- outside category: `root-level-vendor-or-fork-repo`
- active status: **bookkeeping-only-foreign-fork**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `gitmodules`: 1
  - `other`: 2
  - `receipts-or-fork-tax`: 1
- why used: Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts.
- key evidence:
  - `.gitmodules`
  - `receipts.log`
  - `.ημ/registry.jsonl`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `receipts.log`
- suggested next decision: Treat as a foreign-fork exception or relocate under a clearer vendor/forks area.

## `ggrs`
- outside category: `root-level-vendor-or-fork-repo`
- active status: **bookkeeping-only-foreign-fork**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `gitmodules`: 1
  - `other`: 2
  - `receipts-or-fork-tax`: 1
- why used: Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts.
- key evidence:
  - `.gitmodules`
  - `receipts.log`
  - `.ημ/registry.jsonl`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `receipts.log`
- suggested next decision: Treat as a foreign-fork exception or relocate under a clearer vendor/forks area.

## `lightyear`
- outside category: `root-level-vendor-or-fork-repo`
- active status: **bookkeeping-only-foreign-fork**
- tracked reference files outside its own tree: **4**
- reference area counts:
  - `gitmodules`: 1
  - `other`: 2
  - `receipts-or-fork-tax`: 1
- why used: Tracked mainly as an absorbed top-level fork/submodule with no strong active integration references outside bookkeeping artifacts.
- key evidence:
  - `.gitmodules`
  - `receipts.log`
  - `.ημ/registry.jsonl`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `receipts.log`
- suggested next decision: Treat as a foreign-fork exception or relocate under a clearer vendor/forks area.

## `gates-pr35-hardening-main`
- outside category: `root-level-worktree-or-fork-repo`
- active status: **active-special-worktree**
- tracked reference files outside its own tree: **5**
- reference area counts:
  - `gitmodules`: 1
  - `opencode`: 1
  - `other`: 2
  - `receipts-or-fork-tax`: 1
- why used: Special-purpose hardening checkout is still referenced by the agile-process skill as a work/spec source, beyond ordinary submodule bookkeeping.
- key evidence:
  - `.opencode/skills/agile-process/SKILL.md`
  - `.gitmodules`
  - `receipts.log`
- sample reference files:
  - `".\316\267\316\274/\316\240_MANIFEST.sha256"`
  - `".\316\267\316\274/registry.jsonl"`
  - `.gitmodules`
  - `.opencode/skills/agile-process/SKILL.md`
  - `receipts.log`
- suggested next decision: Keep as an explicit worktree/sprint exception until the hardening branch is merged or retired.

## Interpretation
- `desktop` and `promethean` are still active mainly as compatibility aliases.
- `pm2-clj-project`, `reconstitute`, `mcp-social-publisher-live`, and `threat-radar-deploy` have real active usage and are not just residue.
- Threat-radar roots are now explicitly expected to normalize into `orgs/open-hax/eta-mu-radar`.
- `reconstitute-mcp` and `threat-radar-next-step` look more like documentation/planning surfaces than stable canonical homes.
- `bevy_replicon`, `egregoria`, `game_network`, `ggrs`, `lightyear`, and `verathar-server` currently look mostly preserved by bookkeeping rather than active integration.
- `gates-pr35-hardening-main` is a special exception because it is still referenced by an active skill/workflow surface.

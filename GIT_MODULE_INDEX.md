# GIT_MODULE_INDEX — parent/children repo index

Snapshot of the submodule topology of `/home/err/devel` on branch `device/yoga`.
This documents the **known drift**: `.gitmodules` maps ~60 entries while the index
currently carries only **7 gitlinks** (1 mapped, 6 unmapped). `git submodule status`
fails until the drift is resolved — treat that as a known issue, not something to
casually fix.

Error observed:

```
fatal: no submodule mapping found in .gitmodules for path 'orgs/octave-commons/bitch-tracker'
```

Status note: ~24 nested repos had **no commits** (empty clones) at device-creation
time and were skipped from tracking. `.worktrees/` directories are excluded from
this index (they are worktrees of the same repos, not separate children).

## Parent

| path | repo/remote | branch | role |
|---|---|---|---|
| `/home/err/devel` (home superproject child) | `git@github.com:riatzukiza/devel.git` (origin) | `device/yoga` (active; from `main`) | the devel development-tree root: shared docs, tooling, services scaffolding, workspace manifests; submodule host for orgs/** |
| *(superproject above)* | home superproject (enclosing workspace repo) | `main-temp` | the device home workspace that contains `/home/err/devel` as a member; branch law per its own contract |

## Children

Mapped in `.gitmodules` **and** present as a gitlink in the index (1):

| path | repo/remote | branch | role | one-line |
|---|---|---|---|---|
| orgs/octave-commons/lineara_conversation_export | git@github.com:octave-commons/lineara_conversation_export.git | device/stealth | child repo | conversation-export tooling under octave-commons |

Gitlinks in the index with **no `.gitmodules` mapping** (unmapped — the drift;
`git submodule status` errors on the first of these):

| path | repo/remote | branch | role | one-line |
|---|---|---|---|---|
| orgs/octave-commons/bitch-tracker | *(unmapped; infer octave-commons/bitch-tracker)* | ? | child repo | tracker project (source of the submodule-status error) |
| orgs/octave-commons/eros-eris-field | *(unmapped)* | ? | child repo | field simulation |
| orgs/octave-commons/eros-eris-field-app | *(unmapped)* | ? | child repo | field simulation app |
| orgs/open-hax/tooloxx/services/mcp-fs-oauth | *(unmapped)* | ? | child repo | nested MCP fs-oauth service inside tooloxx |
| orgs/open-hax/vexx | *(unmapped)* | ? | child repo | vexx project |
| orgs/shuv/our-gpus | *(unmapped)* | ? | child repo | GPU fleet tooling |

Mapped in `.gitmodules` but **not currently a gitlink in the index** (mapped-only;
checkouts are plain directories, not registered submodules — selection):

| path | repo/remote | branch | role |
|---|---|---|---|
| orgs/riatzukiza/promethean | git@github.com:riatzukiza/promethean.git | device/stealth | Promethean agent system |
| orgs/riatzukiza/dotfiles | git@github.com:riatzukiza/dotfiles.git | device/stealth | device dotfiles |
| orgs/riatzukiza/goblin-lessons | git@github.com:riatzukiza/goblin-lessons.git | device/stealth | goblin-lessons |
| orgs/riatzukiza/ollama-benchmarks | git@github.com:riatzukiza/ollama-benchmarks.git | device/stealth | Ollama benchmarks |
| orgs/riatzukiza/riatzukiza.github.io | git@github.com:riatzukiza/riatzukiza.github.io.git | device/stealth | personal site |
| orgs/riatzukiza/desktop | ./orgs/riatzukiza/desktop (self-relative) | — | desktop config |
| orgs/riatzukiza/book-of-shadows | ./orgs/riatzukiza/book-of-shadows (self-relative) | — | notes vault |
| orgs/riatzukiza/stt | git@github.com:riatzukiza/stt.git | device/stealth | speech-to-text |
| orgs/riatzukiza/TANF-app | git@github.com:riatzukiza/TANF-app.git | device/stealth | TANF application |
| orgs/open-hax/proxx | git@github.com:open-hax/proxx.git | device/stealth | model proxy |
| orgs/open-hax/eta-mu | git@github.com:open-hax/eta-mu.git | device/stealth | agent runtime monorepo |
| orgs/open-hax/axxium | git@github.com:open-hax/axxium.git | device/stealth | agent infrastructure |
| orgs/open-hax/privaxxy | git@github.com:open-hax/privaxxy.git | device/stealth | privacy tooling |
| orgs/open-hax/voxx | git@github.com:open-hax/voxx.git | device/stealth | voice tooling |
| orgs/open-hax/codex | git@github.com:open-hax/codex.git | device/stealth | codex fork |
| orgs/open-hax/agent-actors | git@github.com:open-hax/agent-actors.git | device/stealth | agent actor system |
| orgs/open-hax/clients | git@github.com:open-hax/clients.git | device/stealth | clients |
| orgs/open-hax/cljs-plugin-template | (mapped) | device/stealth | plugin template |
| orgs/open-hax/plugins/codex | (mapped) | — | codex plugins |
| orgs/open-hax/museeks | (mapped) | — | museeks |
| orgs/open-hax/workbench | (mapped) | — | workbench |
| orgs/octave-commons/promethean | git@github.com:riatzukiza/promethean.git | device/stealth | Promethean (octave-commons checkout) |
| orgs/octave-commons/helm | (mapped) | — | helm |
| orgs/octave-commons/pantheon | (mapped) | — | pantheon |
| orgs/octave-commons/gates-of-aker | (mapped) | — | gates-of-aker |
| orgs/octave-commons/promethean-agent-system | (mapped) | — | promethean agent system |
| orgs/octave-commons/mythloom | (mapped) | — | mythloom |
| orgs/octave-commons/shibboleth | (mapped) | — | shibboleth |
| orgs/ussyverse/kanban | (mapped) | — | kanban system |
| orgs/ussyverse/openclawssy | (mapped) | — | openclawssy |
| orgs/shuv/codex-desktop-linux | (mapped) | — | codex desktop for linux |
| orgs/openai/codex | org-14957082@github.com:openai/codex.git | — | upstream OpenAI codex |
| orgs/openai/parameter-golf | (mapped) | — | parameter-golf |
| orgs/sst/opencode | git@github.com:sst/opencode.git | — | upstream opencode |
| orgs/anomalyco/opencode | (mapped) | — | opencode fork |
| orgs/badlogic/pi-mono | (mapped) | — | pi-mono |
| orgs/moofone/codex-ts-sdk | git@github.com:moofone/codex-ts-sdk.git | device/stealth | codex TS SDK |
| orgs/opencode-openai-codex-auth | (see .gitmodules) | — | codex auth plugin |
| orgs/agustif/codex-linux | (mapped) | — | codex linux |
| orgs/kcrommett/oc-manager | (mapped) | — | oc-manager |
| oss/agent-shell | git@github.com:riatzukiza/agent-shell.git | — | agent shell |
| oss/clojure-mcp | git@github.com:bhauman/clojure-mcp.git | — | clojure MCP server |
| services/open-hax-openai-proxy | (mapped) | — | proxx service wrapper |
| services/codex-lb | (mapped) | — | codex load balancer |
| services/vivgrid-openai-proxy | (mapped) | — | vivgrid proxy |
| vaults/fork_tales | (mapped) | — | Fork Tales vault |
| vaults/static_man | (mapped) | — | static man vault |
| .emacs.d | (mapped) | — | emacs config |
| threat-radar-deploy | (mapped) | — | threat radar deploy |
| bevy_replicon, egregoria, game_network, gates-pr35-hardening-main, ggrs, lightyear, mcp-social-publisher-live, verathar-server | (mapped) | — | assorted service/lab dirs |

*(Full authoritative list: `.gitmodules` at the repo root, ~60 entries.)*

**Empty-clone status:** ~24 nested repos had no commits (empty clones) when the
device branch was created and were skipped from tracking; they appear as plain
directories and may or may not be functional checkouts.

**Excluded:** `.worktrees/**` (git worktrees of the same repos, not separate
children).

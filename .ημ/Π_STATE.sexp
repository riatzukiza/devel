(Π_STATE
  (time "2026-04-08T18:45:00Z")
  (branch "staging")
  (pre_head "bc9b4ea")
  (dirty false)
  (purpose "machine-migration")
  (checks
    (check (status pass) (command "git diff --check"))
    (check (status skip) (command "mixed-workspace build/lint/test")
           (reason "Machine migration snapshot; no single executable target."))
  )
  (repo_notes
    (remote "origin/staging")
    (status_digest "migration-snapshot-2026-04-08")
    (note "Π recursive fork tax for machine migration: all present submodules pushed, dirty work committed, pointers updated.")
    (note "Root staging branch at bc9b4ea before this commit. 20 submodule pointer advances + 2 root file changes staged.")
    (tag_pending "Π/2026-04-08/184500-bc9b4ea")
  )
  (pushed_submodules
    (submodule (path "mcp-social-publisher-live") (branch "fork-tax/20260408-machine-migration") (status "pushed-to-branch-main-protected"))
    (submodule (path "orgs/octave-commons/gates-of-aker") (branch "fork-tax/20260408-machine-migration") (status "pushed-to-branch-main-ff-failed"))
    (submodule (path "orgs/octave-commons/promethean-agent-system") (branch "device/stealth") (status "pushed"))
    (submodule (path "orgs/open-hax/cljs-plugin-template") (branch "temp-merge") (status "pushed-no-verify"))
    (submodule (path "threat-radar-deploy") (branch "fork-tax/20260408-machine-migration") (status "pushed-to-branch-main-protected"))
    (submodule (path "orgs/openai/codex") (branch "main") (status "pushed-to-fork-riatzukiza/codex"))
    (submodule (path "orgs/octave-commons/cephalon") (branch "fork-tax/20260405-recursive-cephalon") (status "dirty-committed-then-pushed"))
    (submodule (path "orgs/open-hax/proxx") (branch "fix/glm-model-routing-and-session-stickiness") (status "dirty-committed-then-pushed"))
    (submodule (path "orgs/octave-commons/graph-weaver") (branch "fork-tax/20260404-recursive-graph-weaver") (status "dirty-committed-then-pushed"))
    (submodule (path "orgs/open-hax/knoxx") (branch "fork-tax/20260404-recursive-knoxx") (status "dirty-committed-then-pushed-no-verify"))
    (submodule (path "orgs/open-hax/openplanner") (branch "monorepo/graph-stack-consolidation") (status "dirty-committed-then-pushed"))
    (submodule (path "orgs/open-hax/uxx") (branch "feat/merge-proxy-console-theme") (status "already-up-to-date"))
    (submodule (path "orgs/open-hax/voxx") (branch "chore/checkpoint-voxx") (status "already-up-to-date"))
    (submodule (path "bevy_replicon") (branch "fork-tax/20260408-machine-migration") (status "pushed-to-branch-main-diverged"))
  )
  (residual_dirt
    (submodule (path "orgs/open-hax/openplanner") (state "Mm") (note "nested sub-submodules dirty: packages/eros-eris-field, packages/graph-weaver, packages/graph-weaver-aco, packages/myrmex, packages/vexx. Untracked: dist/, node_modules/, openplanner-lake/, packages/semantic-graph-builder/."))
    (submodule (path "orgs/open-hax/workbench") (state "Mm") (note "dirty shadow-cljs build caches only, no source changes."))
    (submodule (path "orgs/open-hax/proxx") (note "3 stashes preserved: docs/usage-modes-and-versioning, tmp/pr154-updated, staging/federation-audit-witness-fix"))
    (submodule (path "orgs/octave-commons/gates-of-aker") (note "2 stashes preserved: fix/colony-regression-hardening temp, hacks auto-stash"))
    (submodule (path "orgs/octave-commons/fork_tales") (note "untracked LaTeX build artifacts in papers/"))
    (submodule (path "orgs/octave-commons/shibboleth") (note "untracked LaTeX build artifacts in papers/shibboleth-apc/"))
    (submodule (path "orgs/octave-commons/lineara_conversation_export") (note "no remote tracking on branch device/stealth"))
    (submodule (path "orgs/octave-commons/mythloom") (note "no remote tracking on branch main"))
    (stash (repo "root") (note "stash@{0}: WIP on staging: 3f6a061 v4.1: Add uncertainty ranges to state scores and branch probabilities"))
  )
  (not_initialized_submodules
    "bevy_replicon" "egregoria" "game_network" "ggrs" "lightyear"
    ".emacs.d" "gates-pr35-hardening-main"
    "orgs/agustif/codex-linux" "orgs/anomalyco/opencode" "orgs/badlogic/pi-mono"
    "orgs/kcrommett/oc-manager" "orgs/moofone/codex-ts-sdk"
    "orgs/octave-commons/daimoi" "orgs/octave-commons/graph-runtime"
    "orgs/octave-commons/graph-weaver-aco" "orgs/octave-commons/simulacron"
    "orgs/octave-commons/myrmex" "orgs/octave-commons/helm"
    "orgs/octave-commons/pantheon" "orgs/octave-commons/promethean"
    "orgs/open-hax/agent-actors" "orgs/open-hax/clients" "orgs/open-hax/codex"
    "orgs/open-hax/museeks" "orgs/open-hax/opencode-skills" "orgs/open-hax/openhax"
    "orgs/open-hax/plugins/codex" "orgs/open-hax/privaxxy"
    "orgs/open-hax/tooloxx/services/hormuz-clock-mcp"
    "orgs/shuv/codex-desktop-linux" "orgs/shuv/our-gpus" "orgs/shuv/shuvcrawl"
    "orgs/ussyverse/kanban" "orgs/ussyverse/openclawssy" "orgs/ussyverse/routussy"
    "orgs/riatzukiza/agent-shell" "orgs/riatzukiza/book-of-shadows"
    "orgs/riatzukiza/desktop" "orgs/riatzukiza/dotfiles" "orgs/riatzukiza/goblin-lessons"
    "orgs/riatzukiza/openhax" "orgs/riatzukiza/promethean" "orgs/riatzukiza/riatzukiza.github.io"
    "orgs/riatzukiza/stt" "orgs/openai/parameter-golf"
    "vaults/static_man" "threat-radar-deploy"
  )
  (fork_remotes
    (submodule (path "orgs/openai/codex")
     (origin "org-14957082@github.com:openai/codex.git")
     (fork "https://github.com/riatzukiza/codex.git")
     (upstream "https://github.com/openai/codex.git")
     (note "Pushed to fork riatzukiza/codex. 2582 staged files committed as checkpoint cc6ef497a."))
  )
)

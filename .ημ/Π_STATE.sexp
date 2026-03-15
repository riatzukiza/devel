(Π_STATE
  (time "2026-03-15T01:33:59-05:00")
  (repo "/home/err/devel")
  (branch "refactor/skills-to-factory")
  (head_pre "f0d536c")
  (base_tag "Π/2026-03-10/202713-4f91c1e")

  (checks
    (check
      (cmd "pnpm -w lint")
      (exit 1)
      (note "nx-affected includes many untracked .opencode/knowledge/archive/** entries; git status hides them via status.showUntrackedFiles=no")))

  (submodules
    (submodule (path "orgs/open-hax/agent-actors") (branch "device/stealth") (head "412b5f4") (push "origin/device/stealth") (skip_prepush_typecheck true))
    (submodule (path "orgs/open-hax/openhax") (branch "feature/kanban-package") (head "70c6d9d") (push "origin/feature/kanban-package") (skip_prepush_typecheck true))
    (submodule (path "services/open-hax-openai-proxy") (branch "main") (head "b543b5e") (push "origin/main") (skip_prepush_typecheck false))
    (submodule (path "vaults/fork_tales") (branch "feature/eta-mu-tts-fix") (head "262099f") (push "origin/feature/eta-mu-tts-fix"))
    (submodule (path "orgs/octave-commons/pantheon") (branch "device/stealth") (head "a02e160") (push "origin/device/stealth") (rebased true))
    (submodule (path "orgs/octave-commons/promethean") (branch "device/stealth") (head "8dcaf03aa") (push "origin/fork-tax/2026-03-15-opmf-snapshot") (note "device/stealth non-fast-forward"))
    (submodule (path "orgs/octave-commons/gates-of-aker") (branch "main") (head "ed8272e") (push "origin/fork-tax/2026-03-15-opmf-snapshot") (note "main diverged; snapshot branch pushed")))

  (open_issues
    "Root lint currently failing (see checks)."
    "octave-commons/promethean: snapshot pushed to fork-tax branch due to non-fast-forward on device/stealth."))

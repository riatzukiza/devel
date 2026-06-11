(fork-tax-snapshot
  (time "20260611T191822Z")
  (repo "riatzukiza/devel")
  (remote "git@github.com:riatzukiza/devel.git")
  (tag "fork-tax/20260611-axxium-remote-guard")
  (source-branch "feat/ci-automation-1781026522")
  (base "origin/main")
  (snapshot-commit "5153f528daa62518db71ef98d3aa34f1c6ac3238")
  (scope (tracked-changes 12))
  (submodule-updates
    (orgs/agustif (codex-linux))
    (orgs/octave-commons (gates-of-aker promethean))
    (orgs/open-hax (eta-mu openplanner))
    (orgs/riatzukiza (TANF-app))
    (orgs/shuv (mcporter shuvgeist)))
  (file-changes
    (modified
      services/llamacpp-stack/docker-compose.yml
      services/openplanner/compose/proxx.yml
      services/openplanner/ecosystem.host.config.cjs))
  (guard
    (pre-push-hook "blocks push if origin != riatzukiza/devel")
    (axxium-status "proper submodule at orgs/open-hax/axxium (160000, open-hax/axxium.git)"))
  (excluded-secrets
    (passwords.csv services/proxx/cephalon-hive-accounts.json services/proxx/cephalon-hive-providers.json services/proxx/proxx-federation-accounts.json services/proxx/proxx-federation-providers.json services/openplanner/scripts/sync-runtime-secrets-env.sh services/openplanner/scripts/unfragile-mongo-reset.sh))
  (concurrent-dirt
    (untracked-count ~1600)
    (note "Untracked creative artifacts (audio, lore, graphics, kanban, music) left as residual per guardrails.")))

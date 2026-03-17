(Π_STATE
  (time "2026-03-17T10:55:17-05:00")
  (branch "feature/threat-radar-platform")
  (pre_head "d69c879")
  (dirty true)
  (checks
    (check (status skipped) (note "root-only snapshot (superproject pointer + .ημ metadata)"))
    (check (status passed) (command "services/open-hax-openai-proxy pnpm run build"))
    (check (status passed) (command "services/open-hax-openai-proxy pnpm test (253/253)"))
    (check (status passed) (command "services/open-hax-openai-proxy pnpm run typecheck (via pre-push hook)"))
  )
  (repo_notes
    (upstream "origin/feature/threat-radar-platform")
    (ahead_before_pi 1)
    (submodule (path "services/open-hax-openai-proxy") (from "021b82a") (to "457a620") (tag "Π/2026-03-17/105250-457a620"))
    (status_digest "2fc6-c3c7-eacd-2bf5")
  )
)

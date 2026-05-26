(fork-tax-state
  (repo "devel")
  (timestamp "20260526T204054Z")
  (scope "knoxx host PM2 runtime decoupled into services/openplanner")
  (mode "bottom-up nested submodule commit; path-scoped root staging; concurrent dirt preserved")
  (branches
    (root "pi/fork-tax/20260526T204054Z-knoxx-host-services")
    (openplanner "pi/fork-tax/20260526T204054Z-openplanner-knoxx-host-services")
    (knoxx "pi/fork-tax/20260526T204054Z-knoxx-host-services"))
  (tags-recorded-in ".ημ/Π_LAST.md")
  (commits
    (knoxx "c066cf0b2069")
    (openplanner "56d6effee7a8")
    (root "pending"))
  (verification
    "node -c service and knoxx ecosystem configs"
    "backend shadow-cljs compile test and server"
    "frontend typecheck and vitest"
    "ingestion clojure -M:test"
    "PM2 service-owned restart, pm2 save, authenticated /health ok"
    "hardcoded devel path/source scan passed")
  (staged-root-paths
    "services/openplanner/ecosystem.host.config.cjs"
    "services/openplanner/README.md"
    "orgs/open-hax/openplanner"
    "receipts.edn"
    ".ημ/Π_LAST.md"
    ".ημ/Π_STATE.sexp"
    ".ημ/Π_MANIFEST.sha256")
  (residual "unrelated root workspace dirt left untouched; no repo-wide cleanup performed"))

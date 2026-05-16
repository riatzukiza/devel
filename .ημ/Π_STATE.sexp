(fork-tax-state
  (repo "devel")
  (branch "pi/fork-tax/2026-04-15-170411")
  (base "6146d1ed")
  (timestamp "20260516T185547Z")
  (children
    (eta-mu "9edc4c59")
    (proxx "446317dc")
    (openplanner "10782a4a")
    (knoxx "a770d959")
    (webgl-graph-view "492e00d0")
    (uxx "d76dc9e7"))
  (scope "recursive selected active repos plus staged/safe root artifacts")
  (verification
    "root git diff --cached --check passed after staged text normalization" "staged high-risk secret heuristic scan passed after send_msg credential env rewrite" "oversized utau zip archives staged as git-lfs pointers" "benchmark false positives inline allowlisted; OpenUtau.deps.json staged as git-lfs pointer; secrets baseline unchanged" "utau lfs tracking narrowed to exact paths in follow-up commit"
    "proxx focused header test passed"
    "eta-mu extension and coding-agent focused tests passed"
    "child repos committed tagged pushed before parent")
  (residual
    "deletion-only/noisy worktrees and tmp/inbox clones left untouched"
    "ussyverse monorepo project deletion noise left untouched"
    "OpenUtau local source/build artifacts not pushed; root staged submodule registration only"
    "BetterDiscord personal config left untracked"
    "untracked external repo directories left unvendored"))

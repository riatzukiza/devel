# Managing Git Worktrees and Deeply Nested Submodules (Internal Best Practices)

Audience: senior engineers and release managers working in /home/err/devel across 26 repos and 22 git worktrees (48 total working directories). Languages and tooling include TypeScript (pnpm, bun, strict ESLint), Rust, Clojure, and Emacs Lisp; CI is GitHub Actions.

References (authoritative):
- Git worktree: https://git-scm.com/docs/git-worktree
- Git submodule: https://git-scm.com/docs/git-submodule
- Git config (submodule.*): https://git-scm.com/docs/git-config
- Pro Git book (Submodules, Advanced Merging): https://git-scm.com/book/en/v2
- actions/checkout v4: https://github.com/actions/checkout
- Atlassian Git tutorials (sanity checks): https://www.atlassian.com/git/tutorials


## 1) Worktrees: Policies and Operations

- Naming
  - Branches: `wip/<feature-slug>` for in‑progress; `feat/<topic>` for feature; `fix/<topic>` for patches; `rel/<target>` for release.
  - Directories: `<repo>/worktrees/<feature-slug>` (stable path; avoid spaces; kebab‑case only).
  - One branch ↔ one worktree directory. Do not reuse a worktree dir for a new branch.

- Layout Strategy
  - Superproject under `/home/err/devel/sst/opencode`; feature worktrees under `sst/opencode/worktrees/`.
  - Keep scripts worktree‑aware by using `git -C <path>`; never `cd` inside automation.
  - Ignore worktree folders: prefer a global ignore to avoid repo‑level noise. Configure `core.excludesfile` and add `worktrees/`. Only add to repo `.gitignore` if the team adopts it repo‑wide.
    ```bash
    mkdir -p ~/.config/git
    git config --global core.excludesfile "$HOME/.config/git/ignore"
    echo 'worktrees/' >> "$HOME/.config/git/ignore"
    ```

- Lifecycle
  - Create:
    ```bash
    git -C sst/opencode fetch --all --prune
    git -C sst/opencode worktree add worktrees/<slug> -b wip/<slug> origin/dev
    ```
  - Switch (open shell in worktree path): use your editor/terminal integrations or `git worktree list` to copy the path; do not detach heads.
  - Sync (while developing):
    ```bash
    git -C sst/opencode worktree list
    git -C sst/opencode fetch --all --prune
    git -C sst/opencode/worktrees/<slug> rebase origin/dev
    ```
  - Merge:
    ```bash
    # From the superproject root (not inside worktree)
    git -C sst/opencode fetch origin
    git -C sst/opencode checkout dev
    git -C sst/opencode merge --no-ff wip/<slug>
    git -C sst/opencode push origin dev
    ```
  - Prune and remove:
    ```bash
    # Remove the directory first to avoid ghosts
    rm -rf sst/opencode/worktrees/<slug>
    git -C sst/opencode worktree prune -v
    # Optionally delete the branch after it has merged and is remote-tracked
    git -C sst/opencode branch -d wip/<slug>
    git -C sst/opencode push origin :wip/<slug>
    ```

- Safe Operations
  - Prevent branch deletion while a worktree still exists: use hook (see Governance) or run `git worktree list` and abort if the branch is in any listing.
  - Recover broken/ghost worktrees: remove dead paths from `.git/worktrees/*` and use `git worktree prune -v`; re‑add with `worktree add` if needed.
  - Lock a worktree you don’t want pruned:
    ```bash
    git -C sst/opencode worktree lock sst/opencode/worktrees/<slug>
    git -C sst/opencode worktree unlock sst/opencode/worktrees/<slug>
    ```

- Canonical Worktree Scripts (guardrails)
  - Create (new feature):
    ```bash
    repo=sst/opencode; slug="$1"; base=origin/dev; dir="$repo/worktrees/$slug";
    test -z "$slug" && { echo "usage: new-wt <slug>"; exit 2; }
    test -e "$dir" && { echo "exists: $dir"; exit 1; }
    git -C "$repo" fetch --all --prune && \
    git -C "$repo" worktree add "$dir" -b "wip/$slug" "$base" && \
    git -C "$dir" config pull.ff only
    ```
  - List/health:
    ```bash
    repo=sst/opencode
    git -C "$repo" worktree list
    git -C "$repo" for-each-ref --format='%(refname:short) -> %(upstream:short) [%(ahead)/%(behind)]' refs/heads/wip/
    ```
  - Prune (safe):
    ```bash
    repo=sst/opencode; ghost=$(git -C "$repo" worktree list | awk '/^\s*$/ {next} {print $1}' | xargs -I{} test -d {} || echo missing)
    git -C "$repo" worktree prune -v
    ```

- Performance
  - Enable background maintenance:
    ```bash
    git -C sst/opencode maintenance start
    git config --global maintenance.strategy incremental
    ```
  - Use shared objects (default with worktrees); avoid duplicating clones.
  - Large histories: consider partial clone for heavy submodules or forks:
    ```bash
    git clone --filter=blob:none --recurse-submodules <url> <path>
    ```
  - Sparse checkout for wide monorepos:
    ```bash
    git -C sst/opencode sparse-checkout set 'packages/*' 'src/*'
    ```

- Collaboration
  - PR mapping: one worktree ↔ one PR from `riatzukiza/*:wip/<slug>` to upstream `sst/*:dev`.
  - Require upstreams on all `wip/*` branches: `git -C sst/opencode branch --set-upstream-to fork/wip/<slug> wip/<slug>`.
  - Team consistency: adopt the same layout (`worktrees/`), naming, and hooks; document in README and scripts.


## 2) Submodules: Policies and Operations

- Use Submodule vs Subtree vs Package Manager
  - Submodule when the dependency is a repo you do not control or must pin exactly (e.g., `openai/codex`, `agent-shell`).
  - Subtree when you want vendor‑in code with history copied (no detached HEADs, simpler CI).
  - Package manager when available (npm/pnpm, crates, Maven/CLI) for libraries—prefer packages for compile‑time or runtime libs.

- Deeply Nested Submodules (rules)
  - Keep depth shallow by default; avoid long chains where possible.
  - Require documentation for any nested level >1 and rationale for using submodule instead of package/subtree.
  - Prefer consistent remotes (SSH or HTTPS) and use relative URLs in `.gitmodules` for portability.

- Pinning and Update Cadence
  - Pin to a commit for reproducibility; bump via PR with changelog notes.
  - Cadence: weekly for fast‑moving deps, monthly otherwise; emergency bumps for security.
  - Optionally track a branch in `.gitmodules`:
    ```ini
    [submodule "promethean"]
      path = promethean
      url = ../promethean
      branch = heal-2025-10-22
    ```

- Recommended Configs
  - Enable recursion on common ops:
    ```bash
    git config --global submodule.recurse true
    git config --global fetch.recurseSubmodules on-demand
    git config --global status.submoduleSummary true
    git config --global diff.submodule log
    ```
  - Per‑module update strategy:
    ```ini
    [submodule "opencode-openai-codex-auth"]
      update = rebase
    [submodule "openai/codex"]
      update = checkout
    ```

- Core Workflows
  - Add a submodule:
    ```bash
    git submodule add --name <name> <url> <path>
    git submodule update --init --recursive
    git commit -m "chore: add submodule <name>"
    ```
  - Sync remotes after URL change:
    ```bash
    git submodule sync --recursive
    git submodule foreach --recursive 'git remote -v'
    ```
  - Set tracking branch:
    ```bash
    git config -f .gitmodules submodule.<name>.branch <branch>
    git submodule sync --recursive
    ```
  - Bump a submodule:
    ```bash
    git -C <path> fetch --all
    git -C <path> checkout <commit-or-branch>
    git add <path>
    git commit -m "chore(submodule): bump <name> to <ref>"
    ```
  - Verify SHAs are reachable (pre‑push):
    ```bash
    git submodule foreach --recursive 'git fetch --quiet --all; git rev-parse --verify HEAD^{commit}'
    ```
  - Absorb gitdirs (clean up .git file redirections):
    ```bash
    git submodule absorbgitdirs --recursive
    ```
  - Detached HEAD handling: prefer setting `branch` in `.gitmodules`; otherwise explicitly checkout a branch before commits.

- CI/CD Tips
  - actions/checkout:
    ```yaml
    - uses: actions/checkout@v4
      with:
        submodules: recursive
        fetch-depth: 0
        persist-credentials: false
    ```
  - Cache heavy dependencies: pnpm store, bun, cargo, and Clojure caches; avoid caching `.git/modules` directly.
  - Failure modes: missing submodule commit on remote → ensure submodule commit pushed before superproject; use pre‑push hook (Governance).


## 3) Combined Worktrees + Submodules

- Known Pitfalls
  - Per‑worktree state shares a single `.git/modules` directory; careless removal of a worktree must not delete `.git/modules/<path>`.
  - `git submodule absorbgitdirs` interacts with worktrees; run from the superproject root to avoid inconsistent paths.
  - Updating submodules from the wrong worktree can leak changes to the wrong branch—always use `git -C <worktree>`.

- Safe Patterns
  - Always scope commands with `git -C sst/opencode/worktrees/<slug>` for submodule bumps and commits.
  - After a bump, immediately `git submodule status` and push the submodule’s commit first, then the superproject pointer.
  - For nested submodules, use `--recursive` consistently and test `git submodule update --init --recursive` in CI.

- Cross‑Repo Changes (atomicity)
  - Strategy: branch per repo (`wip/<topic>`) plus a coordination PR that documents order of merges.
  - Optionally gate with a version manifest file in the superproject to verify all SHAs.
  - Recovery: if a submodule PR merges first, rebase superproject PR to the merged commit and re‑push.


## 4) Governance and Safety

- Hooks (install via repo-local .githooks/ and core.hooksPath)
  - `pre-commit`: block if any submodule is dirty.
    ```bash
    #!/usr/bin/env bash
    if git submodule foreach --quiet 'git diff --quiet --ignore-submodules=dirty' | grep -q .; then
      echo "Dirty submodule detected; commit aborted" >&2; exit 1; fi
    ```
  - `pre-push`: ensure submodule SHAs exist on their remotes.
    ```bash
    #!/usr/bin/env bash
    set -euo pipefail
    git submodule foreach --recursive 'git ls-remote --exit-code origin $(git rev-parse HEAD) >/dev/null || { echo "$name: HEAD not on origin" >&2; exit 1; }'
    ```
  - `pre-push` (worktree safety): block push if branch is checked out in another worktree with unmerged changes.
  - `pre-delete-branch` (custom): refuse deleting a branch that appears in `git worktree list`.

- Auditing Scripts (weekly)
  - Drift report:
    ```bash
    git submodule foreach --recursive 'echo $name; git status -sb'
    git -C sst/opencode for-each-ref --format='%(refname:short) [%(upstream:short)] A:%(ahead) B:%(behind)' refs/heads/wip/
    ```
  - Unreachable submodule SHAs (after GC on remotes): use `git fsck --connectivity-only` in submodules on CI.

- Access and Security
  - `safe.directory` entries for shared paths; enforce signed commits and tags in protected branches.
  - Use relative URLs in `.gitmodules`:
    ```ini
    url = ../promethean
    ```
  - Mirror remotes for critical deps; fall back URLs in read‑only CI environments.


## 5) CI/CD Templates (GitHub Actions)

- Build with recursive submodules
  ```yaml
  name: build
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            submodules: recursive
            fetch-depth: 0
        - uses: actions/setup-node@v4
          with: { node-version: '22' }
        - run: corepack enable
        - run: pnpm install --frozen-lockfile
        - run: pnpm -r build
  ```

- Validate submodule integrity
  ```yaml
  - name: Validate submodule SHAs
    run: |
      git submodule foreach --recursive 'git fetch --quiet --all'
      git submodule status --recursive
  ```

- Version manifest publish (optional)
  ```yaml
  - name: Write manifest
    run: |
      git submodule status --recursive > .build/submodule-manifest.txt
  - uses: actions/upload-artifact@v4
    with: { name: submodule-manifest, path: .build/submodule-manifest.txt }
  ```

- Parallelize per‑worktree tests (matrix)
  ```yaml
  strategy: { matrix: { worktree: [ '1-1-filter-stray-osc-iterm2-payloads', '2-1-normalize-modifier-decoding-alt-meta-ctrl-combos' ] } }
  steps:
    - run: git -C sst/opencode worktree add "worktrees/${{ matrix.worktree }}" -b "wip/${{ matrix.worktree }}" origin/dev
    - run: pnpm test --filter "${{ matrix.worktree }}*"
  ```

- Caching strategies
  ```yaml
  - uses: actions/cache@v4
    with:
      path: |
        ~/.pnpm-store
        ~/.bun
        ~/.cargo/registry
        ~/.cargo/git
      key: ${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml', '**/bun.lockb', '**/Cargo.lock') }}
  ```


## 6) Developer Onboarding & Docs

- Bootstrap Script (outline)
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  root=${1:-/home/err/devel}
  cd "$root"
  # Ensure toolchain
  command -v git pnpm bun >/dev/null || { echo "Install git/pnpm/bun"; exit 1; }
  # Clone or pull
  # git clone --filter=blob:none --recurse-submodules <superproject-url> devel
  git submodule update --init --recursive --jobs 8
  git config submodule.recurse true
  git config fetch.recurseSubmodules on-demand
  git config status.submoduleSummary true
  git -C sst/opencode maintenance start || true
  ```

- Docs Structure
  - `docs/worktrees-and-submodules.md` (this doc)
  - `docs/reports/` for audits and one‑off analyses
  - Quickstart: 10 commands to get productive; Failure playbook per section.

- Common Failure Playbook
  - Ghost worktree: `git -C <repo> worktree prune -v; rm -rf <path>; re‑add`.
  - Submodule commit missing on remote: push submodule first, then superproject pointer.
  - Detached HEAD in submodule: `git -C <path> switch -c bump/<topic>` or set `.gitmodules` branch.
  - “fatal: not a git repository: <path>/.git/modules/<sub>”: `git submodule absorbgitdirs --recursive`.

- First 90 Minutes Rollout (for this workspace)
  1) Configure global ignore for `worktrees/` (`core.excludesfile`); consider repo-level `worktrees/` only if adopted team-wide. Keep `**/.serena/` in repo `.gitignore` if needed.
  2) `git -C sst/opencode worktree prune -v` and remove stale directories.
  3) Ensure all `wip/*` branches have upstreams on the fork (`riatzukiza/*`).
  4) Install hooks (pre‑commit/pre‑push) repo‑wide via `core.hooksPath`.
  5) Enable `maintenance start` on large repos; set global submodule configs.
  6) Update CI to `actions/checkout@v4` with `submodules: recursive`, `fetch-depth: 0`.


## 7) Checklists & Reference

- Add New Submodule
  - [ ] `git submodule add --name <name> <url> <path>`
  - [ ] `git submodule update --init --recursive`
  - [ ] Add `.gitmodules` `branch = <branch>` if needed; `git submodule sync`
  - [ ] Commit and push; verify CI passes with recursive checkout.

- Bump Submodule
  - [ ] `git -C <path> fetch --all && git -C <path> checkout <ref>`
  - [ ] `git add <path> && git commit -m "chore(submodule): bump <name> to <ref>"`
  - [ ] Push submodule repo first; then push superproject.

- Create New Worktree
  - [ ] `git -C <repo> worktree add worktrees/<slug> -b wip/<slug> origin/dev`
  - [ ] Set upstream; configure `pull.ff only`.

- Merge Worktree
  - [ ] Rebase onto `origin/dev`; resolve; test
  - [ ] Merge `--no-ff` into `dev`; push; delete branch (local+remote)
  - [ ] Remove worktree dir; `git worktree prune -v`

- Cleanup
  - [ ] `git worktree list`; delete dead dirs; `prune -v`
  - [ ] `git submodule sync --recursive`; `absorbgitdirs --recursive`

- Emergency Rollback
  - [ ] Reset superproject pointer to previous commit
  - [ ] Revert submodule bump commits (in submodule and/or superproject)
  - [ ] Communicate manifest of expected SHAs

- Top 20 Pitfalls & Mitigations
  1) Deleting a branch still in a worktree → Guard with a hook; check `git worktree list`.
  2) Pushing superproject before submodule commit exists → Pre‑push check; push submodule first.
  3) Dirty submodule during commit → Pre‑commit hook blocks; clean or commit in submodule.
  4) Ghost worktrees after manual dir delete → Use `git worktree prune -v`.
  5) Detached HEAD in submodule → Set `branch` in `.gitmodules` or explicitly checkout a branch.
  6) Inconsistent `.gitmodules` URLs across machines → Use relative URLs; `git submodule sync --recursive`.
  7) Missing recursive checkout in CI → `actions/checkout@v4` with `submodules: recursive` and `fetch-depth: 0`.
  8) Large repo slowness → Enable `git maintenance`; consider partial clone/sparse checkout.
  9) Worktree submodule updates from wrong branch → Always scope with `git -C <worktree>`.
  10) Unreachable submodule SHAs (GC on remote) → Periodic `git fsck` checks; bump to reachable ref.
  11) Over‑nested submodules → Prefer package manager or subtree; document justification.
  12) Force‑push on protected branches → Protect branches; deny non‑fast‑forwards in server or hooks.
  13) Conflicting `.serena/` or tool artifacts in worktrees → Ignore via `.gitignore`; keep clean diffs.
  14) Submodule HEAD on unintended branch → Use `submodule.<name>.update` policy and `.gitmodules` `branch`.
  15) Forgotten upstream on `wip/*` → Enforce upstream with a linter script; refuse pushes without upstream.
  16) Misusing `git rm -r` on submodule path → Use `git submodule deinit -f <path>; rm -rf <path>; git rm <path>`.
  17) Stale submodule remote URLs → `git submodule sync --recursive` after `.gitmodules` edits.
  18) CI caches polluting submodule state → Avoid caching `.git/modules`; cache only objects/registries.
  19) Manual `cd` in scripts → Use `git -C` with absolute paths for reproducibility.
  20) Losing `.git/modules` during cleanup → Never delete `.git/` internals; use `absorbgitdirs` and `prune`.

- Compact Config Appendix
  ```ini
  # .gitconfig (workspace defaults)
  [submodule]
    recurse = true
  [fetch]
    recurseSubmodules = on-demand
  [status]
    submoduleSummary = true
  [diff]
    submodule = log
  [merge]
    ff = only
  [core]
    hooksPath = .githooks
  
  # .gitmodules (examples)
  [submodule "promethean"]
    path = promethean
    url = ../promethean
    branch = heal-2025-10-22
  [submodule "openai/codex"]
    path = openai/codex
    url = ../openai/codex
    # pin to release tags where feasible
  ```

— End —

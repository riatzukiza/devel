# Submodules Status (Recursive)

Date: 2025-11-13

This report captures the current recursive submodule status and highlights recent changes since the superproject's recorded pointers. Use it to reconcile pointer bumps and ensure CI clones update cleanly with `--recursive`.

## Changed submodules since recorded pointers

The following output is equivalent to `git submodule summary` and shows the range and top messages for each changed submodule at the root level:

```
* orgs/open-hax/codex 0d3a228...c13f329 (24):
  > ignore stryker files
  > add a new test
  > remove duplicate import
  > Merge remote-tracking branch 'origin/main'
  > Merge remote-tracking branch 'origin/device/stealth' into device/yoga
  < chore: update .gitignore to exclude build artifacts
  > 3.0.3
  > updated logging tests
  > Update auth configuration and request handling
  > 3.0.2
  > logging spec
  > respect host prompt cache keys and preserve non-usage errors
  > 3.0.1
  > more cacheing and better compaction
  > Fix cache parity issues with OpenCode runtime
  > this is a thing
  > update gpt-5 context size from 272k to 400k in all config examples
  > bump version
  > stuff!
  > stryker: output JSON/HTML reports to coverage/, reduce console noise (logLevel=warn, no mutant listing)
  > tests: raise coverage and mutation score; ignore static mutants; add prompt-fingerprinting and auth constant tests; harden auth request assertions and logger branches
  > Resolve merge fallout: unify code/tests on feat/tool-remap flow, streamline README, regenerate lockfile; repo builds cleanly and tests pass
  > merge?
  > cacheing

* orgs/riatzukiza/promethean c4fb2379f...6c7c97681 (32):
  > update kanban subproject to fa637ae3a
  > fix indexer state update: increment consecutiveErrors and savedAt tim...
  > update kanban subproject to 32363a646495dd5ec751f272f111dd58b268cf5e
  > chore: update subprojects to latest commits
  > chore: update subproject commits for kanban and mcp
  > update kanban subproject to latest commit
  > fix indexer state tracking
  > delete test-commit-fix.md, test-simple-kanban.json, test-wip-enforcem...
  > fix bash printf usage by explicitly calling builtin with -- to avoid ...
  > fix indexer state reset: restore default consecutive errors and updat...
  > fix indexer error count and save timestamp
  > update mcp subproject to cb63e81da13d932573346ab716fc9b079a48c919
  > fix indexer error count and save timestamp
  > chore: update kanban subproject to commit 2bc22d1bc212880382774b24e65...
  > chore: update kanban subproject commit to b4d12d87e
  > fix indexer consecutive errors count and saved at timestamp
  > chore: update kanban subproject to 84716479413d95e382752549e3d398c588...
  > chore: update kanban subproject to e6727b087b84cf54d17230d8d8dcf06755...
  > fix consecutive errors count and saved timestamp
  > fix indexer state: update consecutiveErrors and savedAt timestamps
  > fix: stabilize directory adapter backup and error handling with compr...
  > chore: update 4 file(s) [auto]
  > add express server with type safety and module support
  > fix consecutive errors count and saved at timestamp
  > chore: update 1 file(s) [auto]
  > feat(mcp): migrate from fastify to express with oauth middleware alig...
  > fix consecutive errors count and save timestamp
  > fix indexer state: update consecutive errors and saved at timestamps
  > Update submodule references after adding build artifact ignores
  > add .gitignore entries for build, test, and cache artifacts
  > Update submodule references after commits
  > feat: add session orchestrator plugin and opencode client integration
```

Notes:
- `+` in the status snapshot (below) indicates the submodule worktree is ahead of the superproject pointer and requires a pointer bump in the parent repo after pushing the submodule.
- The Promethean submodule includes many nested submodules; their current SHAs are captured in the recursive snapshot.

## Recursive status snapshot

Output of `git submodule status --recursive` as of this report:

```
 cdc2b11b79572dac79ec7a119b9cb8b0196da59a orgs/bhauman/clojure-mcp (v0.1.10-alpha-40-gcdc2b11)
 24bfe873d836a87751ef59897c7c787e04695fc8 orgs/moofone/codex-ts-sdk (v0.0.7-24-g24bfe87)
+c13f3296f610be06242ddd96736bcf577e843b98 orgs/open-hax/codex (v3.1.0-75-gc13f329)
 2f9ad78b97c1a5d26e48ea1677fd79a81469132f orgs/openai/codex (rust-v0.0.2504301132-1629-g2f9ad78b)
 0de8e0dc13f56c17d735aa0bcba078cc4b7d3b1b orgs/riatzukiza/agent-shell (heads/device/stealth)
 7535e18eb080760695f4f44310c45fda1d9d0402 orgs/riatzukiza/book-of-shadows (heads/device/stealth)
 4942cbd06ece2f3f0b1ad982670a6c9b0dde3f3b orgs/riatzukiza/desktop (heads/device/stealth)
 10cbf346014ba9b93d742f35e6072af38891e266 orgs/riatzukiza/dotfiles (heads/device/stealth)
 bcb3dfbcd9f44524bc9070e89f9348b7fc82454c orgs/riatzukiza/goblin-lessons (heads/device/stealth)
 5798a6d61211cf9d8b630fbdc1424d67bb5baff2 orgs/riatzukiza/openhax (heads/device/stealth)
+6c7c976817215d9c194c1920984cffc2c11a1d9e orgs/riatzukiza/promethean (heads/device/stealth)
 b3217d5c55bc6cebc505f589e930497f9e05fb68 orgs/riatzukiza/promethean/packages/agent-os-protocol (heads/device/stealth)
 1cf332a3ed7e42ef99e09decb9bb9e714d856bb6 orgs/riatzukiza/promethean/packages/ai-learning (heads/device/stealth)
 69ee5d5042b492099dabae243e19e8980610206d orgs/riatzukiza/promethean/packages/apply-patch (heads/device/stealth)
 1a15eb7c919f0002ad907268a1430f5ec92950c1 orgs/riatzukiza/promethean/packages/auth-service (heads/device/stealth)
 9418744ade52bb602fd97448f759f9af51f7018b orgs/riatzukiza/promethean/packages/autocommit (heads/device/stealth)
 6d8cfec7b7fe7bc2ba4f65991021463cb887ad72 orgs/riatzukiza/promethean/packages/build-monitoring (heads/device/stealth)
 4908b5ce91da7600f7ed8882acae25df1263bb96 orgs/riatzukiza/promethean/packages/cli (heads/device/stealth)
 aefdf7fb22fb6bc861b48a2a0d9fffc39de703fe orgs/riatzukiza/promethean/packages/clj-hacks (heads/device/stealth)
 4cb2550f82ae4529d5b6e887f73738fc49cfb410 orgs/riatzukiza/promethean/packages/compliance-monitor (heads/device/stealth)
 ae9795d575603e9bdfd45a6bae26fee172a7501a orgs/riatzukiza/promethean/packages/dlq (heads/device/stealth)
 3961869a0363d2ebf06ad72dafa267635284fb9f orgs/riatzukiza/promethean/packages/ds (heads/device/stealth)
 80f87382cc062e2bc1293e5eec6fccb156eefef1 orgs/riatzukiza/promethean/packages/eidolon-field (heads/device/stealth)
 43917226019edd7cf807c5af8a975b31fb40e2ce orgs/riatzukiza/promethean/packages/enso-agent-communication (heads/device/stealth)
 8dac619c5a39a9b21c246821a9fa1ca485302dbd orgs/riatzukiza/promethean/packages/http (heads/device/stealth)
 fa637ae3a45e5773a92ac8c1fdaed1e56754fe4b orgs/riatzukiza/promethean/packages/kanban (heads/device/stealth)
 b2629e456e93995d8663a5cdf434a11ac05763ee orgs/riatzukiza/promethean/packages/logger (heads/device/stealth)
 feab6edf28ab8c95a5c59c452dbf7c9ddaf1818b orgs/riatzukiza/promethean/packages/math-utils (heads/device/stealth)
 cb63e81da13d932573346ab716fc9b079a48c919 orgs/riatzukiza/promethean/packages/mcp (heads/device/stealth)
 f68f5df85759b99bdd6f699c6625454526d2578d orgs/riatzukiza/promethean/packages/mcp-dev-ui-frontend (heads/device/stealth)
 4bbe09e169004341082837371ed4eaacde89c17e orgs/riatzukiza/promethean/packages/migrations (heads/device/stealth)
 738fc4d771e9c3d56f3c0edeed898324e5cc610c orgs/riatzukiza/promethean/packages/naming (heads/device/stealth)
 4415a7e464edd8f55267b73cd155c03e8987186b orgs/riatzukiza/promethean/packages/obsidian-export (heads/device/stealth)
 d35a9d090344e263239b66c87c5f754f4d853430 orgs/riatzukiza/promethean/packages/omni-tools (heads/device/stealth)
 e04252aee80e98012486cff75afecbbe9e671bbd orgs/riatzukiza/promethean/packages/opencode-hub (heads/device/stealth)
 7fce0b24a864b5213b0a85d82d0cdac16fe9c205 orgs/riatzukiza/promethean/packages/persistence (heads/device/stealth)
 ad23f34d04a98a199fae502e6147259fe4c6707f orgs/riatzukiza/promethean/packages/platform (heads/device/stealth)
 551dec02c2d457bb1543fae9e6afefcd90a4acd5 orgs/riatzukiza/promethean/packages/plugin-hooks (heads/device/stealth)
 e551f1a61351c877055f621679e98f9a0508fc9d orgs/riatzukiza/promethean/packages/report-forge (heads/device/stealth)
 46e930f8013f1cdae60dc5da5722b42d11edc9b5 orgs/riatzukiza/promethean/packages/security (heads/device/stealth)
 c3904273b672c83fed6545555c556bd6dd4ff3a6 orgs/riatzukiza/promethean/packages/shadow-conf (heads/device/stealth)
 77e0dee5a06d1e3414eaac315f41c101c67b9e8c orgs/riatzukiza/promethean/packages/snapshots (heads/device/stealth)
 9a30ebffac818e176428d6b77446f8e5525914a6 orgs/riatzukiza/promethean/packages/test-classifier (heads/device/stealth)
 d78910dd5323bd25b4f2f2c379020cc48e65fae8 orgs/riatzukiza/promethean/packages/test-utils (heads/device/stealth)
 9dc663184b5809bad1b3a84c17125306db4ec126 orgs/riatzukiza/promethean/packages/utils (heads/device/stealth)
 1301465212d3479ecb13a6202276ec32981fcdf3 orgs/riatzukiza/promethean/packages/worker (heads/device/stealth)
 d90d31da86eb1d4db845fc8e93af7f8ba28c42d5 orgs/riatzukiza/riatzukiza.github.io (heads/device/stealth)
 625975057846629f42886586c5f12c05682b06a2 orgs/riatzukiza/stt (heads/device/stealth)
 b71a38d33395f3210aeb53f966dd5983e9fbffb9 orgs/sst/opencode (latest-288-gb71a38d3)
```

## Next steps

- Push the updated submodule commits (if not already pushed) and bump the superproject pointers for entries marked with `+`.
- Re-run `git submodule status --recursive` and commit the pointer updates in the root repository.
- Optionally regenerate per‑org manifests under `docs/manifests/` if you maintain those snapshots.

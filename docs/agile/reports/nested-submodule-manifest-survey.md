# Nested Submodule Manifest Coverage Survey

Date: 2025-11-05

## Top-Level `.gitmodules`
| Path | Remote | Notes |
| --- | --- | --- |
| promethean | git@github.com:riatzukiza/promethean.git | deep dependency tree with test repos and service packages |
| dotfiles | git@github.com:riatzukiza/dotfiles.git | bootstrap scripts + symlinks |
| agent-shell | git@github.com:riatzukiza/agent-shell.git | Emacs extensions |
| clojure-mcp | git@github.com:bhauman/clojure-mcp.git | external upstream |
| open-hax/codex | git@github.com:open-hax/codex.git | npm workspace |
| openai/codex | org-14957082@github.com:openai/codex.git | GitHub App scoped remote |
| stt/opencode | git@github.com:sst/opencode.git | upstream remote with nested forks |
| moofone/codex-ts-sdk | git@github.com:moofone/codex-ts-sdk.git | TypeScript SDK |
| riatzukiza/openhax | https://github.com/riatzukiza/openhax.git | HTTPS remote |
| riatzukiza/riatzukiza.github.io | git@github.com:riatzukiza/riatzukiza.github.io.git | GitHub Pages static site |
| riatzukiza/desktop | ./riatzukiza/desktop | local-only repo, no remote |
| riatzukiza/book-of-shadows | ./riatzukiza/book-of-shadows | local-only |
| riatzukiza/goblin-lessons | ./riatzukiza/goblin-lessons | local-only |
| stt | ./stt | local umbrella repo containing many variants |

Key requirements identified:
- Support SSH, HTTPS, and scoped GitHub App remotes.
- Handle relative/local paths (no remote) seamlessly.
- Allow manifest entries to override authentication strategy per repo.

## `promethean/.gitmodules`
Highlights:
- Mix of external remotes (`git@github.com:riatzukiza/*`, `https://github.com/ingydotnet/git-subrepo.git`).
- Local test repositories (paths inside repo using `./`).
- Deep nesting through `packages/` hierarchy.

Requirements:
- Graph must preserve relative depth for staged operations.
- Need metadata for classifying repos (test vs production) to gate operations.

## `stt/.gitmodules`
Highlights:
- Umbrella repo referencing multiple local clones for feature branches.
- Special case `feat/lsp-sdk` using HTTPS remote pointing back to `riatzukiza/stt` with alternative branch semantics.

Requirements:
- Manifest must differentiate between tracking branches vs frozen snapshots.
- Provide per-entry bootstrap hooks (e.g., checkout branch, run setup script).

## Manifest Coverage Implications
1. **Remote Types**: Provide `auth` stanza supporting `ssh`, `https`, `github-app`, and `local-path`.
2. **Categories**: Tag entries (`core`, `test`, `sandbox`) to allow selective operations.
3. **Branch Strategy**: Record default branch, pinned commit, or tag.
4. **Bootstrap Hooks**: Optional scripts to run after clone/init and before sync.
5. **Sparse Filters**: Allow specification of sparse-checkout rules for large repos.
6. **Dependencies**: Capture parent-child relationships beyond filesystem nesting.
7. **Resumability**: Store last-known commit or revision for verification.

## Next Steps
- Incorporate findings into manifest schema design.
- Validate schema against promthean/stt submodule layouts.
- Define environment profiles for credential hints (workstation vs CI).

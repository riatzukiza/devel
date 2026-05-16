# Fork + remote conventions for `orgs/shuv/*`

This workspace mirrors repos from `shuv1337/*` under `orgs/shuv/*`.

## Git remote naming

For each checked out submodule under `orgs/shuv/<repo>`:

- `origin` = your working fork (default owner: `riatzukiza`)
- `upstream` = the source mirror you pull from / open PRs against (`shuv1337/<repo>`)

This is the most common convention in OSS workflows:

- you push branches to `origin`
- you pull updates from `upstream`
- you open PRs from `origin:<branch>` to `upstream:<branch>`

(“downstream” is typically used for *consumers* of a repo, not a second remote.)

## Repo-level exceptions

Some repos cannot currently follow the default `origin=git@github.com:riatzukiza/<same-name>.git` rule:

- `waha-tui`
  - fork creation repeatedly hit GitHub secondary throttling ("was submitted too quickly")
  - until fork exists, `.gitmodules` and `origin` remain `shuv1337/waha-tui`

- `opencode-openai-codex-auth`
  - fork creation repeatedly hit GitHub secondary throttling ("was submitted too quickly")
  - until fork exists, `.gitmodules` and `origin` remain `shuv1337/opencode-openai-codex-auth`

## Where the fork URL is stored

- `.gitmodules` is configured so new clones of the monorepo will initialize submodules against your fork (`origin`) whenever possible.
- `upstream` is a local remote inside each submodule checkout.

If you clone this monorepo onto a new machine, you may need to run a small setup step to add `upstream` remotes after `git submodule update --init --recursive`.

# Fork + remote conventions for `orgs/ussyverse/*` (mojomast mirror)

This workspace mirrors the public repositories visible under:

- https://github.com/mojomast

into the monorepo under:

- `orgs/ussyverse/<repo>`

## Git remote naming

For each checked out submodule under `orgs/ussyverse/<repo>` (that comes from `mojomast/*`):

- `origin` = your working fork (default owner: `riatzukiza`)
- `upstream` = the source repo you sync from / PR back to (`mojomast/<repo>`)

This is the standard OSS convention:

- push branches to `origin`
- pull updates from `upstream`
- open PRs from `origin:<branch>` to `upstream:<branch>`

(“downstream” is usually reserved for *consumers* of a repo, not a second git remote.)

## Fork-first submodule URLs

The parent monorepo’s `.gitmodules` has been updated so that, for mojomast-derived repos, the **submodule URL points to your fork** (SSH):

- `git@github.com:riatzukiza/<fork-repo>.git`

and the mojomast repo is available as the `upstream` remote inside each submodule checkout.

Note: some mojomast repos are themselves forks; GitHub’s fork network can cause a fork to be shared with an existing fork you already have. The important invariant is:

- `origin` is writable by you
- `upstream` points at `mojomast/<repo>` for PR targets

## Not mirrorable as submodules (empty repos)

These mojomast repos appear to be empty (no commits / unborn default branch), so `git submodule add` cannot check them out:

- `devussy2`
- `devussy-push-test`

They are therefore not present under `orgs/ussyverse/` right now.

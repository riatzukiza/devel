# Eta-mu GitHub App bootstrap

Eta-mu should use a GitHub App identity so comments and check runs appear under the app user (for example `app/eta-mu`) instead of `github-actions[bot]`.

## Recommended app settings

### Name / slug
- Name: `eta-mu`
- Slug: `eta-mu`

### Repository permissions
- Contents: **Read and write**
- Issues: **Read and write**
- Pull requests: **Read and write**
- Checks: **Read and write**
- Metadata: **Read**

This permission set is enough for the current eta-mu design:
- read/write comments on issues and pull requests
- inspect PR review threads and review comments
- push autofix commits directly to same-repo PR branches
- create authoritative app-owned merge-status checks such as `eta-mu-review-gate`

### Subscribe to events
- `issues`
- `issue_comment`
- `pull_request`
- `pull_request_review`
- `pull_request_review_comment`

## Secrets expected by workflows

Store these in each target repository or an organization-level Actions secret set:

- `ETA_MU_APP_ID`
- `ETA_MU_APP_PRIVATE_KEY`

The workflow should mint an installation token with:

```yaml
- id: eta_mu_token
  uses: actions/create-github-app-token@v1
  with:
    app-id: ${{ secrets.ETA_MU_APP_ID }}
    private-key: ${{ secrets.ETA_MU_APP_PRIVATE_KEY }}
```

Then pass `${{ steps.eta_mu_token.outputs.token }}` as `GITHUB_TOKEN` to eta-mu.

## Merge policy note

Eta-mu does not replace GitHub branch protection. The intended model is:

- GitHub branch/ruleset requires review thread resolution
- GitHub branch/ruleset requires the app-owned check `eta-mu-review-gate`
- eta-mu may still comment on or answer CodeRabbit threads, but the merge blocker becomes eta-mu's own check result

This makes the merge gate survive transient bot outages while still letting eta-mu coordinate with CodeRabbit and humans.

## Limitations

- Same-repo PRs can be autofixed directly when the app has `contents: write`.
- Fork PRs require the eta-mu app to also be installed on the fork if you want direct push-based autofix.

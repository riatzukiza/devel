# SST Organization Manifest — Local vs GitHub Access

Date: 2025-11-06
Root workspace: /home/err/devel

This manifest compares repositories you have access to in the GitHub org `sst` with the repos currently tracked locally in this workspace.

## Summary
- Accessible on GitHub (sst): 59 repos
- Tracked locally (sst remotes): 4 repos
- Accessible but not tracked locally: 55 repos

## Accessible in `sst` (via GitHub)
opentui
opencode
homebrew-tap
sst
models.dev
opencode-copilot-auth
opencode-bench
opencode-sdk-python
opencode-zed-extension
social-cards
opencode-sdk-go
v2
bun-ffi-structs
opencode-sdk-js
console
opencode-anthropic-auth
openauth
agents-benchmark
opencode-github-copilot
opencontrol
provider
astro-sst
pulumi-sst
demo-notes-app
kysely-data-api
guide
monorepo-template
ion
test-app
pulumi-supabase
terraform-provider-supabase
telemetry
pulumi-planetscale
terraform-provider-planetscale
pulumi-namecheap
pulumi-railway
scoop-bucket
torpedo
extension
demo-ai-app
aws-cdk
sst-start-demo
tutorial-links-app
freenextjsforjim.biz
sst-cdk
sqr
isserverlessready
v1-conf
sst-weekly-repos
identity
ideal-stack-preview
aws-lambda-nodejs-runtime-interface-client
slack-support
tbd
serverless-next.js
aws-lambda-java-libs
lerna-yarn-starter
serverless-stack-resources-sample

## Tracked locally (remotes under `sst/*`)
- opencode → path: stt/opencode (remote: git@github.com:sst/opencode.git)
- opencode-bench → path: stt/opencode-bench (remote: git@github.com:sst/opencode-bench.git)
- opencode-sdk-python → path: stt/opencode-sdk-python (remote: git@github.com:sst/opencode-sdk-python.git)
- opentui → path: stt/opentui (remote: git@github.com:sst/opentui.git)

Note: Local folder prefix `stt/` is a path typo; upstream org is `sst`. See "Organizational Structure" in docs/worktrees-and-submodules.md for safe rename guidance.

## Accessible but not tracked locally (gap set)
- homebrew-tap
- sst
- models.dev
- opencode-copilot-auth
- opencode-zed-extension
- social-cards
- opencode-sdk-go
- v2
- bun-ffi-structs
- opencode-sdk-js
- console
- opencode-anthropic-auth
- openauth
- agents-benchmark
- opencode-github-copilot
- opencontrol
- provider
- astro-sst
- pulumi-sst
- demo-notes-app
- kysely-data-api
- guide
- monorepo-template
- ion
- test-app
- pulumi-supabase
- terraform-provider-supabase
- telemetry
- pulumi-planetscale
- terraform-provider-planetscale
- pulumi-namecheap
- pulumi-railway
- scoop-bucket
- torpedo
- extension
- demo-ai-app
- aws-cdk
- sst-start-demo
- tutorial-links-app
- freenextjsforjim.biz
- sst-cdk
- sqr
- isserverlessready
- v1-conf
- sst-weekly-repos
- identity
- ideal-stack-preview
- aws-lambda-nodejs-runtime-interface-client
- slack-support
- tbd
- serverless-next.js
- aws-lambda-java-libs
- lerna-yarn-starter
- serverless-stack-resources-sample

## Method
- GitHub list: `gh repo list sst --limit 500 --json name` (see actions log)
- Local scan: origin remotes under `/home/err/devel/stt/*` with `git -C <path> remote get-url origin` containing `sst/`

If you want, I can expand the local scan to all nested repos and verify each has a corresponding repo in `sst` (with reachability checks).
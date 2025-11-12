# Nx Daemon Entry & Memory Control

## Context
- Screenshot in the request shows dozens of `node …/nx/src/daemon/server/start.js` processes owned by `pnpm` inside `orgs/riatzukiza/promethean`. Those are spawned whenever the Nx CLI receives a command. The CLI is invoked automatically by Promethean’s background watcher stack.

## Key Code References
- `orgs/riatzukiza/promethean/scripts/nx-watcher.mjs:174-205` executes `pnpm nx <command>` for every batch of file changes. The first invocation spins up the Nx daemon and all subsequent commands reuse it. Failing commands or concurrent batches can spawn additional daemon workers.
- `orgs/riatzukiza/promethean/packages/ecosystem-dsl/src/ecosystem_dsl/core.clj:166-184` generates the PM2 entry (`create-nx-watcher-config`) that always sets `NX_DAEMON=true` and assigns only a `max-memory-restart` for the parent watcher, not for the daemon itself.
- `orgs/riatzukiza/promethean/packages/ecosystem-dsl/ecosystem.config.enhanced.mjs:33-94` is the emitted PM2 config that runs the watcher script and injects the Nx environment.
- `orgs/riatzukiza/promethean/package.json:7-55` declares the workspace commands (`pnpm nx run-many …`, `pnpm nx affected …`) that developers might run manually—these also trigger the daemon.
- `orgs/riatzukiza/promethean/nx.json:11-26` does not override `useDaemonProcess`, so Nx defaults to launching the daemon for every task runner.

## Existing Issues / PRs
- None referenced by the workspace docs or git log.

## Requirements
1. Document precisely where the daemon is spawned so ops/devs can correlate `htop` output with Promethean automation.
2. Provide a repeatable way to limit or disable Nx daemon memory usage (e.g., `NX_DAEMON=false`, `useDaemonProcess:false`, or constrained `NODE_OPTIONS`).
3. Surface runtime commands (`nx daemon`, `nx reset --only-daemon`, PM2 commands) in operational docs so engineers can audit or restart the daemon quickly.

## Definition of Done
- `docs/pm2-enhanced-usage.md` (and mirrored `.github` copy) gains a troubleshooting section that: (a) cites the nx-watcher + PM2 pipeline as the daemon source, (b) shows how to disable the daemon via `NX_DAEMON=false` or `nx.json` runner options, and (c) documents setting `NODE_OPTIONS="--max-old-space-size=<value>"` when starting the watcher/PM2 to hard-cap V8 heap usage for daemon + Nx CLI.
- Include CLI snippets for inspecting/killing the daemon (`nx daemon`, `nx reset --only-daemon`, `pm2 restart nx-watcher`).
- No code changes are required unless we decide to automate the memory limit later; current work is documentation-level guidance for operators.

## Phase Plan
1. **Discovery Recap** – Summarize the nx-watcher pipeline and highlight the exact files/lines where Nx commands fire.
2. **Memory Controls** – Add doc guidance that covers (i) disabling the daemon (`NX_DAEMON=false` or `useDaemonProcess:false`), (ii) limiting heap with `NODE_OPTIONS`, and (iii) leveraging PM2’s `max-memory-restart`/`pm2 restart` workflow.
3. **Operational Runbook** – Ensure the troubleshooting steps live in the PM2 usage doc (plus `.github` mirror) with commands for inspecting, killing, or resetting the daemon so on-call engineers have an immediate reference.

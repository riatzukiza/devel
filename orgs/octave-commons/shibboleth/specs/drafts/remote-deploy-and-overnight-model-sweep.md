# Remote deploy + overnight model sweep

Created: 2026-03-20
Status: draft

## Goal
Ship the current Shibboleth repository state to `error@ussy.promethean.rest`, pay the fork tax, start the containerized stack there, and launch an overnight model sweep that continues to the next model when a model run fails.

## User intent
- Copy the whole repo exactly as it exists now.
- Persist the current working state via Π (commit + tag + push).
- Get the code onto the remote host.
- Start the repo’s containers on the remote host.
- Launch a long-running overnight eval job.
- Ensure model-level failures do not abort the whole sweep.
- Check whether Claude is available on the proxy, but do not block on it.

## Facts
- Remote host is reachable via `ssh error@ussy.promethean.rest`.
- Remote host has: `docker`, `docker compose`, `git`, `tmux`, `systemctl`, `python3`, `rsync`.
- Remote host currently did not report `clojure` or `java` in `PATH`.
- The repo has Dockerfiles and `docker-compose.yml` for `control-plane` and `ui`.
- The eval runner already records per-event errors without aborting the whole run, but there is no model-by-model outer sweep script yet.
- Current repo has uncommitted tracked/untracked changes that should likely be included in the requested snapshot.

## Open questions
1. Should the remote deploy use `git clone/pull` from GitHub after Π, or copy the working tree directly via `rsync`? User asked for “as it is right now”, so direct sync may still be useful even after push.
2. Should the overnight job run on the host or inside the control-plane container? The host lacks confirmed Clojure/Java, so container execution is safer.
3. Should the remote service be managed by `tmux`, `systemd --user`, or left as a detached Docker/container job? `tmux` is the safest no-install option.

## Risks
- The working tree includes local data/cache artifacts; copying literally may be larger/noisier than a source-only deploy.
- Remote proxy/auth env vars must be supplied carefully and not committed.
- A full `docker compose build` on the remote host may take time.
- If the overnight sweep is run as a single eval command, the runner will tolerate request errors, but a process-level failure could still stop the whole batch.

## Plan

### Phase 1 — Snapshot + Π
- Inspect working tree and verification surface.
- Create `.ημ` fork-tax artifacts.
- Commit the current repository state.
- Create a deterministic Π tag.
- Push branch + tag.

### Phase 2 — Remote deployment
- Create a remote deploy directory.
- Sync the repo to the remote host.
- Create a remote `.env` with required runtime variables from the current environment.
- Build and start `docker compose` services on the remote host.

### Phase 3 — Overnight sweep automation
- Add a small script that:
  - fetches `/v1/models`
  - optionally probes Claude separately
  - iterates models one by one
  - runs a per-model eval
  - records failures and continues to the next model
- Run it remotely under `tmux` so it survives disconnects.

### Phase 4 — Verification + handoff
- Verify remote containers are up.
- Verify the overnight job is running.
- Report paths, commands, and how to inspect logs.

## Affected files
- `.ημ/*` (new)
- `scripts/*` (new)
- `specs/drafts/remote-deploy-and-overnight-model-sweep.md`
- `receipts.log`

## Definition of done
- A Π commit and tag exist and are pushed.
- The current repo state exists on `error@ussy.promethean.rest`.
- Remote `docker compose` services are running.
- An overnight model sweep is launched remotely and continues past per-model failures.
- Claude presence is checked and reported.

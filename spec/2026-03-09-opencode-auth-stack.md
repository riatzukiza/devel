# OpenCode Auth Stack

## Goal

Secure the containerized OpenCode deployment with:

- internal OpenCode basic auth via `OPENCODE_SERVER_PASSWORD`
- Tailscale sidecar exposure for remote tailnet access
- GitHub OAuth login restricted to an allowlist
- a localhost-only admin UI for managing the allowlist with an admin password

## Constraints

- Keep OpenCode mounted against the full `/home/err/devel` workspace.
- Keep the shared host OpenCode XDG state mounts.
- Do not expose raw OpenCode directly on host network.
- Do not depend on host PM2.
- Follow the login and allowlist patterns already used by `services/mcp-fs-oauth`.

## Architecture

- `opencode`: internal OpenCode runtime with basic auth enabled.
- `opencode-gateway`: browser-facing reverse proxy with:
  - GitHub OAuth login
  - signed session cookie
  - persistent GitHub allowlist file
  - localhost-only admin UI on a separate port
- host-owned `tailscaled` and host Funnel remain the ingress layer.
- optional raw OpenCode loopback port is exposed for trusted local integrations such as Janus.

## Data

- runtime secrets in `services/opencode-stack/.env` (gitignored)
- persistent gateway auth data in `services/opencode-stack/data/`
- no containerized Tailscale state

## Definition Of Done

- Compose stack includes the OpenCode runtime and gateway only.
- OpenCode requires a password internally.
- Gateway blocks unauthenticated access and only allows GitHub users in the managed allowlist.
- Localhost admin UI can add and remove allowlisted GitHub accounts.
- Host Funnel can proxy to the local gateway without containerizing Tailscale.
- README and example env file document the required secrets and startup flow.

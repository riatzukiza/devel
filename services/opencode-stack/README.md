# OpenCode Stack

Containerized OpenCode runtime with an internal raw server, a GitHub OAuth gateway, and a localhost-only admin UI.

- mounts the entire workspace at `/workspace`
- uses `/workspace/.opencode` as the active config/plugin directory
- shares the host OpenCode XDG config/data/cache/state paths, including the live session database
- keeps raw OpenCode private inside the container and places the public UI behind the gateway
- keeps Tailscale/Funnel on the host instead of inside the container
- exposes the single browser-facing OpenCode gateway on `127.0.0.1:${OPENCODE_PORT:-8789}`
- exposes the localhost-only admin UI on `127.0.0.1:${OPENCODE_ADMIN_PORT:-4097}`
- exposes a raw loopback OpenCode port on `127.0.0.1:${OPENCODE_RAW_PORT:-4098}` for trusted local integrations

## What The Stack Does

- Raw OpenCode listens only on `127.0.0.1:4096` inside the container.
- The gateway proxies authenticated browser traffic to raw OpenCode using `OPENCODE_SERVER_PASSWORD`.
- GitHub OAuth access is checked against a persistent allowlist.
- The allowlist is editable from a separate admin UI that only accepts `localhost` and `127.0.0.1` hostnames.
- Host-owned `tailscaled` and host Funnel should proxy to the existing host gateway on `127.0.0.1:8788`, which then fronts Janus and OpenCode together.
- The OpenCode container also joins `mcp-stack_default` so Janus can reach raw OpenCode directly without exposing it publicly.

## Required Setup

Create `services/opencode-stack/.env` from `services/opencode-stack/.env.example` and set:

- `OAUTH_GITHUB_CLIENT_ID`
- `OAUTH_GITHUB_CLIENT_SECRET`
- `OAUTH_GITHUB_REDIRECT_URI` to the exact callback URL registered in your GitHub OAuth app

`GITHUB_ALLOWED_USERS` is only used to seed the allowlist the first time the stack creates `services/opencode-stack/data/allowlist.json`.

## Password Files

The stack generates and persists local secrets in `services/opencode-stack/data/secrets/` when they are not already present:

- `opencode-server-password.txt`
- `admin-password.txt`
- `session-secret.txt`

## Start The Stack

From the repo root:

```bash
pnpm docker:stack up opencode -- --build
pnpm docker:stack ps opencode
pnpm docker:stack logs opencode -- -f
```

If you only want to validate the OpenCode container and gateway before configuring Tailscale, start just the main service:

```bash
docker compose -f services/opencode-stack/docker-compose.yml up -d --build opencode
```

## Local URLs

- OpenCode gateway behind Janus front door: `http://127.0.0.1:8789/opencode`
- eta-mu world behind the same GitHub gateway: `http://127.0.0.1:8789/eta-mu`
- Admin UI: `http://127.0.0.1:4097`
- Raw OpenCode API: `http://127.0.0.1:4098`

## Host Funnel

Do not run Tailscale inside this stack. Keep `tailscaled` and `tailscale funnel 8788` on the host.

```bash
tailscale funnel 8788
```

The intended browser path is one gateway only:

- host Funnel -> `127.0.0.1:8788`
- Janus API gateway at `127.0.0.1:8788`
- OpenCode UI mounted by the OpenCode gateway at `/opencode`
- eta-mu world UI mounted by the same gateway at `/eta-mu`

## Shared Host State

This stack uses the host's real OpenCode paths:

- `/home/err/.config/opencode`
- `/home/err/.local/share/opencode`
- `/home/err/.cache/opencode`
- `/home/err/.local/state/opencode`

So the container and any host OpenCode runtime see the same `opencode.db`, auth files, prompt history, and session state.

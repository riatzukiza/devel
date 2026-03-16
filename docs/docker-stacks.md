# Docker Stacks

Use the root registry in `config/docker-stacks.json` plus the wrapper in `scripts/docker-stack.mjs` to manage curated Docker Compose stacks from the workspace root without changing each stack's own compose files.

## Commands

```bash
pnpm docker:stack:list
pnpm docker:stack up devel -- --build
pnpm docker:stack up mcp -- --build
pnpm docker:stack up cephalon -- --build
pnpm docker:stack up ollama
pnpm docker:stack up opencode -- --build
pnpm docker:stack show promethean
pnpm docker:stack status open-hax-openai-proxy
pnpm docker:stack use-container open-hax-openai-proxy -- --build
pnpm docker:stack use-host open-hax-openai-proxy
pnpm docker:stack up openplanner -- --build
pnpm docker:stack up part64 -- --build
pnpm docker:stack ps open-hax-openai-proxy
pnpm docker:stack logs open-hax-openai-proxy -- -f
pnpm docker:stack down promethean:dev
```

`pnpm docker:stack <command> <stack>` runs `docker compose` from the stack's real working directory, so relative mounts, build contexts, `.env` loading, and sibling-file references still resolve the same way they do when you work inside that repo directly.

## Registered Stacks

- `promethean` - `orgs/riatzukiza/promethean/docker-compose.yml`
- `devel` - `docker-compose.yml`
- `mcp` - `services/mcp-stack/docker-compose.yml`
- `cephalon` - `services/cephalon-stack/docker-compose.yml`
- `ollama` - `services/ollama-stack/docker-compose.yml`
- `opencode` - `services/opencode-stack/docker-compose.yml`
- `promethean:dev` - `orgs/riatzukiza/promethean/docker-compose.dev.yml`
- `promethean:sonarqube` - `orgs/riatzukiza/promethean/docker-compose.sonarqube.yml`
- `promethean:tor` - `orgs/riatzukiza/promethean/docker-compose.tor.yml`
- `openplanner` - `services/openplanner/docker-compose.yml`
- `part64` - `vaults/fork_tales/part64/docker-compose.yml`
- `part64:embed-bench` - `vaults/fork_tales/part64/docker-compose.embed-bench.yml`
- `part64:muse-song-lab` - `vaults/fork_tales/part64/docker-compose.muse-song-lab.yml`
- `part64:sim-slice-bench` - `vaults/fork_tales/part64/docker-compose.sim-slice-bench.yml`
- `part64:whisper-bench` - `vaults/fork_tales/part64/docker-compose.whisper-bench.yml`
- `open-hax-openai-proxy` - `services/open-hax-openai-proxy/docker-compose.yml`

## Notes

- `up` defaults to `docker compose up -d`.
- `logs` defaults to `docker compose logs --tail=200`.
- Pass raw Docker Compose flags after `--` when you need to override defaults.
- Add new root-managed stacks by extending `config/docker-stacks.json`.
- Stacks can declare related host PM2 apps in the registry; `open-hax-openai-proxy` now does.
- `mcp` and `cephalon` also declare the related host PM2 apps so the root wrapper can prevent accidental double ownership.
- Use `pnpm docker:stack use-container <stack>` to stop the registered host PM2 side and start the container side.
- Use `pnpm docker:stack use-host <stack>` to stop the container side and resume the registered host PM2 apps.
- Plain `up`/`start`/`restart` refuse to run while related host PM2 apps are active, to prevent port collisions.
- `ollama` is a pure Docker-owned runtime and is meant to replace the current host `ollama.service` once you cut over.
- `opencode` is a containerized web runtime that mounts all of `/home/err/devel`, so it can operate across the whole monorepo instead of a single subproject.
- `opencode` bind-mounts the host OpenCode XDG paths, so it uses the same `opencode.db`, auth state, prompt history, and session database as a host runtime.
- The root `devel` stack now includes `open-hax-openai-proxy`, so `openclawssy` can talk to the proxy over Docker networking instead of `host.docker.internal`.
- `openplanner` is now a full app-plus-Chroma Compose stack instead of a Chroma-only sidecar.
- `mcp` and `cephalon` use shared-context runtime containers: the image supplies process tooling, while the live workspace is mounted at `/workspace` so grouped services can operate on the real repo without host-global PM2.
- The `ollama` stack publishes onto the shared `ai-infra` Docker network so containerized services can use `http://ollama:11434` directly.
- This registry is intentionally curated; it is meant to make important stacks obvious and consistent from the root, not to merge every compose file into one giant compose project.

# Docker Stack Registry

## Goal

Make the main monorepo Docker Compose stacks discoverable and runnable from the workspace root without flattening them into one fragile mega-compose file.

## Scope

- `orgs/riatzukiza/promethean`
- `vaults/fork_tales/part64`
- `services/open-hax-openai-proxy`

## Chosen Approach

- Keep each repository's compose files where they already live.
- Add a root registry in `config/docker-stacks.json` with human-friendly stack names.
- Add a root wrapper in `scripts/docker-stack.mjs` that runs `docker compose` from the stack's actual working directory.
- Add a first-class `docker-compose.yml` and container build for `services/open-hax-openai-proxy` so it participates in the same workflow as the other stacks.
- Allow registry entries to declare related host PM2 apps so the root wrapper can manage handoff between host PM2 and Docker ownership.
- Promote root and service Compose files toward container-owned groups, including bundling the proxy into the root `devel` stack and making `openplanner` a full app stack.
- Add shared-context runtime stacks for service families that are better grouped than split, including a PM2-managed MCP family container and a PM2-managed Cephalon container.
- Add a dedicated container-owned Ollama stack so host clients can keep using `127.0.0.1:11434` while the long-running server moves out of host systemd ownership.

## Why This Approach

- Relative bind mounts and build contexts keep working.
- Stack-specific `.env` behavior stays local to each project.
- The root gets one command surface for discovery and management.
- Host PM2 and container stacks stop fighting for the same ports because the wrapper can enforce a clean handoff.
- Containerized dependents can use service DNS instead of `host.docker.internal` when they share a Compose project.
- Some stacks deliberately keep source-of-truth in the mounted workspace while using containers only for runtime grouping and ownership isolation.
- Future stacks can be added with a small registry edit instead of a cross-repo compose refactor.

## Definition Of Done

- Root command can list the curated stacks.
- Root command can route compose operations to Promethean, Part64, and the proxy stack.
- `services/open-hax-openai-proxy` has a working compose definition.
- Root docs explain the new workflow.

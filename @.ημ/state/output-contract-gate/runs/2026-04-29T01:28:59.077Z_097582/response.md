## Signal

(己, p=0.93) Added a backend dev watch mode for OpenPlanner.

New OpenPlanner script:

```text
orgs/open-hax/openplanner/scripts/dev-watch-container.sh
```

New package script:

```json
"dev:watch:container": "sh ./scripts/dev-watch-container.sh"
```

It runs:

- `shadow-cljs watch lib` for the CLJS hydration package
- `tsc -w` for TypeScript compile
- `node --watch dist/main.js` for runtime restart when compiled JS changes

Added service:

```text
services/openplanner/docker-compose.yml
```

New service:

```yaml
openplanner-dev:
  profiles:
    - dev
```

Default host port:

```text
http://localhost:7778
```

So the quickest backend dev loop is:

```bash
cd /home/err/devel/services/openplanner
docker compose --profile dev up -d openplanner-dev
curl http://localhost:7778/v1/health
```

If prod `openplanner` is already up and you want only the dev backend:

```bash
docker compose stop openplanner
docker compose --profile dev up -d openplanner-dev
```

## Evidence

(己, p=0.9) Verified compose config:

```bash
cd /home/err/devel/services/openplanner
docker compose --profile dev config --quiet
```

Only warning was the pre-existing unset:

```text
SHUVCRAWL_API_TOKEN
```

(己, p=0.9) Verified OpenPlanner build still passes:

```bash
cd /home/err/devel/orgs/open-hax/openplanner
pnpm build
```

Build passed with the existing CLJS infer warnings in Redis adapter calls.

(己, p=0.92) Committed:

OpenPlanner submodule:

```text
324e793 Add OpenPlanner container watch script
```

Workspace root:

```text
2c436290 Add OpenPlanner backend dev watch profile
```

## Frames

(己, p=0.82) I made this a separate `openplanner-dev` service instead of mutating the production `openplanner` service, so prod stays stable.

(己, p=0.78) I used `node:22-bookworm-slim` directly for dev to avoid rebuilds entirely; it bind-mounts the OpenPlanner repo and uses host-installed `node_modules`.

(己, p=0.72) The dev service uses port `7778` by default to avoid colliding with the existing production service on `7777`.

## Countermoves

(己, p=0.78) `docker compose --profile dev up -d` may start both the unprofiled prod service and the dev service. For backend-only dev, prefer the explicit service command:

```bash
docker compose --profile dev up -d openplanner-dev
```

(己, p=0.84) I preserved unrelated OpenPlanner state:

```text
 M packages/agents/knoxx
?? docs/notes/2026.04.28.15.06.02.md
?? docs/notes/2026.04.28.17.09.48.md
?? docs/notes/2026.04.28.18.02.51.md
```

## Next

(己, p=0.87) Start `openplanner-dev`, edit a CLJS hydration file, and confirm the watcher recompiles without rebuilding the container.
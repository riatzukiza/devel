## Signal

(ctx=己, p=1.0) Updated and committed `orgs/open-hax/openplanner/Dockerfile`.

(ctx=己, p=1.0) The Dockerfile now:
- Installs `pnpm` via `corepack`.
- Uses `pnpm install --no-frozen-lockfile`.
- Copies the workspace dependency package needed by `workspace:*`.
- Installs Java 21 for `shadow-cljs`.
- Builds with `pnpm build`.
- Prunes prod deps with `CI=true pnpm prune --prod`.
- Still ends with non-root `USER 1000:1000`.

(ctx=己, p=1.0) Commit created:

`01aae4c Fix openplanner Docker pnpm build`

## Evidence

(ctx=己, p=1.0) Verified successfully with:

```bash
cd /home/err/devel/services/openplanner
docker compose build
```

(ctx=己, p=1.0) Result:

```text
Image openplanner-openplanner Built
Image openplanner-shuvcrawl Built
```

(ctx=己, p=1.0) Receipt appended to:

`orgs/open-hax/openplanner/receipts.edn`

## Frames

(ctx=己, p=0.95) The original failure was real: `npm install` could not handle `workspace:*`.

(ctx=己, p=0.95) Simply adding `pnpm` exposed the next correct failure: Docker build context needed the workspace package manifest/source.

(ctx=己, p=0.9) The `shadow-cljs` build required Java 21 because the Closure compiler dependency targets classfile version 65.

## Countermoves

(ctx=己, p=1.0) I did not stage or commit the existing unrelated repo state:

```text
M packages/agents/knoxx
M pnpm-workspace.yaml
?? docs/notes/...
?? packages/stores/migrations/migration_pitfalls.md
```

(ctx=己, p=0.9) The `SHUVCRAWL_API_TOKEN` warning remains unchanged; it is not build-fatal.

## Next

(ctx=汝, p=1.0) Run `cd services/openplanner && docker compose up` to validate runtime startup.
## Signal

(ctx=己, p=0.9) I fixed the likely Knoxx memory failure chain and committed it.

(ctx=己, p=1.0) Commits created:

- `78773735` in `packages/agents/knoxx`: `Fix memory session title warming`
- `d4d7167` in `orgs/open-hax/openplanner`: `Bump Knoxx memory fix`

(ctx=己, p=0.95) Changes made:

- Fixed `memory_routes.cljs` so `warm-title-cache!` is called with its required `config` and `runtime` args.
- Added missing Knoxx backend dependency: `@resvg/resvg-js`.
- Recreated the `openplanner` container from the newly fixed image.
- Restarted `knoxx-backend`.

(ctx=己, p=0.8) This was related, but not only via Knoxx: `openplanner` itself was crash-looping because the running container was still on the older image and could not resolve `@open-hax/openplanner-document-hydration`.

## Evidence

(ctx=己, p=1.0) `openplanner` is now healthy:

```text
openplanner-openplanner-1 ... Up ... healthy
```

(ctx=己, p=1.0) `http://127.0.0.1:7777/v1/health` returns:

```json
{
  "ok": true,
  "storageBackend": "mongodb",
  "ftsEnabled": true,
  "dependencies": {
    "vectorStore": { "ok": true },
    "embeddings": { "ok": true },
    "graphLayout": { "ok": true }
  }
}
```

(ctx=己, p=1.0) Upstream memory session API works with the OpenPlanner API key:

```bash
curl -H 'Authorization: Bearer change-me' \
  'http://127.0.0.1:7777/v1/sessions?project=knoxx-session&limit=1'
```

returned `200 OK` with session rows.

(ctx=己, p=1.0) Knoxx backend CLJS compiles:

```bash
pnpm exec shadow-cljs compile server
# EXIT_CODE=0
```

(ctx=己, p=1.0) Receipts appended in both:

- `packages/agents/knoxx/receipts.edn`
- `orgs/open-hax/openplanner/receipts.edn`

## Frames

(ctx=己, p=0.9) The observed browser 500 was probably caused by Knoxx calling OpenPlanner memory/session APIs while local `127.0.0.1:7777` was down.

(ctx=己, p=0.85) There was also a real Knoxx bug waiting in that path: `warm-title-cache!` had been changed to require `config runtime`, but call sites still passed only `session-id`.

(ctx=己, p=0.75) The extraction idea is directionally right: the ClojureScript memory/session behavior should move into a reusable `openplanner/packages/*-cljs` library instead of remaining Knoxx-private.

## Countermoves

(ctx=己, p=0.85) I could not directly replay your authenticated browser `GET /api/memory/sessions?...` because local curl without session auth correctly returns `401`.

(ctx=己, p=0.9) Remaining workspace state was respected, not cleaned:

```text
m packages/agents/knoxx
M pnpm-workspace.yaml
?? docs/notes/...
?? packages/stores/migrations/migration_pitfalls.md
```

(ctx=己, p=0.8) The remaining `m packages/agents/knoxx` is from pre-existing uncommitted/conflicted Knoxx working-tree content inside the submodule, not from the files I changed and committed.

## Next

(ctx=汝, p=1.0) Refresh Knoxx and retry the Memory panel request.
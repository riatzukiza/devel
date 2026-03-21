# Spec Draft: Rename `voice-gateway` to `voxx` and add Docker Compose runtime

## Summary
Align the Open Hax voice service workspace path and public package/image naming with the upstream repository name `voxx`, then add a self-contained Docker Compose workflow that can build and run the service locally without depending on the pre-published Melo registry base.

## Open Questions
- None.

## Risk Analysis
- **Submodule rename drift**: renaming a git submodule path can leave `.gitmodules` or local submodule config inconsistent if not synchronized.
- **Runtime parity**: a lightweight Compose runtime may not include the full MeloTTS stack; it should still boot the API and provide a clear fallback path.
- **Naming churn**: image/package/docs references must be updated together to avoid mixed `voice-gateway` vs `voxx` identifiers.

## Priority
High.

## Implementation Phases
1. **Workspace/submodule rename alignment**
   - Rename `orgs/open-hax/voice-gateway` to `orgs/open-hax/voxx`.
   - Update `.gitmodules` and any workspace references to the old path.
2. **Public naming + compose packaging**
   - Update package/docs/image/service labels from `voice-gateway` to `voxx` where they are externally visible.
   - Add a Compose-friendly Dockerfile and `compose.yaml` that can run locally on a plain Docker host.
3. **Verification**
   - Run the repository test suite.
   - Build and start the Compose stack, then verify `/healthz` responds.

## Affected Files
- `.gitmodules`
- `orgs/open-hax/voxx/**`
- `specs/drafts/open-hax-voxx-compose-2026-03-19.md`

## Dependencies
- Git submodule support
- Docker Compose
- Python/FastAPI service runtime dependencies

## Definition of Done
- The workspace tracks the repo at `orgs/open-hax/voxx`.
- Public package/docs/image names align with `voxx`.
- `docker compose up --build` from `orgs/open-hax/voxx` starts the service successfully.
- `python -m pytest` passes in the renamed repo.
- `/healthz` returns a healthy response from the Compose stack.

## Verification Notes
- `cd orgs/open-hax/voxx && pnpm test` ✅
- `cd orgs/open-hax/voxx && docker compose config` ✅
- `cd orgs/open-hax/voxx && VOXX_PORT=8798 docker compose up --build -d` ✅
- `curl http://127.0.0.1:8798/healthz` → `{"ok":true,"service":"voxx",...}` ✅
- `curl http://127.0.0.1:8798/v1/models -H 'Authorization: Bearer dev-token'` ✅
- `curl http://127.0.0.1:8798/v1/audio/speech -H 'Authorization: Bearer dev-token' ...` returned `200 audio/mpeg` and produced an MP3 via the Compose fallback TTS path ✅

## Notes
- Port `8788` was already occupied on the host during validation, so the running verification stack used `VOXX_PORT=8798`.

## Todo
- [x] Phase 1: Workspace/submodule rename alignment
- [x] Phase 2: Public naming + compose packaging
- [x] Phase 3: Verification

# Spec Draft: Pilot `services/` as devops homes for `proxx` and `voxx`

## Summary
Begin the workspace migration to a pattern where service source code lives in `orgs/<org>/<repo>`, while `services/<name>` holds runtime/devops material such as Docker Compose, deployment config, env examples, and operator docs.

This pilot covers:
- canonical source: `orgs/open-hax/proxx`
- canonical source: `orgs/open-hax/voxx`
- devops homes: `services/proxx` and `services/voxx`

## Open Questions
- None for the pilot slice.

## Risk Analysis
- **Path drift**: root compose/stack tooling currently points at `services/open-hax-openai-proxy`; updates must preserve working commands or aliases.
- **Partial migration confusion**: `orgs/open-hax/proxx` still contains legacy deployment files; docs must clearly state the new preferred path.
- **Docker build context errors**: wrapper compose files must build from the canonical source dirs while mounting config/data from `services/*`.

## Priority
High.

## Implementation Phases
1. **Pilot devops homes**
   - Create `services/proxx` and `services/voxx`.
   - Add compose/operator docs that build from `orgs/open-hax/proxx` and `orgs/open-hax/voxx` respectively.
2. **Workspace integration**
   - Update root stack registry and root compose to use the new devops homes.
   - Update repository/docs indices to describe the new pattern.
3. **Source repo guidance**
   - Update `orgs/open-hax/proxx` and `orgs/open-hax/voxx` docs/scripts to point to the `services/*` devops homes.
4. **Verification**
   - Validate compose config for both services.
   - Run the smallest relevant tests/builds.

## Affected Files
- `services/proxx/**`
- `services/voxx/**`
- `config/docker-stacks.json`
- `docker-compose.yml`
- `README.md`
- `docs/docker-stacks.md`
- `REPOSITORY_INDEX.md`
- `orgs/open-hax/proxx/README.md`
- `orgs/open-hax/proxx/DEVEL.md`
- `orgs/open-hax/voxx/README.md`
- `orgs/open-hax/voxx/package.json`

## Definition of Done
- `services/proxx` and `services/voxx` exist as devops homes.
- Their compose files build from `orgs/open-hax/proxx` and `orgs/open-hax/voxx` respectively.
- Root docker-stack tooling points at the new service homes.
- Source-repo docs point operators to `services/*` for container/devops workflows.
- Compose config validates for both services.

## Verification Notes
- `cd services/proxx && docker compose config` ✅
- `pnpm docker:stack config open-hax-openai-proxy -- -q` ✅
- `pnpm docker:stack config voxx -- -q` ✅
- `cd orgs/open-hax/proxx && pnpm build` ✅
- `cd orgs/open-hax/voxx && pnpm test` ✅
- `cd services/voxx && VOXX_PORT=8799 docker compose up --build -d` ✅
- `curl http://127.0.0.1:8799/healthz` → `{"ok":true,"service":"voxx",...}` ✅
- `POST /v1/audio/speech` against `http://127.0.0.1:8799` returned `200 audio/mpeg` ✅
- `cd orgs/open-hax/proxx && pnpm test` ⚠️ existing source-repo failure in `dist/tests/proxy.test.js` subtest `serves native /api/tags from the local model catalog without an upstream request`; no migration files touched the failing code path.
- Retained self-contained source-repo compose files for downstream/distributable usage while workspace compose ownership stays under `services/proxx` and `services/voxx` ✅

## Todo
- [x] Phase 1: Pilot devops homes
- [x] Phase 2: Workspace integration
- [x] Phase 3: Source repo guidance
- [x] Phase 4: Verification

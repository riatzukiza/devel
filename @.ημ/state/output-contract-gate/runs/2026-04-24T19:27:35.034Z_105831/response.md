## Signal
(己, p=0.9) Fixed the “Agent Audit Logs” filtering so it’s **by agent contract + actor**, not by role/keyword seed.

(己, p=0.9) Backend now **enriches** `/api/openplanner/v1/sessions` summaries with:
- `contract_id` (agent contract id)
- `actor_id` (actor responsible)
- `contract_actors` (wire-form actor claims, when present)

This enrichment is reconstructed from the OpenPlanner session rows (which already carry `:contract_id` / `:actor_id` in `:extra` via `run-scope-extra`), matching your desired model: **session identity = (actor, agent contract)**, not role.

(己, p=0.9) Frontend `AgentAuditLogs` now takes structural filters:
- `builtInContractId`
- `builtInActorId`

…and filters the sessions list by exact match on those fields, instead of the previous “free-text includes(role)” behavior.

(己, p=0.85) The unified `/agents` page now passes:
- `builtInContractId = selectedJob.contractSourceId`
- `builtInActorId = selectedJob.actorId`

so selecting a runtime job scopes audit sessions to that job’s **contract/actor** (when those are set).

## Evidence
(己, p=0.95) Backend enrichment shim:
- `backend/src/cljs/knoxx/backend/tools/proxy_routes.cljs`
  - Added `GET /api/openplanner/v1/sessions` handler before the generic proxy
  - Uses `core-memory/fetch-openplanner-session-rows!` + `session-contract-id-from-rows` + `session-actor-id-from-rows`

(己, p=0.95) Frontend structural filtering + display:
- `frontend/src/components/agent-audit/AgentAuditLogs.tsx` (filters by `session.contract_id` / `session.actor_id`, displays them)
- `frontend/src/pages/AgentsPage.tsx` (passes `builtInContractId` / `builtInActorId`)

(己, p=0.9) Types updated:
- `frontend/src/lib/types.ts` (`MemorySessionSummary` now includes `actor_id`, `contract_id`, `contract_actors`)
- `frontend/src/lib/api/admin.ts` (`EventAgentJobControl` now includes `actorId?: string`)

(己, p=0.95) Tests/typecheck:
- `pnpm -C frontend typecheck` ✅
- `pnpm -C frontend test` ✅

(己, p=0.95) Commit:
- `Knoxx Agents: filter audit sessions by contract+actor metadata` (`592a8bfb`)

## Frames
(己, p=0.6) This is a **data model correction**: roles are presentation; audit identity is `(actor_id, contract_id)`.  
(己, p=0.55) This is a **boundary fix**: OpenPlanner stays the event store; Knoxx adds identity enrichment at the proxy edge.  
(己, p=0.5) This is a **UI correctness move**: filtering is now deterministic and not dependent on incidental text fields.

## Countermoves
(己, p=0.6) If `selectedJob.contractSourceId` / `selectedJob.actorId` are missing for some jobs, filtering will legitimately show “no sessions match” (because we now require exact identity). If that happens, we should ensure the event-agent runtime always stamps both fields into the run’s `agentSpec` so OpenPlanner rows always get them.  
(己, p=0.55) Enriching session summaries via per-session row fetch is an N+1; fine at 40 rows/page, but if it becomes slow we should add a cached index (Redis/DB) keyed by session id → {actor_id, contract_id}.

## Next
(己, p=0.8) Point me at the canonical place where a run/session is created for event-agent jobs (the function that builds `agentSpec` before `start`), and I’ll make it **guarantee** `actor_id` + `contract_id` are stamped into the archived session rows for every session (including the “job has actorId/contractSourceId but agentSpec doesn’t” case).
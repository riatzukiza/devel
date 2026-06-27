# Knoxx & OpenPlanner Performance Audit

**Date:** 2026-05-08
**Scope:** Knoxx backend (`packages/agents/knoxx/`) and OpenPlanner ingestion
**Auditor:** opencode
**Severity Scale:** CRITICAL (data loss / security / immediate outage), HIGH (performance degradation / resource exhaustion), MEDIUM (operational risk / technical debt), LOW (best practice / hygiene)

---

## Executive Summary

The knoxx and openplanner systems contain **critical performance and resilience gaps** across four primary dimensions. Several patterns will cause cascading failure under moderate load: unbounded memory growth, zero transaction boundaries, missing connection pool configuration, and unthrottled concurrent fan-out. The system currently relies on process restart (PM2/container churn) to reset state rather than implementing in-code bounds.

### Critical Issues at a Glance

| Issue | Severity | Files | Impact |
|-------|----------|-------|--------|
| Unbounded in-memory registries | CRITICAL | `agent_runtime.cljs`, `session_store.cljs`, `discord_gateway.cljs`, `routes/mcp.cljs` | Process OOM under sustained load |
| Zero database transactions | CRITICAL | `policy_db.cljs` (multiple functions) | Data inconsistency, orphaned rows |
| Unconfigured PostgreSQL pool | CRITICAL | `policy_db.cljs:2273` | Connection exhaustion, no graceful shutdown |
| Shell command injection | CRITICAL | `event_agents.cljs:520` | Remote code execution via Discord attachments |
| Unbounded PCM audio buffers | CRITICAL | `discord_gateway.cljs:631` | Memory exhaustion from voice data |
| N+1 query patterns | HIGH | `policy_db.cljs` (multiple functions) | Database overload, latency spikes |
| Missing indexes | HIGH | Schema definitions in `policy_db.cljs` | Full table scans, query slowdown |
| Synchronous file I/O in async paths | HIGH | `contracts/loader.cljs`, `policy/edn_adapter.cljs`, etc. | Event loop blocking |
| Missing HTTP timeouts | HIGH | `http.cljs`, `discord_io.cljs`, `mcp_bridge.cljs` | Dangling promises, resource leaks |
| Unbounded concurrent fan-out | HIGH | `event_agents.cljs`, `discord_gateway.cljs` | Thundering herd, API rate limit violations |
| Unbounded JVM executor queue | HIGH | `kms_ingestion/jobs/control.clj` | Heap exhaustion in ingestion service |

### Architecture Context

The system runs two distinct runtimes:
- **CLJS/Node.js backend** (`packages/agents/knoxx/backend/`): HTTP server, WebSocket real-time, Discord gateway, agent runtime
- **Clojure/JVM ingestion** (`packages/agents/knoxx/ingestion/`): Document indexing, translation workers

These runtimes share PostgreSQL and Redis but have inconsistent resilience patterns. The JVM ingestion has explicit bounded parallelism and CPU throttling; the Node.js backend has almost none.

### Positive Findings

Some subsystems have correct bounds in place:
- `runs*` and `run-order*` in `run_state.cljs`: MAX_RUNS = 200 with LRU eviction
- `recent-events*` in `event_agents.cljs`: capped at 30 via `take-last`
- `dispatched-event-ids*` in `event_agents.cljs`: swept to 500 entries every 10 minutes
- `lounge-messages*`: capped at 100 via `take-last`
- `session-titles*`: capped at 512 via SESSION_TITLES_CACHE_MAX
- `temp-memory/local-store*`: capped at 256 entries with TTL sweep
- `chat-buffer` (Twitch): capped at 100 messages per channel

These bounded patterns should be used as templates for fixing the unbounded registries.

---

## Report Structure

1. **[Database Performance & Connection Management](database-performance.md)** - Pool config, transactions, N+1 queries, missing indexes
2. **[Async I/O & Event Loop Health](async-io-event-loop.md)** - Sync I/O, timeouts, streams, shell injection
3. **[Memory Management & Leaks](memory-management.md)** - Unbounded atoms, cache eviction, listener leaks
4. **[Queuing & Throughput](queuing-throughput.md)** - Actor mailbox, event dispatch, WS broadcast, job scheduling
5. **[Prioritized Recommendations](recommendations.md)** - Action items with timelines and owners

## Risk Assessment

### Under Low Traffic (Current State)
The system operates adequately for development and light production use. Unbounded atoms grow slowly enough that periodic PM2 restarts or deployments reset state before OOM. Missing transactions rarely cause visible issues because concurrent mutations are infrequent. N+1 queries complete quickly on small datasets.

### Under Moderate Traffic (Expected Growth)
The following failure modes become likely within 1-3 months of growth:
1. **OOM crashes**: `agent-sessions*` or `actor-managers*` exhaust heap during a burst of concurrent conversations or Discord guild joins
2. **Database connection exhaustion**: 10-default pool hits its limit during a burst of API requests; new requests hang with no visibility
3. **Cascading latency**: N+1 queries on larger datasets (100+ roles, 1000+ users) cause 1-5s response times
4. **Data inconsistency**: Concurrent role/permission updates interleave DELETE/INSERT pairs, leaving partial ACL state

### Under High Traffic (Viral/Burst Scenarios)
1. **Process crashes**: PCM audio buffer or WS broadcast loop exhausts memory within minutes
2. **Database deadlock**: Unbounded retry loops in actor mailbox compete for `FOR UPDATE SKIP LOCKED` rows
3. **API rate limit violations**: Unthrottled `Promise.all` fan-out to Discord or OpenPlanner triggers 429 responses, cascading to agent failures
4. **Security incident**: Malicious Discord attachment URL executes arbitrary shell commands

---

*For detailed findings and code references, see the category-specific reports linked above.*

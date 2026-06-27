# Database Performance & Connection Management

## CRITICAL

### 1. Unconfigured PostgreSQL Connection Pool

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Lines:** 2273-2274

```cljs
(let [pool (new (.-Pool pg) (clj->js {:connectionString conn-str}))]
```

The `pg.Pool` is instantiated with only a connection string. No `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`, or `allowExitOnIdle` is set. The Node `pg` module defaults to a maximum of **10 connections**.

**Impact:** Under concurrent load (Discord gateway bursts, MCP tool calls, session recovery), this becomes a hard bottleneck. If all 10 connections are in use, new queries wait indefinitely with no queueing visibility or timeout.

**Recommended Fix:**
```cljs
(let [pool (new (.-Pool pg)
                (clj->js {:connectionString conn-str
                          :max 20
                          :idleTimeoutMillis 30000
                          :connectionTimeoutMillis 5000
                          :allowExitOnIdle true}))]
  (.on pool "error" (fn [err _client]
                      (log/error "Unexpected PG pool error" err)))
  pool)
```

---

### 2. PostgreSQL Pool Never Closed on Shutdown

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/graceful_shutdown.cljs`  
**Lines:** 77-79

```cljs
(.then (fn [_]
         (when-let [client (redis/get-client)]
           (redis/quit client))))
```

The shutdown sequence closes Redis but never terminates the PostgreSQL pool. The pool's `:close` function is defined in `policy_db.cljs` line 2307 as `(fn [] (.end pool))` but is never called.

**Impact:** During PM2 restarts, shadow-cljs hot reloads, or deploys, idle connections in the pool are abandoned. PostgreSQL must wait for TCP keepalive timeouts (typically minutes) before releasing slots. Rapid restart cycles exhaust Postgres connection limits.

**Recommended Fix:** Add `(.end pool)` to the shutdown sequence before `js/process.exit`.

---

### 3. Zero Explicit Transactions

No `BEGIN`, `COMMIT`, `ROLLBACK`, or `pg` client-based transaction API is used anywhere in the codebase.

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`

**Affected Functions:**
- `factory-create-user` (lines 1701-1777): INSERT user, INSERT membership, set roles, set actor id, upsert actor contract, append audit — **6+ queries with no atomic boundary**
- `factory-create-role` (lines 1614-1641): INSERT role, set permissions, set tool policies, append audit
- `ensure-bootstrap-user!` (lines 1364-1393): INSERT user, INSERT membership, find role, INSERT membership_roles, UPDATE actor_id

**Impact:** A crash after the user INSERT but before the membership INSERT leaves an orphaned user row. Concurrent calls to `set-role-permissions!` can interleave: one call DELETEs, another call DELETEs, then both INSERT, potentially leaving duplicate or missing rows.

**Recommended Fix:** Implement a `with-transaction!` helper:

```cljs
(defn with-transaction!
  [pool f]
  (-> (.connect pool)
      (.then (fn [client]
               (-> (.query client "BEGIN")
                   (.then (fn [] (f client)))
                   (.then (fn [result]
                            (-> (.query client "COMMIT")
                                (.then (fn [] (.release client true))
                                       result))))
                   (.catch (fn [err]
                             (-> (.query client "ROLLBACK")
                                 (.then (fn [] (.release client false))
                                        (fn [] (throw err)))))))))))
```

---

### 4. N+1 Role Resolution

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Lines:** 1017-1032

```cljs
(-> (js/Promise.all
     (into-array
      (for [slug (filter some? (or role-slugs #js []))]
        (-> (query-one! pool
                        "SELECT id FROM roles WHERE (slug = $1 OR slug = $2) AND (org_id = $3::uuid OR org_id IS NULL) ..."
                        [raw-slug normalized org-id])
            ...))))
```

If a caller passes 20 role slugs, this issues 20 sequential round-trips.

**Recommended Fix:** Use a single query with `ANY` or `unnest`:
```sql
SELECT id, slug FROM roles
WHERE slug = ANY($1::text[])
  AND (org_id = $2::uuid OR org_id IS NULL)
```

---

### 5. N+1 Bootstrap Allowlist User Creation

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Lines:** 1422-1465

`ensure-bootstrap-allowlist-users!` maps over emails, then inside each email promise maps over role slugs, each triggering its own `find-role` + `INSERT INTO membership_roles`. For 50 allowlisted emails with 3 roles each, this is **150+ independent queries**.

**Recommended Fix:** Batch all role lookups first, then batch all membership_role inserts:
```sql
INSERT INTO membership_roles (membership_id, role_id)
SELECT m.id, r.id
FROM unnest($1::uuid[], $2::uuid[]) AS t(membership_id, role_id)
```

---

### 6. Individual INSERT Loops Instead of Batch Inserts

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`

Multiple functions loop with individual `INSERT ... ON CONFLICT` wrapped in `js/Promise.all`:

- `ensure-tool-definitions!` (lines 246-258)
- `ensure-permission-records!` (lines 357-373)
- `set-role-permissions!` (lines 806-830): DELETE followed by per-code INSERT
- `set-role-tool-policies!` (lines 833-848): DELETE followed by per-policy INSERT
- `set-membership-tool-policies!` (lines 850-865): same anti-pattern
- `set-membership-roles!` (lines 1034-1059): DELETE then per-role INSERT

**Recommended Fix:** Use `INSERT ... VALUES (...), (...), ... ON CONFLICT` or PostgreSQL `unnest`:
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT $1::uuid, unnest($2::uuid[])
ON CONFLICT DO NOTHING
```

---

## HIGH

### 7. Slow `factory-list-orgs` with Cross Joins

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Line:** 1571

```sql
SELECT o.*,
  COUNT(DISTINCT m.id) AS member_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.org_id = o.id) AS role_count,
  COUNT(DISTINCT d.id) AS data_lake_count
FROM orgs o
LEFT JOIN memberships m ON m.org_id = o.id
LEFT JOIN roles r ON r.org_id = o.id
LEFT JOIN data_lakes d ON d.org_id = o.id
GROUP BY o.id
ORDER BY o.is_primary DESC, o.name ASC
```

This is an **accidental cartesian product**: if an org has 100 memberships, 20 roles, and 10 data lakes, the joins produce 20,000 rows before aggregation. Postgres must materialize and deduplicate with `COUNT DISTINCT`.

**Recommended Fix:** Use correlated subqueries or lateral joins:
```sql
SELECT o.*,
  (SELECT COUNT(*) FROM memberships m WHERE m.org_id = o.id) AS member_count,
  (SELECT COUNT(*) FROM roles r WHERE r.org_id = o.id) AS role_count,
  (SELECT COUNT(*) FROM data_lakes d WHERE d.org_id = o.id) AS data_lake_count
FROM orgs o
ORDER BY o.is_primary DESC, o.name ASC
```

---

### 8. Session Token Fallback Triggers Full Table Scan

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Lines:** 2122-2126

When `token_prefix` lookup fails:
```sql
SELECT * FROM sessions WHERE expires_at > NOW() ORDER BY created_at DESC LIMIT 200
```

This scans the entire `sessions` table (no filter on `token_prefix`), hashing every live session row to find a match.

**Recommended Fix:** Remove the fallback entirely after ensuring all tokens have a prefix, or add a functional index on `LEFT(token_hash, 8)`.

---

### 9. Schema Backfill Runs on Every Boot

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Lines:** 409-725

The entire schema (20+ tables, indexes, ALTER TABLE backfills) is executed as one giant string on every process startup. `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` are safe but wasteful.

**Worst offender:**
```sql
UPDATE memberships SET actor_id = ... WHERE COALESCE(...)
```

This backfill UPDATE runs every boot even when already complete, rewriting rows and generating WAL traffic.

**Recommended Fix:** Extract schema into proper numbered migration files (follow the existing `openplanner-migration-tools` pattern). Track migration version in a `schema_migrations` table and only run new migrations.

---

### 10. Legacy Schema Detection Queryed on Every Permission Mutation

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Lines:** 346-354

Every call to `set-role-permissions!` first queries `information_schema.columns`:
```cljs
(defn role-permissions-uses-legacy-ids? [pool]
  (-> (query-one! pool "SELECT column_name FROM information_schema.columns ...")
      ...))
```

**Recommended Fix:** Cache this boolean in a closure variable or atom after the first check during pool initialization.

---

## MEDIUM

### 11. Inconsistent HoneySQL Adoption

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy/sql_adapter.cljs`

HoneySQL is used for actor credential queries, but the majority of the policy DB uses raw SQL strings. This split makes query optimization and parameter auditing harder.

**Recommended Fix:** Consolidate on HoneySQL for all new queries; migrate high-traffic raw SQL queries incrementally.

---

### 12. No Connection Health Checks

The `pg.Pool` is created without `pool.on('error', ...)` or `pool.on('connect', ...)` handlers. A network blip or Postgres restart will surface errors only at query time.

**Recommended Fix:** Add event listeners:
```cljs
(.on pool "connect" (fn [client]
                      (log/debug "New PG client connected")))
(.on pool "error" (fn [err client]
                    (log/error "PG client error" err)))
```

---

## Missing Indexes

The schema definition includes indexes on some tables but omits several heavily filtered columns:

| Table | Column | Usage | Recommended Index |
|-------|--------|-------|-------------------|
| memberships | user_id | `factory-list-users` via `ANY($1::uuid[])`, constant joins | `CREATE INDEX idx_memberships_user_id ON memberships(user_id)` |
| memberships | org_id | Filtered in nearly every membership query | `CREATE INDEX idx_memberships_org_id ON memberships(org_id)` |
| memberships | actor_id | `backfill-membership-actors!`, `set-membership-actor-id!` | `CREATE INDEX idx_memberships_actor_id ON memberships(actor_id)` |
| data_lakes | org_id | `factory-list-data-lakes` | `CREATE INDEX idx_data_lakes_org_id ON data_lakes(org_id)` |
| audit_events | (org_id, created_at) | Compliance queries, debugging | `CREATE INDEX idx_audit_events_org_created ON audit_events(org_id, created_at)` |
| audit_events | (action, resource_kind, created_at) | Audit log filtering | `CREATE INDEX idx_audit_events_action_resource ON audit_events(action, resource_kind, created_at)` |
| roles | org_id | `factory-list-roles` queries `WHERE org_id = $1` | `CREATE INDEX idx_roles_org_id ON roles(org_id)` |

**Note:** The `audit_events` table is append-only and will grow indefinitely. Without indexes, compliance queries will become unusable within weeks.

---

## Redis Configuration

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/redis_client.cljs`  
**Lines:** 43-53

```cljs
(redis/createClient #js {:url redis-url})
```

No `socket.connectTimeout`, `socket.reconnectStrategy`, or pool sizing. The client is stored in a global atom and shared across all session stores.

**Recommended Fix:**
```cljs
(redis/createClient
  #js {:url redis-url
       :socket #js {:connectTimeout 5000
                    :reconnectStrategy
                    (fn [retries]
                      (min (* retries 50) 5000))}})
```

---

## Database-Related Configuration Files

**File:** `packages/agents/knoxx/backend/shadow-cljs.edn`  
**Lines:** 40-50

`pg` and `redis` are listed in `:keep-as-import` with no version pinning or compatibility matrix.

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/bootstrap.cljs`  
**Lines:** 59-68

Database URL is read from environment variables but there is no validation that the pool connects before starting the HTTP server. If Postgres is unreachable, the process may bind the HTTP port then exit.

**Recommended Fix:** Add a health check query (`SELECT 1`) before binding the HTTP port.

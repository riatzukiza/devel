# Review fixes (2026-03-14)

## Goal
Verify each reported finding against the current codebase and apply targeted fixes **only where the issue still exists**.

## Findings to verify
1. `docker-compose.yml` callback port mismatch with `src/lib/openai-oauth.ts` redirect builder.
2. `scripts/bulk-oauth-import.ts`
   - callback server startup should surface bind errors (two locations).
   - IMAP baseline UID logic should not skip messages that arrive during snapshot.
   - `parseCsv` should split CRLF safely.
   - `page.locator('body').textContent()` null coalescing.
3. `src/lib/db/sql-credential-store.ts` `removeAccount(...)` should wrap deletes in a transaction and only mutate in-memory state after commit.
4. `src/lib/openai-quota.ts` fallback retry should clear invalid `chatgptAccountId` and credential store should accept explicit `undefined` to clear stored value.
5. `src/lib/policy/types.ts`
   - paid-only regex too broad; should exact-match `GPT_FREE_BLOCKED_MODELS`.
   - `PAID_PLANS` should include `team`.
6. `src/lib/provider-strategy.ts` gpt model parsing should handle `gpt-5-mini` etc.
7. `src/lib/runtime-credential-store.ts` error handling in `removeAccount` should propagate file-store errors when authoritative.
8. `src/app.ts` shutdown hook should await `accountHealthStore.close()`.
9. `src/lib/db/json-seeder.ts` should always upsert provider row (auth_type) even when `skipExistingProviders`.
10. Nitpicks:
   - `src/lib/credential-store.ts` add dispose/flush-on-exit to clear timers and flush pending writes on process exit.
   - `src/lib/db/account-health-store.ts` batch upserts in `flushPendingWrites`; `init()` should only ignore "table not found" and otherwise log+fail.
   - `src/lib/responses-compat.ts` use `timers/promises` for `sleepMs`; make per-chunk delay configurable.
   - `src/tests/proxy.test.ts` remove duplicate JWT helper.

## Open questions / risks
- What SQL client is used (`postgres`/`slonik`/`kysely`/etc.) and what transaction API is idiomatic?
- Whether `chatgpt_account_id` clearing should be done via `NULL` vs column omission depends on schema/queries.
- Streaming delay config: choose env var names that match existing configuration conventions.

## Implementation phases
### Phase 1 — Investigation (no code changes)
- Locate referenced files and confirm the reported patterns still exist.
- Identify transaction and upsert mechanisms.

### Phase 2 — Minimal fixes
- Apply changes only to confirmed issues, keeping behavior stable otherwise.
- Update types/interfaces as needed (quota payload + credential store clearing semantics).

### Phase 3 — Validation
- Run typecheck/lint/tests relevant to touched areas.

## Definition of done
- Each finding is either:
  - confirmed fixed already (documented), or
  - fixed with a minimal, tested change.
- Workspace builds/tests pass for the affected packages.

## Status (after implementation)
- ✅ Fixed: callback port drift by wiring `OPENAI_OAUTH_CALLBACK_PORT` through compose + redirect builder.
- ✅ Fixed: `bulk-oauth-import.ts`:
  - CRLF-safe `parseCsv` split.
  - callback server startup now awaits binding + rejects on bind errors; caller awaits before launching browser.
  - IMAP UID baseline now accounts for `sinceDate` via `internalDate`.
  - `textContent()` null coalescing.
- ✅ Fixed: `SqlCredentialStore.removeAccount(...)` now transactional.
- ✅ Fixed: `openai-quota` retry without workspace now clears stored `chatgptAccountId` by persisting `undefined`.
- ✅ Fixed: policy config exact-match paid-only GPT list; `PAID_PLANS` now includes `team`.
- ✅ Fixed: `gptModelRequiresPaidPlan` regex now parses `gpt-5-mini`/`gpt-6` style names.
- ✅ Fixed: `app.ts` shutdown now awaits `accountHealthStore.close()`.
- ✅ Fixed: `json-seeder` always upserts provider metadata (`auth_type`) even when `skipExistingProviders`.
- ✅ Fixed: `CredentialStore` now flushes synchronously on process exit/signals.
- ✅ Fixed: `AccountHealthStore`:
  - `init()` only ignores Postgres undefined-table (42P01) and otherwise logs + throws.
  - `flushPendingWrites()` now batches multi-row upserts.
- ✅ Fixed: `responses-compat`:
  - `sleepMs` uses `node:timers/promises`.
  - per-chunk delay is configurable via `STREAM_CHUNK_DELAY_MS(_MIN/_MAX)` and defaults to 0.
- ℹ️ No change needed: `RuntimeCredentialStore.removeAccount(...)` did not swallow errors in current code.
- ℹ️ No change needed: `proxy.test.ts` already had only a single JWT helper (`makeJwt`).

# Proxx OpenAI Refresh Follow-Up (2026-03-19)

## Context
- The OpenAI refresh failures were caused by stale legacy account rows in the DB (`<chatgpt_account_id>_<8hex>`) continuing to coexist with current-format rows (`<chatgpt_account_id>-<12hex>`).
- Those legacy rows kept old refresh tokens, so bulk refresh hit `refresh_token_reused` even though a newer sibling account already existed and worked.
- We reauthed 28 accounts successfully with `scripts/bulk-oauth-import.ts` after switching the script to direct proxy callback mode.
- We then removed 43 legacy duplicate rows from the DB and rebuilt the live proxy.

## Current State
- Live proxy health is good.
- `POST /api/ui/credentials/openai/oauth/refresh` now reports `95` refreshed and `8` failed.
- Live `gpt-5.4` requests still succeed.
- The remaining failures are now isolated to 8 real accounts, not duplicate stale rows.

## Remaining Accounts
- `kdkdksjfwoijvvs12356@promethean.rest`
- `askdfjalsdkafjsdl@promethean.rest`
- `qwerasfiowjkjddjkdsnbwjkwuoih@promethean.rest`
- `asdfafsd@promethean.rest`
- `allyoucaneatasshole@promethean.rest`
- `tomarrowismadeofbacon@promethean.rest`
- `yetanotherbaconflavoredcandy@promethean.rest`
- `forktaxcantancle@promethean.rest`

## Observed Failure Mode
- These 8 accounts consistently fail the bulk browser import with transient OpenAI auth pages (`Oops, an error occurred` / `Operation timed out`) before the password step or during verification.
- The script now retries these transient login-page failures up to 3 times, but they still fail.

## Next Actions
- Re-run these 8 individually during a quieter auth window.
- If they still fail, inspect whether the accounts are rate-limited/flagged on the OpenAI side rather than locally broken.
- If needed, manually sign in once for each remaining account and compare the exact auth page state against the script screenshots in `/tmp/proxx-oauth-import-debug-failed8`.

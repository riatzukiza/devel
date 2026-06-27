# Ollama Cold Start Improvements

## Overview
Improve tolerance for Ollama model cold starts and keep the model in memory longer to avoid performance issues.

## Problem
- First call to Ollama after model falls out of memory is slow (10-30+ seconds)
- Current timeouts (10s for async, 5s for deref) may be too short for cold starts
- No mechanism to keep the model warm
- No retry logic when cold start fails

## Solution Approaches

### 1. Keep-Alive Heartbeat (Keep Model Warm)
Add a periodic lightweight request to Ollama to prevent model unloading.

**Files:** `backend/src/fantasia/sim/scribes.clj`

Implementation:
- Add `defonce *ollama-keep-alive` to track heartbeat future
- Add `start-ollama-keep-alive!` function that makes periodic low-complexity requests
- Add `stop-ollama-keep-alive!` function to clean up
- Call `start-ollama-keep-alive!` in server `-main` or when backend initializes
- Default heartbeat interval: 5 minutes
- Use very low `num_predict` (e.g., 1-5 tokens) to minimize load

**Configuration:**
- Add to world levers: `:ollama-keep-alive-enabled` (default true)
- Add to world levers: `:ollama-keep-alive-interval-ms` (default 300000 = 5 min)
- Add to world levers: `:ollama-url` (already exists)
- Add to world levers: `:ollama-model` (already exists)

### 2. Increased Timeouts & Retry Logic
Increase timeouts and add intelligent retry for cold starts.

**Files:** `backend/src/fantasia/sim/scribes.clj`

Changes:
- Increase `:socket-timeout` from 10s to 60s in `call-ollama!`
- Increase `deref` timeout from 5s to 30s in `generate-book-text`
- Add retry logic: if Ollama fails, retry once after short delay (2s)
- Log warnings when timeouts occur or retries happen
- Track cold start success/failure rate in logs

**Configuration:**
- Add to world levers: `:ollama-timeout-ms` (default 60000)
- Add to world levers: `:ollama-retries` (default 1)
- Add to world levers: `:ollama-retry-delay-ms` (default 2000)

### 3. Graceful Degradation
Ensure UI remains functional even when Ollama is slow.

**Files:** `backend/src/fantasia/sim/scribes.clj`, `web/src/components/OllamaTestPage.tsx` (if needed)

Changes:
- Ensure fallback text is always available
- Add status tracking to indicate "generating..." vs "using fallback"
- Consider exposing Ollama health status via WebSocket
- Already implemented: `fallback-text` ensures books can be created even when Ollama fails

## Definition of Done

- [ ] Keep-alive heartbeat implemented and starts on server init
- [ ] Timeout values increased (async: 60s, deref: 30s)
- [ ] Retry logic added with configurable count and delay
- [ ] Configuration options added to levers for all new settings
- [ ] Logging added for cold start events, retries, and keep-alive
- [ ] Fallback mechanism verified to work correctly
- [ ] Manual testing with cold Ollama instance
- [ ] All existing tests pass
- [ ] Backend compiles successfully

## Implementation Plan

### Phase 1: Configuration
1. Add new lever configuration to `sim/tick/initial.clj` or appropriate state init
2. Document configuration options in comments

### Phase 2: Timeout & Retry Improvements
1. Update `call-ollama!` with configurable timeout
2. Update `call-ollama-sync!` with configurable timeout
3. Update `generate-book-text` with longer deref timeout
4. Add retry wrapper function with exponential backoff

### Phase 3: Keep-Alive Mechanism
1. Implement `start-ollama-keep-alive!` function
2. Implement `stop-ollama-keep-alive!` function
3. Add keep-alive state tracking
4. Integrate startup call in server initialization

### Phase 4: Testing & Verification
1. Test with cold Ollama (kill and restart Ollama)
2. Verify keep-alive keeps model warm
3. Test fallback behavior when timeouts occur
4. Run all backend tests
5. Manual verification in game UI

## Testing Commands

```bash
# Backend
cd backend
lein test

# Manual cold start test
# 1. Stop Ollama: pkill ollama
# 2. Start backend
# 3. Create a book in game (should use fallback or be slow)
# 4. Start Ollama: ollama serve
# 5. Test connection via UI: http://localhost:5173/ollama-test
# 6. Create another book (should be faster now)

# Watch logs for [OLLAMA:*] and [KEEP-ALIVE:*] tags
```

## Files to Modify

### Backend
- `backend/src/fantasia/sim/scribes.clj` - Add keep-alive, timeouts, retries
- `backend/src/fantasia/sim/tick/initial.clj` - Add default lever values
- `backend/src/fantasia/server.clj` - Initialize keep-alive on startup

### Configuration (No changes needed if using levers)
- All new settings as world levers (no env vars needed)

## Changelog

### [2026-01-21] Initial spec
- Identified cold start problem with Ollama
- Designed keep-alive heartbeat mechanism
- Planned timeout increases and retry logic
- Defined configuration approach via levers

### [2026-01-21] Implementation complete
- Added `*ollama-keep-alive` atom for tracking keep-alive state
- Added `get-ollama-config` function to retrieve Ollama settings from world levers
- Added `call-ollama-raw!` for making raw HTTP calls with configurable options
- Added `call-ollama-with-retry!` for retry logic with configurable count and delay
- Refactored `call-ollama!` to use retry logic and async future
- Added `call-ollama-sync!` for testing with configurable timeout (60s default)
- Added `keep-alive-ping!` to send minimal requests (1 token) to keep model in memory
- Added `start-ollama-keep-alive!` to start periodic heartbeat (5 min default)
- Added `stop-ollama-keep-alive!` to stop heartbeat gracefully
- Increased deref timeout in `generate-book-text` from 5s to 30s
- Added default lever values: timeout 60s, retries 1, retry delay 2s, keep-alive interval 5min
- Added call to `start-ollama-keep-alive!` in server `-main` function
- Added configuration levers to `sim/tick/initial.clj`
- Backend compiles successfully without errors

# Session Titles Integration

## Overview

This document describes the session titles integration feature that fetches session titles from the OpenCode SDK and merges them with OpenPlanner session data in the OpenCode Unified Workbench.

## Architecture

### Components

1. **session_titles.cljs** - Core module for fetching and normalizing session titles from OpenCode SDK
2. **openplanner.cljs** - Integrates session titles into the OpenPlanner activity feed
3. **Test Infrastructure** - Mock SDK and test coverage for the integration

### Data Flow

```
OpenCode SDK
    ↓
session_titles.list-opencode-sessions()
    ↓
Response Normalization (id/sessionID/session-id, title/name)
    ↓
Title Map {session-id → title}
    ↓
openplanner.cljs merge
    ↓
Enhanced Session Activity Data
```

## Implementation Details

### session_titles.cljs

**Key Functions:**

- `list-opencode-sessions()` - Main API that returns a promise resolving to a title map
- `configured-api-endpoint()` - Reads OpenCode API endpoint from window config
- `configured-api-key()` - Reads API key from window config
- `sdk-response->result()` - Normalizes SDK response to CLJ data structures
- `response-error()` - Extracts error messages from various error formats

**Configuration Sources:**

The module reads configuration from `js/window.__WORKBENCH_BACKENDS__` with support for:
- `:opencode-url` / `:opencodeUrl` - API endpoint
- `:opencode-api-key` / `:opencodeApiKey` - API authentication

### Browser Compatibility

The module is fully browser-compatible:
- Uses `js/window` for configuration (browser API)
- Uses `js/fetch` for HTTP requests (browser API)
- Uses native Promises (browser API)
- No Node.js-specific APIs (`require`, `process`, `Buffer`, etc.)

### Test Infrastructure

**Mock Location:** `src/clojurescript/mocks/opencode_sdk.js`

**Mock Capabilities:**
- Returns realistic test session data
- Supports all SDK methods used by session_titles.cljs
- Compatible with Shadow-CLJS module resolution

**Test Files:**
- `src/clojurescript/test/test_main.cljs` - Main test suite
- `src/clojurescript/test/session_titles_integration_test.cljs` - Integration tests

## Integration with OpenPlanner

In `openplanner.cljs`:

```clojure
;; Line 4 - Require session-titles module
(:require [opencode-unified.session-titles :as session-titles])

;; Lines 92-93 - Fetch titles and merge
(-> (session-titles/list-opencode-sessions)
    (.then (fn [title-map]
             ;; Merge titles into session rows
             (vec
              (map-indexed
               (fn [idx row]
                 (let [session-name (or (:session row) "unspecified")
                       opencode-title (get title-map session-name)]
                   ;; Use OpenCode title if available
                   (assoc row :opencode-title opencode-title)))
               rows))))))
```

## Configuration

### Environment Variables

Not used. Configuration is read from JavaScript runtime.

### Window Configuration

```javascript
window.__WORKBENCH_BACKENDS__ = {
  opencodeUrl: "http://localhost:8788/api/opencode",
  opencodeApiKey: "your-api-key-here"
};
```

## Error Handling

1. **SDK Method Missing:** Gracefully returns empty map
2. **API Errors:** Logged and returns empty map
3. **Network Errors:** Logged and returns empty map
4. **Missing Fields:** Uses fallback values ("Untitled Session", "unspecified")

## Testing

### Running Tests

```bash
# Compile tests
npx shadow-cljs compile test

# Run tests
node target/test.cjs
```

### Current Test Status

✅ **Passing:** Buffer tests (3 assertions)
✅ **Passing:** Session titles integration tests
✅ **Passing:** Mock SDK resolution

## Performance Considerations

- SDK client is cached per endpoint (atomic state)
- Single API call per session list refresh
- No polling - data fetched on-demand

## Future Improvements

1. **Caching:** Add TTL-based caching for session titles
2. **Refresh:** Add manual refresh capability
3. **Error Recovery:** Add retry logic with exponential backoff
4. **Optimistic UI:** Show loading state while fetching titles

## Related Files

- `src/clojurescript/opencode_unified/session_titles.cljs` - Core implementation
- `src/clojurescript/opencode_unified/openplanner.cljs` - Integration point
- `src/clojurescript/mocks/opencode_sdk.js` - Test mock
- `shadow-cljs.edn` - Build configuration
- `docs/SESSION_TITLES_INTEGRATION.md` - This document
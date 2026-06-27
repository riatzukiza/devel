# OpenCode Workbench Session Continuation Prompt

## User Requests (As-Is)
- "Continue work on OpenCode SDK migration/workflow integration"
- "Make the chat scroll-to-bottom when you select a chat"
- "End-to-end browser validation of the README edit flow"
- "Delinted CI-ready ClojureScript"
- "Working browser path: browse workspace files, edit README, save via gateway-backed API"

## Final Goal
Complete OpenCode SDK migration/workflow integration:
1. ✅ **DONE** - Chat scroll-to-bottom on selection/render (ui.cljs)
2. ✅ **DONE** - Session list page size increased to 10 (layout.cljs, state.cljs)
3. ✅ **DONE** - Session titles now fetch from OpenCode SDK (session_titles.cljs, openplanner.cljs)
4. End-to-end browser validation of README edit flow
5. Clean CLJS build with no new warnings
6. Working browser path using gateway-backed workspace API

## Work Completed
### ClojureScript Test Runner (Just Fixed)
- Created dedicated test runner namespaces: `src/clojurescript/test/test_runner.cljs` and `test_main.cljs`
- Updated `shadow-cljs.edn` to use `:target :node-script` and output to `.cjs` (Node ESM support)
- **Solved SDK Import**: Added `:resolve` mapping for `@opencode-ai/sdk/client` to use a mock implementation (`src/clojurescript/mocks/opencode_sdk.js`) during tests
- Tests now compile and run successfully via `pnpm test:clojurescript`

**Files modified:**
- `orgs/open-hax/workbench/shadow-cljs.edn`
- `orgs/open-hax/workbench/src/clojurescript/test/test_runner.cljs` (new)
- `orgs/open-hax/workbench/src/clojurescript/test/test_main.cljs` (new)
- `orgs/open-hax/workbench/src/clojurescript/mocks/opencode_sdk.js` (new)
- `orgs/open-hax/workbench/package.json`

### Test Coverage Configuration (Fixed)
- Fixed `pnpm test:coverage` to properly measure source coverage
- Updated `ava.config.mjs` to use tsx for TypeScript tests directly
- Created `.c8rc.json` with proper configuration for compiled JS in dist/
- Removed empty `system-integration.test.ts` file
- Updated test scripts to work with both tsx and compiled JS

**Files modified:**
- `orgs/open-hax/workbench/ava.config.mjs`
- `orgs/open-hax/workbench/.c8rc.json` (new)
- `orgs/open-hax/workbench/package.json`
- `orgs/open-hax/workbench/tsconfig.test.json`
- Removed `orgs/open-hax/workbench/src/tests/system-integration.test.ts`

**Current Coverage:**
- All files: 21.78% statements, 67.07% branches
- typescript/shared/validation.ts: 87.93% statements
- typescript/electron/index.ts: 100% coverage

### Session Titles from OpenCode SDK (Previous)
- Created new namespace `session_titles.cljs` to fetch session titles from OpenCode SDK
- Avoided circular dependency by not requiring state/opencode in session_titles
- Modified `load-sessions-activity` in openplanner.cljs to merge real titles
- Session panel now shows actual OpenCode session titles instead of mocked data

**Files modified:**
- `orgs/open-hax/workbench/src/clojurescript/opencode_unified/session_titles.cljs` (new)
- `orgs/open-hax/workbench/src/clojurescript/opencode_unified/openplanner.cljs`

### Chat Scroll-to-Bottom (Previous)
- Added `chat-scroll-node` atom to store DOM reference
- Added `scroll-chat-to-bottom!` helper function
- Wired `r/after-render` callback to trigger scroll after every render
- Added `:ref` to chat-stream div to capture DOM node

**Files modified:**
- `orgs/open-hax/workbench/src/clojurescript/opencode_unified/ui.cljs`

**Verification:**
- ✅ shadow-cljs check app: `[:app] Build completed. (105 files, 11 compiled, 0 warnings, 3.41s)`
- ✅ All 24 tests passed

### Prior Work (Session Context)
- Wired typecheck gate for CLJS (multiple Shadow-CLJS builds: app, renderer, preload, main, server)
- Added Typed Clojure dependencies and initial annotations
- Replaced mocks with SDK-backed calls in OpenCode path
- Streaming proxy handling for opencode endpoints
- Interactive prompts UI (permissions, control prompts)
- History hydration when attaching to existing session
- Lazy session creation

## Remaining Tasks
1. End-to-end browser validation of README edit flow
2. Complete Typed Clojure annotations across openplanner, opencode namespaces
3. CI pass for interactive prompt workflow
4. Document continuation plan with blockers

## Active Context
**Files in scope:**
- `orgs/open-hax/workbench/src/clojurescript/opencode_unified/ui.cljs`
- `orgs/open-hax/workbench/src/clojurescript/opencode_unified/opencode.cljs`
- `services/api-gateway/src/routes/opencode.ts`
- `services/api-gateway/src/app.ts`

**State & Variables:**
- `chat-scroll-node` - DOM reference for chat stream container
- `scroll-chat-to-bottom!` - Helper to scroll to bottom
- OpenCode SDK client state: opencode-state, session-id, connected, chat-stream

## MUST NOT Do
- Don't revert multi-build typecheck gate
- Don't revert mocks wholesale; aim for SDK-backed incrementally
- Don't break runtime behavior with risky refactors

## Quick Verification Commands
```bash
# Run from /home/err/devel/orgs/open-hax/workbench
shadow-cljs check app
pnpm test
pnpm test:coverage  # TS source coverage
pnpm test:clojurescript # CLJS tests (uses mocks)
```

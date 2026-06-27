# Museeks Implementation Plan

## Overview
A Clojure client for managing AI agents, initially OpenCode agents. Provides a local Mu message format with semantic search, context management, and pub/sub event streaming.

## Existing Code

### Current Implementation (~660 LOC)
- `src/museeks/core.clj` (51 lines) - CLI entry point with basic commands (health, config, sessions)
- `src/museeks/http.clj` (86 lines) - HTTP client wrapper around babashka.http-client
- `src/museeks/config.clj` (62 lines) - Global (~/.mu) and project (./.mu) config management
- `src/museeks/mu/message.clj` (94 lines) - Mu message schema and operations
- `src/museeks/mu/session.clj` (113 lines) - Mu session management
- `src/museeks/mu/storage.clj` (103 lines) - Mu storage layer (filesystem)
- `src/museeks/utils/git.clj` (56 lines) - Git project detection
- `src/museeks/utils/cli.clj` (60 lines) - CLI utility functions
- `deps.edn` - Clojure dependencies (babashka, core.async, data.json, tools.cli, fs)
- `bb.edn` - Babashka tasks for testing

### Issues Fixed
1. ✓ Fixed parse-opts function in core.clj
2. ✓ Fixed config get function in config.clj
3. ✓ Fixed duplicate get function in http.clj
4. ✓ Added comprehensive test suite

### External References
- OpenCode SDK: https://opencode.ai/docs/sdk/
- OpenCode Server: https://opencode.ai/docs/server/
- MCP Clojure SDK: https://github.com/unravel-team/mcp-clojure-sdk

## Definition of Done

### Phase 1: Foundation (Fix & Verify)
- [ ] Fix syntax errors in core.clj and config.clj
- [ ] Add test suite with test-runner
- [ ] All tests pass
- [ ] Code builds successfully with bb and clj
- [ ] Basic CLI commands work (health, config)

### Phase 2: Mu Message Format
- [ ] Message schema defined in EDN
- [ ] Session storage in ~/.mu/sessions/
- [ ] Project sessions in ./.mu/sessions/
- [ ] Message serialization/deserialization
- [ ] Git project detection
- [ ] Session CRUD operations

### Phase 3: OpenCode Client
- [ ] Complete HTTP client implementation
- [ ] Session API (create, get, list, delete, update)
- [ ] Message API (send, list, get)
- [ ] Files API (find, read)
- [ ] Events API (SSE stream)
- [ ] Auth API (provider configuration)

### Phase 4: Semantic Search
- [ ] Vector embedding storage
- [ ] Search indexing for messages
- [ ] Vector similarity search
- [ ] Query tools for agents

### Phase 5: Context Management
- [ ] Context editor UI (TUI based on babashka)
- [ ] Context inspection APIs
- [ ] Context update/automation APIs

### Phase 6: Pub/Sub Events
- [ ] Event types: prompt.sent, prompt.updated, prompt.cleared, session.created, session.deleted, session.message.part, session.message.done
- [ ] Individual stream subscriptions
- [ ] Event filtering

### Phase 7: Blanc Simple Agent
- [ ] EDN config parser (.blanc/agents.edn, .blanc/mcps.edn, .blanc/models.edn)
- [ ] Agent execution engine
- [ ] Session management (forks, parent)
- [ ] Base tools: nrepl (start/stop/send/restart), curl, files (read/write/edit/move/delete/link)

## Architecture

### Directory Structure
```
museeks/
├── src/museeks/
│   ├── core.clj              - CLI entry point
│   ├── http.clj              - HTTP client (OpenCode API)
│   ├── config.clj            - Configuration management
│   ├── mu/                   - Mu message format
│   │   ├── message.clj       - Message schema & operations
│   │   ├── session.clj       - Session management
│   │   ├── storage.clj       - File system storage
│   │   └── project.clj       - Git project detection
│   ├── opencode/             - OpenCode client
│   │   ├── client.clj        - Main client
│   │   ├── sessions.clj      - Session API
│   │   ├── messages.clj      - Message API
│   │   ├── files.clj         - Files API
│   │   ├── events.clj        - Events API (SSE)
│   │   └── auth.clj          - Auth API
│   ├── search/               - Semantic search
│   │   ├── embeddings.clj    - Vector embeddings
│   │   ├── index.clj         - Search indexing
│   │   └── query.clj         - Vector similarity queries
│   ├── context/              - Context management
│   │   ├── editor.clj        - TUI context editor
│   │   └── api.clj           - Context APIs
│   ├── events/               - Pub/sub events
│   │   ├── bus.clj           - Event bus
│   │   └── streams.clj       - Event streams
│   ├── blanc/                - Blanc simple agent
│   │   ├── config.clj        - EDN config parser
│   │   ├── engine.clj        - Agent execution engine
│   │   ├── session.clj       - Session management
│   │   └── tools/            - Base tools
│   │       ├── nrepl.clj     - nREPL tools
│   │       ├── curl.clj      - HTTP requests
│   │       └── files.clj     - File operations
│   └── utils/
│       ├── cli.clj           - CLI utilities
│       └── git.clj           - Git utilities
├── test/museeks/
│   ├── core_test.clj
│   ├── config_test.clj
│   ├── mu/
│   ├── opencode/
│   ├── search/
│   ├── context/
│   ├── events/
│   ├── blanc/
│   └── utils/
├── spec/
│   └── implementation-plan.md
├── .mu/                      - Global config & sessions
├── .blanc/                   - Blanc agent configs
└── deps.edn

```

## Implementation Phases

### Phase 1: Foundation (Fix & Verify)
**Duration**: 1-2 hours

**Tasks**:
1. Fix parse-opts in core.clj:56-55 (undefined `arg` variable)
2. Fix config get function: config.clj:64-73 (let binding syntax)
3. Remove duplicate get function in http.clj:58-68
4. Add test file structure
5. Write basic tests for config and http modules
6. Run test suite and fix failures
7. Verify build: `bb test`, `clj -M:test`

**Files to modify**:
- src/museeks/core.clj:45-55
- src/museeks/config.clj:64-73
- src/museeks/http.clj:58-68
- test/museeks/core_test.clj (new)
- test/museeks/config_test.clj (new)
- test/museeks/http_test.clj (new)

**Definition of Done**:
- All syntax errors fixed
- All tests pass
- Build succeeds with bb and clj
- No clj-kondo warnings

### Phase 2: Mu Message Format
**Duration**: 4-6 hours

**Tasks**:
1. Define Mu message schema (EDN format)
2. Implement message serialization/deserialization
3. Create storage layer (filesystem with EDN)
4. Implement session CRUD
5. Add git project detection
6. Create message history API
7. Add parent/fork session support

**Files to create**:
- src/museeks/mu/message.clj
- src/museeks/mu/session.clj
- src/museeks/mu/storage.clj
- src/museeks/mu/project.clj
- src/museeks/utils/git.clj
- test/museeks/mu/

**Mu Schema**:
```clojure
{:mu/version "1.0"
 :id #uuid "..."
 :type :message
 :timestamp #inst "..."
 :role :user|:assistant|:system
 :content "..."
 :metadata {:session-id #uuid "..."
            :agent "..."
            :model "..."}
 :context {:files [...]
           :tools [...]
           :env {...}}
 :parts [{:type :text
          :content "..."}
         {:type :file
          :path "..."}]}
```

**Definition of Done**:
- Messages can be created, saved, loaded
- Sessions can be created, listed, deleted
- Git project detection works
- Session forks with parent tracking
- All tests pass

### Phase 3: OpenCode Client
**Duration**: 6-8 hours

**Tasks**:
1. Implement session API (CRUD, children, share, fork)
2. Implement message API (send, list, get)
3. Implement files API (find, read, status)
4. Implement events API (SSE stream with core.async)
5. Implement auth API (provider config)
6. Add error handling and retries
7. Add streaming support

**Files to create**:
- src/museeks/opencode/client.clj
- src/museeks/opencode/sessions.clj
- src/museeks/opencode/messages.clj
- src/museeks/opencode/files.clj
- src/museeks/opencode/events.clj
- src/museeks/opencode/auth.clj
- test/museeks/opencode/

**Definition of Done**:
- Can create/list/delete sessions
- Can send/receive messages
- Can search and read files
- Can subscribe to events
- Can configure auth providers
- All tests pass

### Phase 4: Semantic Search
**Duration**: 4-6 hours

**Tasks**:
1. Choose embedding library (e.g., openai embeddings or local model)
2. Implement embedding generation
3. Create vector storage (filesystem or database)
4. Implement indexing for messages
5. Implement similarity search
6. Add query tools for agents

**Files to create**:
- src/museeks/search/embeddings.clj
- src/museeks/search/index.clj
- src/museeks/search/query.clj
- test/museeks/search/

**Definition of Done**:
- Can generate embeddings for text
- Can index messages with embeddings
- Can perform similarity search
- Query tools available for agents
- All tests pass

### Phase 5: Context Management
**Duration**: 4-6 hours

**Tasks**:
1. Design context data structure
2. Implement context inspection UI (TUI)
3. Implement context APIs
4. Add context update/automation
5. Integrate with Mu messages

**Files to create**:
- src/museeks/context/editor.clj
- src/museeks/context/api.clj
- test/museeks/context/

**Definition of Done**:
- TUI can show current context
- Context can be manually edited
- APIs available for automation
- Integrated with message history
- All tests pass

### Phase 6: Pub/Sub Events
**Duration**: 3-4 hours

**Tasks**:
1. Define event types
2. Implement event bus with core.async
3. Implement individual stream subscriptions
4. Add event filtering
5. Integrate with Mu sessions

**Files to create**:
- src/museeks/events/bus.clj
- src/museeks/events/streams.clj
- test/museeks/events/

**Event Types**:
- prompt.sent
- prompt.updated
- prompt.cleared
- session.created
- session.deleted
- session.idle
- session.message.part
- session.message.done

**Definition of Done**:
- Event bus publishes all events
- Clients can subscribe to specific streams
- Event filtering works
- Integrated with sessions
- All tests pass

### Phase 7: Blanc Simple Agent
**Duration**: 6-8 hours

**Tasks**:
1. Implement EDN config parser
2. Implement agent execution engine
3. Implement session management
4. Implement nrepl tools
5. Implement curl tool
6. Implement file tools
7. Add plugin system support

**Files to create**:
- src/museeks/blanc/config.clj
- src/museeks/blanc/engine.clj
- src/museeks/blanc/session.clj
- src/museeks/blanc/tools/nrepl.clj
- src/museeks/blanc/tools/curl.clj
- src/museeks/blanc/tools/files.clj
- src/museeks/utils/cli.clj
- test/museeks/blanc/

**Blanc Config Structure**:
```
.blanc/
├── agents.edn              # or agents/*.edn
├── mcps.edn                # or mcps/*.edn
└── models.edn              # or models/*.edn
```

**Definition of Done**:
- Can parse EDN configs
- Agent can execute prompts
- nrepl tools work (start/stop/send/restart)
- curl tool works
- File tools work (read/write/edit/move/delete/link)
- Session forks and parent tracking
- All tests pass

## Testing Strategy

### Unit Tests
- Each module has corresponding _test.clj
- Tests cover all public functions
- Mock HTTP responses for opencode client tests
- In-memory storage for mu tests

### Integration Tests
- Test OpenCode client against real server
- Test semantic search with real embeddings
- Test event bus with multiple subscribers

### Test Commands
```bash
# Run all tests
bb test

# Run specific test namespace
bb test -n museeks.config-test

# Watch and re-run
bb watch test
```

## Dependencies

### Current
- org.clojure/clojure 1.11.1
- org.babashka/http-client 0.4.23
- org.clojure/data.json 2.4.0
- org.clojure/core.async 1.6.681
- org.clojure/tools.cli 1.0.206
- babashka/fs 0.4.19

### To Add
- clj-kondo (static analysis)
- rewrite-clj (code editing)
- conformist (config validation)
- malli (schema validation)
- farolero (errors)
- cider-nrepl (nREPL support)
- cheshire (JSON)
- manifold (async streams)
- manifold.time (timeouts)

## Priorities

1. **Phase 1 (Foundation)** - CRITICAL: Fix existing bugs before building
2. **Phase 2 (Mu)** - HIGH: Core message format and storage
3. **Phase 3 (OpenCode Client)** - HIGH: Main client functionality
4. **Phase 4 (Semantic Search)** - MEDIUM: Advanced features
5. **Phase 5 (Context Management)** - MEDIUM: UX improvements
6. **Phase 6 (Pub/Sub)** - MEDIUM: Event streaming
7. **Phase 7 (Blanc)** - HIGH: Simple agent for testing

## Risks & Mitigations

### Risk 1: Semantic Search Complexity
- **Mitigation**: Start with simple keyword search, add embeddings later
- **Fallback**: Use OpenAI embeddings API, no local model initially

### Risk 2: SSE Event Streaming
- **Mitigation**: Use core.async channels, test thoroughly
- **Fallback**: Polling API if SSE fails

### Risk 3: nREPL Integration
- **Mitigation**: Use existing nREPL libraries, test with babashka
- **Fallback**: Implement simple socket-based REPL

### Risk 4: Babashka Compatibility
- **Mitigation**: Test with both bb and clj, use compatible libraries
- **Fallback**: Use pure Clojure version for complex features

## Success Criteria

- All tests pass with `bb test` and `clj -M:test`
- No clj-kondo warnings
- Code builds successfully
- Documentation for all public APIs
- CLI commands work for core features
- OpenCode client can create sessions and send messages
- Blanc agent can execute with base tools

## Next Steps

1. Start with Phase 1: Fix existing bugs
2. Add comprehensive test suite
3. Implement Phase 2: Mu message format
4. Build Phase 3: OpenCode client
5. Iterate on remaining phases

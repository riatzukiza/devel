# Blanc Agent Server Implementation

## Overview
Implement a REST server for Blanc, a simple agent similar to OpenCode.

## Requirements

### Core Features
1. **Create new sessions**
   - POST /session
   - Returns session with unique ID

2. **Get all messages from a session**
   - GET /session/:id/messages
   - Returns all messages in the session

3. **Name a session**
   - PATCH /session/:id
   - Body: {"name": "session name"}

4. **Send a new message to a session**
   - POST /session/:id/message
   - Body: {"role": "user|assistant", "content": "message content"}
   - Returns the created message

5. **Fork a session**
   - POST /session/:id/fork
   - Creates a new session with a copy of all messages up to a point
   - Returns the forked session

## Implementation Details

### Dependencies Added
- `ring/ring` - Core Ring library
- `ring/ring-jetty-adapter` - HTTP server
- `ring/ring-json` - JSON middleware
- `ring-cors/ring-cors` - CORS support

### File Structure
```
src/museeks/blanc/
  server.clj       - Main REST server
  handlers.clj     - HTTP request handlers
  routes.clj       - Route definitions
  agent.clj        - Simple agent logic
  storage.clj      - File system storage
```

### Storage
Storage in `.blanc/` directory:
- `.blanc/sessions/` - Session data (EDN format)
- `.blanc/messages/` - Message data (EDN format)

### API Endpoints

#### POST /session
```json
Request:
{
  "name": "Session name"
}

Response:
{
  "id": "session-id",
  "name": "Session name",
  "createdAt": 123456789,
  "messages": []
}
```

#### GET /session
Returns list of all sessions

#### GET /session/:id
```json
Response:
{
  "id": "session-id",
  "name": "Session name",
  "createdAt": 123456789,
  "messages": ["msg-id-1", "msg-id-2"]
}
```

#### PATCH /session/:id
```json
Request:
{
  "name": "New name"
}

Response:
{
  "id": "session-id",
  "name": "New name",
  "createdAt": 123456789,
  "messages": [...]
}
```

#### GET /session/:id/messages
```json
Response:
{
  "messages": [
    {
      "id": "msg-id",
      "role": "user",
      "content": "Hello",
      "timestamp": 123456789
    }
  ]
}
```

#### POST /session/:id/message
```json
Request:
{
  "role": "user",
  "content": "Hello"
}

Response:
{
  "id": "msg-id",
  "role": "assistant",
  "content": "Blanc says: Hello",
  "timestamp": 123456789
}
```

#### POST /session/:id/fork
```json
Request:
{
  "name": "Forked session name"
}

Response:
{
  "id": "forked-session-id",
  "name": "Forked session name",
  "createdAt": 123456789,
  "parent": "parent-session-id",
  "messages": [...]
}
```

### Simple Agent Logic
For simplicity, the Blanc agent will:
1. Echo user messages with a prefix "Blanc says: "
2. Store all messages in the session
3. No LLM integration initially (echo agent)

## Definition of Done

- [x] Server starts and listens on configurable port (default 8080)
- [x] All endpoints implemented and tested
- [x] Storage persists sessions and messages
- [x] CORS enabled for development
- [x] Server can be started with `clojure -M -m museeks.blanc.server` or `bb blanc-server`
- [x] Documentation in BLANC_README.md

## Test Strategy
- Manual testing with curl
- Integration tests for each endpoint
- All tests passing ✅

## Files Created

- `src/museeks/blanc/server.clj` - Main server entry point
- `src/museeks/blanc/routes.clj` - HTTP routing
- `src/museeks/blanc/handlers.clj` - Request handlers
- `src/museeks/blanc/agent.clj` - Echo agent
- `src/museeks/blanc/storage.clj` - Storage layer
- `spec/blanc-server.md` - This specification
- `BLANC_README.md` - User documentation
- `scripts/test-blanc-server.sh` - Test script

## Test Results

All tests passed successfully:
1. Create session ✅
2. List sessions ✅
3. Get session ✅
4. Send message ✅
5. Get messages ✅
6. Rename session ✅
7. Fork session ✅
8. List sessions after fork ✅
9. Send message to forked session ✅
10. 404 error handling ✅

## CLI Integration

- ✅ Added Ollama/Qwen2.5:3b agent integration
- ✅ Added client library for making HTTP requests
- ✅ Added CLI functions for server detection and auto-start
- ⚠️  CLI module has syntax issues that need to be resolved

## Next Steps

1. Fix syntax errors in `museeks.blanc.cli`
2. Test CLI command `museeks blanc` for interactive chat
3. Ensure Ollama is running before testing

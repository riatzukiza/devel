# Phase 5: Context Management

## Overview
Implement context management for Museeks, allowing users to track and manage context for AI agent sessions.

## Context Data Structure

### Context Schema
```clojure
{:mu/version "1.0"
 :id "uuid"
 :type :context
 :created-at #inst "..."
 :updated-at #inst "..."
 :session-id "uuid"
 :files [{:path "src/file.clj"
          :language :clojure
          :size 1234
          :modified-at #inst "..."}]
 :tools [{:name "nrepl"
          :enabled true
          :config {:port 1234}}]
 :env {:DATABASE_URL "postgres://..."
       :API_KEY "sk-..."}
 :metadata {:git-branch "main"
             :git-commit "abc123"
             :workspace "/path/to/project"}}
```

## Files to Create

### 1. src/museeks/context/api.clj
**Purpose**: Core CRUD operations for context

**Functions to implement**:
- `create-context` - Create new context with session association
- `get-context` - Retrieve context by ID
- `update-context` - Update context fields
- `delete-context` - Delete context
- `list-contexts` - List all contexts (optionally filtered by session)
- `add-file` - Add file reference to context
- `remove-file` - Remove file from context
- `add-tool` - Add tool to context
- `remove-tool` - Remove tool from context
- `set-env` - Set environment variable in context
- `unset-env` - Remove environment variable from context

**Storage**: 
- Context files stored in `./.mu/context/` directory
- Format: EDN serialization
- Filename pattern: `<context-id>.edn`

### 2. src/museeks/context/editor.clj
**Purpose**: TUI-based context inspection and editing

**Functions to implement**:
- `show-context` - Display context in human-readable format
- `edit-context` - Interactive context editing
- `diff-context` - Show differences between contexts
- `export-context` - Export context to file (JSON/EDN)
- `import-context` - Import context from file

**TUI Requirements**:
- Use babashka/readline for interactive input
- Simple menu-based interface
- Color-coded output for different context sections

### 3. src/museeks/context/integration.clj
**Purpose**: Integration with Mu messages

**Functions to implement**:
- `message->context` - Extract context from message
- `context->message` - Attach context to message
- `sync-context` - Sync context across session messages
- `merge-contexts` - Merge multiple contexts

## Integration Points

### With Mu Messages
- Messages already have `:context` field (museeks.mu.message:21)
- Use `with-context` helper to attach context ID to messages
- Context metadata includes relevant files, tools, and env vars

### With Mu Sessions
- Context associated with session ID
- Session metadata stores context references
- Context inherited from parent sessions on fork

### With Git Utils
- Context metadata includes git branch, commit, and workspace info
- Auto-detect project context from git repository

## Definition of Done

- [ ] Context API fully implemented with all CRUD operations
- [ ] Context storage in `./.mu/context/` working correctly
- [ ] TUI editor can display and edit context
- [ ] Context can be attached to Mu messages
- [ ] Context sync works across sessions
- [ ] All tests pass
- [ ] Documentation complete

## Test Plan

### Unit Tests (test/museeks/context/api_test.clj)
- Test context creation with various configurations
- Test file addition/removal
- Test tool management
- Test environment variable handling
- Test context updates
- Test context deletion

### Integration Tests (test/museeks/context/integration_test.clj)
- Test message-context attachment
- Test session context sync
- Test context merging
- Test git context integration

## Dependencies

### Existing
- clojure.string
- museeks.mu.message
- museeks.mu.session
- museeks.utils.git
- museeks.utils.cli

### New (if needed)
- babashka/readline - for TUI input

## Success Criteria

1. Context can be created and associated with sessions
2. Files can be tracked in context
3. Tools and env vars can be managed
4. TUI editor allows manual context inspection
5. Context integrates with Mu messages
6. All tests pass with `bb test`

## Changes Log

### Session 1: 2026-01-22
- Started Phase 5: Context Management
- Created spec document
- Planning implementation approach

### Session 2: 2026-01-22 (COMPLETED)
- Created src/museeks/context/api.clj (220 LOC) - Full CRUD operations for context
- Created src/museeks/context/editor.clj (411 LOC) - TUI-based context editor
- Created src/museeks/context/integration.clj (164 LOC) - Mu message integration
- Created test/museeks/context/api_test.clj (254 LOC) - 18 unit tests
- Created test/museeks/context/integration_test.clj (219 LOC) - 11 integration tests
- Fixed git function naming (git/in-git-repo? -> git/is-git-repo?)
- All tests passing

**Files Created (6 files, ~1288 LOC):**
- src/museeks/context/api.clj
- src/museeks/context/editor.clj
- src/museeks/context/integration.clj
- test/museeks/context/api_test.clj
- test/museeks/context/integration_test.clj

**Key Features Implemented:**
- Context CRUD (create, read, update, delete, list)
- File and tool management in context
- Environment variable management
- Git context auto-detection
- Context diff and merge
- TUI editor with menu interface
- Message-context integration
- Session-context sync
- Auto-context inference from messages
- Session fork context copying

**Definition of Done - ALL MET:**
- [x] Context API fully implemented with all CRUD operations
- [x] Context storage in `./.mu/context/` working correctly
- [x] TUI editor can display and edit context
- [x] Context can be attached to Mu messages
- [x] Context sync works across sessions
- [x] All tests pass
- [x] Documentation complete

# mcp-fs-oauth

An MCP (Model Context Protocol) **Streamable HTTP** server that exposes a small file API
(backed by **local filesystem** and/or a **GitHub repo`) and protects `/mcp` with **OAuth 2.1**.

This project runs an **embedded OAuth Authorization Server** (AS) + **Resource Server** (RS)
using the official TypeScript SDK.

## Features

- OAuth 2.1 (PKCE) with **dynamic client registration** (required by ChatGPT for MCP OAuth)
- Login provider options:
  - `password` (simple single-user gate)
  - `github` (OAuth App)
  - `google` (OIDC)
- Storage backends:
  - `local` (read/write within `LOCAL_ROOT`)
  - `github` (read/write via GitHub Contents API)
  - `auto` (try local first; fallback to github)

## Endpoints

- MCP: `POST/GET/DELETE /mcp`
- OAuth + metadata (installed at app root by the SDK):
  - `/.well-known/oauth-authorization-server`
  - `/.well-known/oauth-protected-resource/mcp`
  - `/authorize`
  - `/token`
  - `/register`
  - `/revoke` (if enabled)

## Quick start

```bash
cp .env.example .env
# edit .env
npm i
npm run dev
```

## Connecting from ChatGPT

In ChatGPT, add an MCP server with:
- Server URL: `https://your-domain.example/mcp`

ChatGPT will discover the protected resource metadata and complete the OAuth flow.

## Tools exposed

### File System Tools

- `fs_list`
- `fs_read`
- `fs_write`
- `fs_delete`

Each tool accepts an optional `backend` override: `auto | local | github`.

### Skill Management Tools

Skills are reusable instruction bundles loaded from `SKILL.md` files. They are discovered from:
- **Workspace**: `.opencode/skills/`
- **Global**: `~/.config/opencode/skills/`

#### Listing and Finding Skills

```bash
# List all indexed skills with preview
list_skills(preview=100)

# Find skills by keyword (name, description, or path)
find_skill(query="typescript testing")
```

#### Reading Skill Content

```bash
# Read full SKILL.md with metadata
skill_read(name="testing-typescript-vitest")

# Show skill with parsed header/description
skill_show(name="testing-typescript-vitest")
```

#### Activating Skills

```bash
# Mark a skill as active for delegation
activate_skill(name="testing-typescript-vitest")

# List currently active skills
skill_active_list()
```

#### Semantic Skill Selection

```bash
# Find skills via OpenPlanner vector search
auto_skill_select(query="how do I write tests")
```

#### Delegating with Active Skills

```bash
# Delegate task with active skills prepended to prompt
delegate_task(
  agentType="build",
  prompt="Add tests for the new authentication module",
  includeActiveSkills=true,
  maxSkillChars=5000
)
```

### OpenPlanner Diagnostics

```bash
# Check OpenPlanner API connectivity
openplanner_health()
```

## Tool schema guidelines

MCP clients surface tool schemas in confirmation dialogs. Keep tool metadata explicit so users can quickly understand risk, scope, and side effects.

### Field descriptions (required)

- Add `.describe(...)` to every input schema field.
- Be explicit about path scope and format (for example, workspace-relative paths and concrete examples).
- Document content format and limits (for example UTF-8 text and truncation limits).
- Call out side effects (create, overwrite, delete, remote API mutation).

### Annotations (critical for UX)

- Use `destructiveHint: true` for any mutation, including overwrite operations.
- Use `destructiveHint: false` only for guaranteed read-only operations.
- Use `readOnlyHint: true` only when the tool cannot mutate state.
- Use `openWorldHint: true` for tools that call external/network APIs.

### Schema examples

Good:

```typescript
path: z.string().describe("File path relative to workspace root (e.g., src/app.ts)"),
content: z.string().describe("UTF-8 text content to write"),
```

Bad:

```typescript
path: z.string(),
content: z.string(),
```

### Intent field (fs_write, fs_delete)

The `fs_write` and `fs_delete` tools include an optional `intent` field that provides a user-visible description of the action's purpose. This field is:

- **Displayed in confirmation dialogs** - AI assistants use the intent description to help users understand what the tool will do
- **Used for GitHub commit messages** - When writing to the GitHub backend, the intent becomes the commit message
- **Optional but recommended** - Providing a clear intent helps with auditing and collaboration

**Recommended phrasing for intent:**

```typescript
// File creation
intent: "Add new configuration file"

// File modification
intent: "Fix bug in authentication logic"
intent: "Update dependencies to latest versions"

// File deletion
intent: "Remove deprecated API endpoints"
intent: "Clean up temporary test files"
```

**Examples:**

```json
{
  "tool": "fs_write",
  "arguments": {
    "path": "/workspace/src/utils.ts",
    "intent": "Add new utility function for date formatting",
    "content": "export function formatDate(date: Date): string { ... }"
  }
}

{
  "tool": "fs_delete",
  "arguments": {
    "path": "/workspace/src/legacy/auth.ts",
    "intent": "Remove deprecated authentication module"
  }
}
```

The intent should be:
- **Concise** - 1-2 sentences maximum
- **Action-oriented** - Start with a verb (Add, Fix, Update, Remove, etc.)
- **Specific** - Explain *why* not just *what*
- **Professional** - Suitable for commit messages and audit logs

## Workspace REST API tools

The following tools expose workspace REST API endpoints. The base URL is configured via `WORKSPACE_API_BASE_URL` (default: `http://127.0.0.1:8788/api/workspace`):

- `workspace_meta` - Calls `GET /meta` to retrieve workspace metadata
- `workspace_list` - Calls `GET /list` to list directory entries
- `workspace_file_read` - Calls `GET /file?path=<path>` to read a file
- `workspace_file_write` - Calls `POST /file` with `{path, content}` body to write a file

## Exec allowlist patterns

`exec_run` now enforces glob-style allowlist patterns (similar to OpenCode permissions),
for example `"git *"` or `"pnpm test *"`.

- Config loading precedence:
  1. `MCP_EXEC_CONFIG` (explicit path)
  2. `MCP_EXEC_COMMANDS_JSON` (inline JSON)
  3. Auto-discovery from working directory upward:
     - `.opencode/exec-permissions.json`
     - `exec-permissions.json`
     - `promethean.mcp.exec.json`
     - `services/mcp-fs-oauth/exec-permissions.json`
- Each command may define `allowPatterns` and `denyPatterns`.
- You can also define global `allowPatterns` / `denyPatterns` at config root.
- A default deny set is always enforced (`rm -rf`, `mkfs`, `curl|bash`, `wget|sh`, and related patterns).
- If `allowExtraArgs=true`, at least one allow pattern must be present.

Example:

```json
{
  "allowPatterns": ["git *"],
  "commands": [
    {
      "id": "git-status",
      "description": "Run git status",
      "command": "git",
      "args": ["status"],
      "allowExtraArgs": true,
      "allowPatterns": ["git status *"],
      "denyPatterns": ["*--force*", "*reset --hard*"]
    }
  ]
}
```

Service example (`services/mcp-fs-oauth/exec-permissions.json`):

```json
{
  "defaultCwd": "/home/err/devel/services/mcp-fs-oauth",
  "commands": [
    {
      "id": "bun-build",
      "command": "bun",
      "args": ["run", "build"],
      "allowPatterns": ["bun run build"]
    },
    {
      "id": "bun-test",
      "command": "bun",
      "args": ["test"],
      "allowExtraArgs": true,
      "allowPatterns": ["bun test*"]
    },
    {
      "id": "node-integration-tests",
      "command": "node",
      "args": ["scripts/run-integration-tests.mjs"],
      "allowPatterns": ["node scripts/run-integration-tests.mjs"]
    }
  ]
}
```

## Notes

- For GitHub storage write/delete, you need a token with repo content permissions.
- For public deployments, prefer `github` or `google` login with allowlists, or a strong password.

## OAuth Session Durability

- Access token TTL defaults to 24 hours (`OAUTH_ACCESS_TTL_SECONDS`, default `86400`).
- Refresh token TTL defaults to 30 days (`OAUTH_REFRESH_TTL_SECONDS`, default `2592000`).
- MCP session metadata TTL in Redis defaults to 24 hours (`MCP_SESSION_TTL_SECONDS`, default `86400`).
- OAuth state is now Redis-first (`OAUTH_REDIS_PREFIX`, default `oauth`) so all processes share one live state store.
- Enable `OAUTH_DUCKDB_OWNER=true` on exactly one process to project Redis changes into DuckDB using Redis pub/sub.
- Non-owner processes stay Redis-only and do not open `oauth.db`, preventing multi-process DuckDB lock conflicts.
- Internal opaque-token introspection is available at `POST /internal/oauth/introspect` for trusted gateways.
- Protect introspection with `MCP_INTERNAL_SHARED_SECRET` (recommended); otherwise it is loopback-only.
- On unknown MCP session with dead owner PID, the new process adopts session metadata instead of deleting it immediately.

## Manual Verification Checklist

After making changes to skill tools, verify the following:

### Skill Read/Show Tools

```bash
# 1. List skills
list_skills()

# 2. Find a skill
find_skill(query="testing")

# 3. Read skill content
skill_read(name="testing-typescript-vitest")

# 4. Show skill with description
skill_show(name="testing-typescript-vitest")
```

Expected: `skill_read` returns full SKILL.md content with metadata. `skill_show` includes parsed description.

### Active Skills

```bash
# 1. Activate a skill
activate_skill(name="testing-typescript-vitest")

# 2. List active skills
skill_active_list()

# 3. Verify skill is marked in list_skills
list_skills()
```

Expected: Active skill shows `*` marker and is listed in `skill_active_list`.

### Delegate with Active Skills

```bash
# Delegate task with skills included
delegate_task(
  agentType="build",
  prompt="Run tests",
  includeActiveSkills=true
)
```

Expected: Task created successfully with active skills prepended to prompt.

### OpenPlanner Health Check

```bash
openplanner_health()
```

Expected: Shows endpoint, API key status, and health status.

### Semantic Search

```bash
auto_skill_select(query="testing typescript")
```

Expected: Returns ranked skills without 401 error.

### Common Issues

1. **401 Unauthorized**: If using Janus gateway, set `OPENPLANNER_API_KEY` in Janus and ensure it matches OpenPlanner; if calling OpenPlanner directly, set `OPENPLANNER_API_KEY` here
2. **Skills not loading**: Verify `.opencode/skills/` and `~/.config/opencode/skills/` contain `SKILL.md` files
3. **Activation not working**: Ensure skill name matches exactly (case-insensitive)
4. **Semantic search failing**: Run `openplanner_health()` to diagnose connectivity

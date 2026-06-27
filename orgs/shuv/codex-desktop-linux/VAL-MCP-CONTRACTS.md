# Validation Contracts: MCP Server (Milestone 4)

This document defines behavioral validation contracts for the Fleet Skills MCP Server component. Each assertion establishes a clear pass/fail condition with evidence requirements.

---

## Area Overview

- **Component**: Fleet Skills MCP Server
- **Transport**: stdio (stdin/stdout JSON-RPC)
- **Integration Target**: Codex Desktop
- **Tools Exposed**: `fleet_status`, `fleet_sync`, `fleet_activate`, `fleet_deactivate`, `fleet_pull`, `fleet_drift`, `fleet_rollback`

---

## Validation Contracts

### VAL-MCP-001: Server Initialization Response

**Title**: MCP server responds to initialize request with valid capabilities

**Behavioral Description**:  
When a client sends a JSON-RPC `initialize` request over stdio, the MCP server MUST respond within 5 seconds with a valid `InitializeResult` containing:
- `protocolVersion` field matching a supported MCP protocol version
- `capabilities` object declaring supported features
- `serverInfo` object with `name` and `version` fields

**Pass Condition**: Server returns a well-formed `InitializeResult` with all required fields populated and no error response.

**Fail Condition**: Server times out, returns an error response, or omits required fields from the response.

**Evidence Requirements**:
- Captured stdin input (initialize request JSON)
- Captured stdout output (initialize response JSON)
- Timestamp delta between request and response
- JSON schema validation result for response

---

### VAL-MCP-002: Tools List Response

**Title**: MCP server lists all fleet tools in tools/list response

**Behavioral Description**:  
When a client sends a `tools/list` request after successful initialization, the server MUST respond with a `ListToolsResult` containing exactly 7 tools with the following names:
- `fleet_status`
- `fleet_sync`
- `fleet_activate`
- `fleet_deactivate`
- `fleet_pull`
- `fleet_drift`
- `fleet_rollback`

Each tool entry MUST include:
- `name` (string, matching one of the above)
- `description` (non-empty string)
- `inputSchema` (valid JSON Schema object)

**Pass Condition**: Response contains all 7 tools, each with name, description, and valid inputSchema.

**Fail Condition**: Any tool is missing, duplicated, or lacks required metadata.

**Evidence Requirements**:
- Full `tools/list` response JSON
- List of tool names extracted from response
- JSON Schema validation result for each tool's inputSchema

---

### VAL-MCP-003: fleet_status Tool Execution

**Title**: fleet_status returns structured host status information

**Behavioral Description**:  
When a client invokes `tools/call` with `name: "fleet_status"` and optional host filter arguments, the server MUST return a `CallToolResult` containing:
- `content` array with at least one item
- Each content item includes host identifier, connectivity status, and skill repository state
- Response is valid JSON matching the fleet status schema

**Pass Condition**: Response contains structured status data for one or more hosts with no error flag set.

**Fail Condition**: Response has `isError: true`, returns empty content, or content is not parseable as fleet status.

**Evidence Requirements**:
- Request JSON with tool name and arguments
- Response JSON with content array
- Parsed status object showing host states
- Schema validation result

---

### VAL-MCP-004: fleet_sync Tool Execution

**Title**: fleet_sync synchronizes skill repository across specified hosts

**Behavioral Description**:  
When a client invokes `tools/call` with `name: "fleet_sync"` and host targets, the server MUST:
1. Attempt git operations (fetch/pull) on each target host
2. Return a `CallToolResult` with sync outcome per host
3. Include before/after commit hashes where applicable

**Pass Condition**: Response indicates sync operation completed for all specified hosts, with status per host (success/failure/no-change).

**Fail Condition**: Response has `isError: true` without per-host details, or server crashes during operation.

**Evidence Requirements**:
- Request JSON with sync parameters
- Response JSON with per-host sync results
- Before/after commit SHA comparison (if available)
- Any stderr output captured during operation

---

### VAL-MCP-005: fleet_activate Tool Execution

**Title**: fleet_activate creates skill symlink on target hosts

**Behavioral Description**:  
When a client invokes `tools/call` with `name: "fleet_activate"` specifying a skill name and target hosts, the server MUST:
1. Verify skill exists in the repository
2. Create symlink from active skills directory to repository skill
3. Return confirmation with activation status per host

**Pass Condition**: Response confirms symlink creation with path details; symlink is functional (not broken).

**Fail Condition**: Skill not found error, symlink creation fails, or broken symlink is created.

**Evidence Requirements**:
- Request JSON with skill name and host targets
- Response JSON with activation results
- Symlink path reported in response
- Verification that symlink resolves correctly (via follow-up fleet_status)

---

### VAL-MCP-006: fleet_deactivate Tool Execution

**Title**: fleet_deactivate removes skill symlink from target hosts

**Behavioral Description**:  
When a client invokes `tools/call` with `name: "fleet_deactivate"` specifying a skill name and target hosts, the server MUST:
1. Locate existing symlink in active skills directory
2. Remove symlink (not the source skill)
3. Return confirmation with deactivation status per host

**Pass Condition**: Response confirms symlink removal; skill no longer appears in active skills.

**Fail Condition**: Symlink not found when it should exist, source skill is deleted instead of symlink, or operation fails silently.

**Evidence Requirements**:
- Request JSON with skill name and host targets
- Response JSON with deactivation results
- Pre/post state verification via fleet_status
- Confirmation source skill repository remains intact

---

### VAL-MCP-007: fleet_pull Tool Execution

**Title**: fleet_pull fetches latest repository changes on target hosts

**Behavioral Description**:  
When a client invokes `tools/call` with `name: "fleet_pull"` and target hosts, the server MUST:
1. Execute `git pull --rebase` or equivalent on each host's skill repository
2. Report outcome (updated/already-up-to-date/conflict/error) per host
3. Include new HEAD commit hash in success cases

**Pass Condition**: Each host reports pull outcome with commit hash; no unhandled exceptions.

**Fail Condition**: Silent failures, missing per-host results, or server crashes on git conflicts.

**Evidence Requirements**:
- Request JSON with host targets
- Response JSON with pull results per host
- HEAD commit hashes before and after operation
- Any conflict or error details if applicable

---

### VAL-MCP-008: fleet_drift Tool Execution

**Title**: fleet_drift detects commit divergence across fleet

**Behavioral Description**:  
When a client invokes `tools/call` with `name: "fleet_drift"`, the server MUST:
1. Query HEAD commit from each enabled host
2. Compare commits to detect divergence
3. Return structured drift report indicating which hosts differ from reference

**Pass Condition**: Response includes commit hash per host and clear indication of drift/no-drift status with reference commit identified.

**Fail Condition**: Missing hosts in report, incorrect comparison logic, or ambiguous drift indication.

**Evidence Requirements**:
- Request JSON (may be empty args)
- Response JSON with per-host commit data
- Drift determination (in-sync hosts vs. drifted hosts)
- Reference commit used for comparison

---

### VAL-MCP-009: fleet_rollback Tool Execution

**Title**: fleet_rollback checks out specified ref on target hosts

**Behavioral Description**:  
When a client invokes `tools/call` with `name: "fleet_rollback"` specifying a git ref (commit SHA, tag, or branch) and target hosts, the server MUST:
1. Validate ref exists on target hosts
2. Execute `git checkout -B <branch> <ref>` or equivalent
3. Report success/failure per host with resulting HEAD

**Pass Condition**: Each targeted host is checked out to the specified ref; HEAD matches expected value.

**Fail Condition**: Invalid ref not rejected, checkout fails without clear error, or hosts left in detached HEAD state unexpectedly.

**Evidence Requirements**:
- Request JSON with ref and host targets
- Response JSON with rollback results per host
- Resulting HEAD commit per host
- Verification ref exists before operation

---

### VAL-MCP-010: Error Response Format

**Title**: Tool errors return properly formatted MCP error responses

**Behavioral Description**:  
When any tool encounters an error condition (invalid arguments, host unreachable, git operation failure), the server MUST return a `CallToolResult` with:
- `isError: true` flag set
- `content` array containing error description
- Error content includes actionable information (error type, affected host, suggested resolution)

**Pass Condition**: Error responses have `isError: true`, non-empty content with error details, and valid JSON structure.

**Fail Condition**: Errors returned as success, empty error messages, or malformed response structure.

**Evidence Requirements**:
- Triggering error condition (e.g., invalid host name, missing skill)
- Full error response JSON
- Verification `isError` flag is true
- Error message content inspection

---

### VAL-MCP-011: Malformed Request Handling

**Title**: Server gracefully handles malformed JSON-RPC requests

**Behavioral Description**:  
When the server receives malformed input via stdin, it MUST:
1. Not crash or terminate unexpectedly
2. Return a JSON-RPC error response with appropriate error code:
   - `-32700` for parse errors (invalid JSON)
   - `-32600` for invalid request structure
   - `-32601` for method not found
   - `-32602` for invalid params
3. Continue accepting subsequent valid requests

**Pass Condition**: Server returns appropriate JSON-RPC error, remains operational, and processes next valid request correctly.

**Fail Condition**: Server crashes, hangs, returns success for invalid input, or becomes unresponsive after malformed request.

**Evidence Requirements**:
- Malformed input sent (invalid JSON, missing fields, unknown method)
- Error response with JSON-RPC error code
- Subsequent valid request/response pair proving server continuity
- Process exit code verification (should not exit)

---

### VAL-MCP-012: stdio Transport Compliance

**Title**: Server uses line-delimited JSON over stdio transport

**Behavioral Description**:  
The MCP server MUST:
1. Read JSON-RPC requests from stdin, one per line
2. Write JSON-RPC responses to stdout, one per line
3. Not write non-JSON content to stdout (logs go to stderr only)
4. Handle partial line buffering correctly

**Pass Condition**: Each response is a single line of valid JSON; stdout contains only JSON-RPC messages; stderr may contain logs.

**Fail Condition**: Multi-line responses, non-JSON stdout output, or interleaved log messages on stdout.

**Evidence Requirements**:
- Raw stdout capture for multiple request/response cycles
- Line count verification (one response per line)
- JSON parse verification for each line
- Stderr capture showing any diagnostic output is separate

---

### VAL-MCP-013: Codex Desktop Integration Discovery

**Title**: MCP server is discoverable by Codex Desktop

**Behavioral Description**:  
The MCP server configuration MUST be structured such that Codex Desktop can:
1. Locate server executable/script via documented path or config
2. Launch server with stdio transport
3. Complete initialization handshake
4. Enumerate and invoke tools

**Pass Condition**: Codex Desktop can discover, launch, initialize, and list tools from the MCP server without manual intervention beyond initial configuration.

**Fail Condition**: Server requires undocumented setup, initialization fails from Codex Desktop context, or tools are not visible.

**Evidence Requirements**:
- MCP server configuration file/path
- Codex Desktop MCP configuration entry
- Captured initialization sequence from Codex Desktop
- Tool list visible in Codex Desktop interface

---

### VAL-MCP-014: Concurrent Request Handling

**Title**: Server handles sequential requests without state corruption

**Behavioral Description**:  
When multiple tool invocations are sent in sequence (e.g., `fleet_activate` followed immediately by `fleet_status`), the server MUST:
1. Process each request to completion before responding
2. Maintain consistent state between operations
3. Reflect changes from previous operations in subsequent responses

**Pass Condition**: Sequential operations complete correctly; `fleet_status` after `fleet_activate` shows newly activated skill.

**Fail Condition**: Race conditions, stale state returned, or operations interfere with each other.

**Evidence Requirements**:
- Sequence of requests sent
- Corresponding responses in order
- State verification showing causality (activate → visible in status)
- Timing data if relevant

---

### VAL-MCP-015: Server Graceful Shutdown

**Title**: Server exits cleanly when stdin closes

**Behavioral Description**:  
When the client closes stdin (EOF), the MCP server MUST:
1. Complete any in-progress operation
2. Clean up resources (connections, file handles)
3. Exit with code 0

**Pass Condition**: Server exits with code 0 after stdin EOF; no zombie processes or resource leaks.

**Fail Condition**: Server hangs after EOF, exits with non-zero code unexpectedly, or leaves orphan processes.

**Evidence Requirements**:
- stdin EOF signal sent (close pipe)
- Server exit code captured
- Process list verification (no orphans)
- Time to exit after EOF

---

## Summary Table

| ID | Title | Category |
|----|-------|----------|
| VAL-MCP-001 | Server Initialization Response | Protocol |
| VAL-MCP-002 | Tools List Response | Protocol |
| VAL-MCP-003 | fleet_status Tool Execution | Tool |
| VAL-MCP-004 | fleet_sync Tool Execution | Tool |
| VAL-MCP-005 | fleet_activate Tool Execution | Tool |
| VAL-MCP-006 | fleet_deactivate Tool Execution | Tool |
| VAL-MCP-007 | fleet_pull Tool Execution | Tool |
| VAL-MCP-008 | fleet_drift Tool Execution | Tool |
| VAL-MCP-009 | fleet_rollback Tool Execution | Tool |
| VAL-MCP-010 | Error Response Format | Error Handling |
| VAL-MCP-011 | Malformed Request Handling | Error Handling |
| VAL-MCP-012 | stdio Transport Compliance | Protocol |
| VAL-MCP-013 | Codex Desktop Integration Discovery | Integration |
| VAL-MCP-014 | Concurrent Request Handling | Reliability |
| VAL-MCP-015 | Server Graceful Shutdown | Lifecycle |

---

## Evidence Collection Tooling Notes

For automated validation, consider:
- **stdio harness**: Script that spawns server, sends JSON-RPC over pipes, captures responses
- **JSON Schema validators**: For MCP protocol and tool response schemas
- **Mock host environment**: SSH mock or local simulation for fleet operations
- **Codex Desktop test mode**: Configuration for integration testing with the desktop client

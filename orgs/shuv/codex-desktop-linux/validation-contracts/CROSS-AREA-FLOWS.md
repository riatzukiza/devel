# Validation Contracts: Cross-Area Flows

This document defines validation contract assertions for end-to-end workflows that span multiple system areas in the fleet-skills system.

**Areas Covered:**
- Core Infrastructure (host registry, SSH connections, config)
- Git Ops (repository operations)
- Skill Ops (activation, deactivation, drift detection)
- CLI (natural language commands via Codex)
- MCP Server (programmatic tool interface)

---

## VAL-CROSS-001: Full Sync Workflow

**Title:** Skill sync, activation, and verification end-to-end

**Behavioral Description:**
When a skill is synced from the remote repository, activated on a host, and verified, the complete workflow MUST:
1. Execute `git pull --rebase` on the target host's skill repository
2. Create a symlink from the active skills directory to the skill in the repository
3. Verify the symlink is valid and points to the correct skill directory
4. Report success only when all three steps complete without error

**Pass Condition:**
- Git pull completes with exit code 0
- Symlink exists at `{activeSkillsDir}/{skillName}` pointing to `{skillRepo}/{skillName}`
- Symlink target is a valid directory containing the expected skill files
- Host reports skill as "active" in subsequent status query

**Fail Condition:**
- Git pull fails (network error, merge conflict, authentication failure)
- Symlink creation fails (permission denied, path exists as file)
- Symlink verification fails (broken symlink, wrong target)
- Status query does not reflect the activated skill

**Evidence Requirements:**
- [ ] Git pull command output with exit code
- [ ] Pre-sync HEAD commit hash
- [ ] Post-sync HEAD commit hash
- [ ] Symlink creation command output
- [ ] `ls -la {activeSkillsDir}/{skillName}` showing symlink target
- [ ] `test -d {symlink_target}` verification result
- [ ] Skill status query result showing active state

---

## VAL-CROSS-002: Drift Detection and Resolution

**Title:** Detect commit drift across fleet and resolve via pull

**Behavioral Description:**
When hosts have divergent HEAD commits for the same skill repository, the system MUST:
1. Query HEAD commit from each enabled host in the fleet
2. Compare commits and identify hosts that are behind the remote
3. Execute resolution (git pull) on drifted hosts
4. Verify all hosts converge to the same HEAD after resolution

**Pass Condition:**
- All enabled hosts are queried successfully
- Drifted hosts are correctly identified (their HEAD differs from remote HEAD)
- Pull operation succeeds on all drifted hosts
- Post-resolution query shows all hosts have identical HEAD commits

**Fail Condition:**
- Any host fails to respond to HEAD query (SSH timeout, command error)
- Drift detection misses a drifted host
- Pull operation fails on any host
- Post-resolution shows remaining drift (hosts still have different HEADs)

**Evidence Requirements:**
- [ ] Pre-resolution HEAD map: `{hostname: commit_hash}` for all hosts
- [ ] Remote HEAD commit hash
- [ ] List of hosts identified as drifted
- [ ] Pull command output and exit code for each drifted host
- [ ] Post-resolution HEAD map: `{hostname: commit_hash}` for all hosts
- [ ] Comparison showing all HEADs now match

---

## VAL-CROSS-003: Rollback Workflow

**Title:** Tag, modify, rollback, and verify state restoration

**Behavioral Description:**
When creating a restore point, making changes, and rolling back, the system MUST:
1. Create a git tag at the current HEAD as a restore point
2. Allow subsequent modifications (commits, skill changes)
3. Execute rollback to the tagged restore point
4. Restore the exact state (files and symlinks) that existed at tag time

**Pass Condition:**
- Tag is created successfully and pushed to remote
- Post-tag modifications are reflected in working directory
- Rollback command (`git checkout -B {branch} {tag}`) succeeds
- Post-rollback HEAD matches the tagged commit
- File contents match the state at tag creation time
- Active skills (symlinks) are restored to tag-time state

**Fail Condition:**
- Tag creation fails (naming conflict, push rejected)
- Rollback fails (uncommitted changes, checkout error)
- Post-rollback HEAD does not match tag
- Files contain post-tag modifications
- Symlink state differs from tag-time snapshot

**Evidence Requirements:**
- [ ] Tag creation command output with tag name and commit
- [ ] `git push --tags` output confirming remote sync
- [ ] Pre-rollback HEAD showing post-tag commits
- [ ] Rollback command output and exit code
- [ ] Post-rollback HEAD matching tag commit
- [ ] `git diff {tag}` showing no differences (empty output)
- [ ] Symlink state snapshot before and after rollback

---

## VAL-CROSS-004: Multi-Host Operations

**Title:** Same operation produces consistent results on Linux and macOS hosts

**Behavioral Description:**
When executing the same fleet operation across hosts with different operating systems (Linux and macOS), the system MUST:
1. Execute the identical logical operation on both host types
2. Achieve equivalent outcomes despite platform differences
3. Handle platform-specific path conventions transparently
4. Report consistent status format regardless of host OS

**Pass Condition:**
- Operation completes successfully on both Linux and macOS hosts
- Skill state is equivalent (same commit, same active skills)
- Status output format is parseable and comparable across platforms
- No platform-specific errors occur

**Fail Condition:**
- Operation succeeds on one platform but fails on another
- Platform-specific paths cause command failures
- Status output differs in structure (not just paths) between platforms
- Platform detection fails or uses wrong paths

**Evidence Requirements:**
- [ ] Operation command and parameters used
- [ ] Linux host output with exit code and result
- [ ] macOS host output with exit code and result
- [ ] Side-by-side comparison of skill state (commit, active skills)
- [ ] Platform-specific paths used: `{host: {skillRepo, activeSkillsDir}}`
- [ ] Normalized status output for both hosts

---

## VAL-CROSS-005: CLI to MCP Parity

**Title:** CLI command and MCP tool invocation produce identical results

**Behavioral Description:**
When performing the same logical operation via CLI (natural language command through Codex) and via MCP (programmatic tool call), the system MUST:
1. Execute the same underlying operation
2. Produce semantically identical state changes
3. Return equivalent result information (success/failure, state data)

**Pass Condition:**
- Both interfaces accept the same logical operation
- State changes on target hosts are identical (same commits, same symlinks)
- Success/failure status matches between interfaces
- Result data contains equivalent information (may differ in format)

**Fail Condition:**
- One interface supports the operation but the other does not
- State changes differ (different commits, different symlink states)
- Success on one interface but failure on the other (or vice versa)
- Result data missing key information in one interface

**Evidence Requirements:**
- [ ] CLI command issued (natural language input)
- [ ] MCP tool call parameters (JSON input)
- [ ] CLI execution trace (commands run, outputs)
- [ ] MCP execution trace (commands run, outputs)
- [ ] Pre-operation state snapshot from target host
- [ ] Post-CLI-operation state snapshot
- [ ] Post-MCP-operation state snapshot (on fresh or reset host)
- [ ] Diff of final states showing equivalence

---

## VAL-CROSS-006: OTEL Tracing End-to-End

**Title:** Operation produces complete distributed traces in collector

**Behavioral Description:**
When an operation is executed (via CLI or MCP), OpenTelemetry tracing MUST:
1. Create a root span for the operation
2. Create child spans for each sub-operation (SSH connection, git command, etc.)
3. Propagate trace context across process boundaries
4. Export spans to the configured collector
5. Provide sufficient detail for debugging and performance analysis

**Pass Condition:**
- Root span is created with operation name and parameters
- Child spans cover SSH connection establishment, command execution, result parsing
- All spans have consistent trace_id
- Spans appear in OTEL collector within configured flush interval
- Span attributes include: host, command, exit_code, duration

**Fail Condition:**
- No root span created for operation
- Missing child spans for significant sub-operations
- Trace context broken (child spans have different trace_id)
- Spans do not appear in collector
- Critical attributes missing from spans

**Evidence Requirements:**
- [ ] Operation identifier (name, timestamp, parameters)
- [ ] OTEL collector query showing trace by trace_id
- [ ] Trace visualization showing span hierarchy
- [ ] Root span with attributes: `operation`, `user`, `timestamp`
- [ ] Child spans with attributes: `host`, `command`, `exit_code`, `duration_ms`
- [ ] Collector export latency (time from span creation to availability)
- [ ] Complete span tree matching expected operation structure

---

## VAL-CROSS-007: Error Propagation

**Title:** SSH failure surfaces correctly through CLI and MCP interfaces

**Behavioral Description:**
When an SSH connection or remote command fails, the error MUST:
1. Be detected at the point of failure
2. Preserve original error information (exit code, stderr, error type)
3. Propagate up through the call stack without loss of context
4. Surface to the user/caller with actionable information
5. Be consistent between CLI and MCP interfaces

**Pass Condition:**
- SSH failure is detected (connection refused, auth failure, timeout)
- Original error code and message are preserved
- Error is surfaced to user with: host, operation attempted, error type, original message
- CLI displays human-readable error with remediation hints
- MCP returns structured error with error_code, message, host, operation fields
- No silent failures or generic "unknown error" messages

**Fail Condition:**
- SSH failure is swallowed or ignored
- Error message loses original context (just "operation failed")
- Error type is misclassified (timeout shown as auth failure)
- CLI crashes or hangs instead of reporting error
- MCP returns success or unstructured error
- Different error information between CLI and MCP for same failure

**Evidence Requirements:**
- [ ] Induced failure type (e.g., SSH port blocked, invalid key, command not found)
- [ ] Raw SSH error output (stderr, exit code)
- [ ] CLI error display (full message shown to user)
- [ ] MCP error response (JSON structure with fields)
- [ ] Comparison showing error context preserved through propagation
- [ ] Error classification accuracy (timeout vs auth vs command failure)
- [ ] Remediation hints provided (if applicable)

---

## Summary Table

| ID | Flow | Areas Involved | Critical Success Factor |
|----|------|----------------|------------------------|
| VAL-CROSS-001 | Full Sync Workflow | Git Ops, Skill Ops, Core Infra | Atomic completion of pull→activate→verify |
| VAL-CROSS-002 | Drift Detection | Core Infra, Git Ops, Skill Ops | All hosts queried and resolved |
| VAL-CROSS-003 | Rollback Workflow | Git Ops, Skill Ops | Exact state restoration |
| VAL-CROSS-004 | Multi-Host Ops | Core Infra, CLI/MCP | Platform-agnostic consistency |
| VAL-CROSS-005 | CLI/MCP Parity | CLI, MCP Server | Identical outcomes |
| VAL-CROSS-006 | OTEL Tracing | All Areas | Complete trace capture |
| VAL-CROSS-007 | Error Propagation | Core Infra, CLI, MCP | Context-preserving error surfacing |

---

## Appendix: Test Environment Requirements

For validation execution, ensure:
- At least 2 hosts configured (1 Linux, 1 macOS) for VAL-CROSS-004
- OTEL collector running and accessible for VAL-CROSS-006
- Network simulation capability for VAL-CROSS-007 (firewall rules, SSH key revocation)
- Fresh git repository state or reset capability between test runs
- Both CLI (Codex interface) and MCP server available for VAL-CROSS-005

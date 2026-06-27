# Validation Contracts: CLI Tool

**Area:** CLI  
**Milestone:** 3 - CLI Tool  
**Target Hosts:** shuvtest, shuvbot (real SSH hosts)

---

## VAL-CLI-001: Fleet Status - Basic Output

**Title:** `fleet status` displays all configured hosts with their current status

**Behavioral Description:**  
When `fleet status` is invoked without arguments, the CLI MUST:
1. Connect to all configured hosts via SSH
2. Display a table/list showing each host name and its status
3. Exit with code 0 if all hosts are reachable
4. Exit with non-zero if any host is unreachable

**Pass Condition:** Output contains a row for each configured host (shuvtest, shuvbot) with status indicator (online/offline/error).

**Evidence Requirements:**
- CLI stdout capture showing host list
- Exit code value
- SSH connection logs (if verbose mode enabled)

---

## VAL-CLI-002: Fleet Status - Connection Failure Handling

**Title:** `fleet status` gracefully handles unreachable hosts

**Behavioral Description:**  
When `fleet status` is invoked and one or more hosts are unreachable, the CLI MUST:
1. Attempt connection to all hosts (not stop at first failure)
2. Report reachable hosts as online
3. Report unreachable hosts with error message (e.g., "connection refused", "timeout")
4. Exit with non-zero code indicating partial failure

**Pass Condition:** Output shows status for all hosts; unreachable hosts marked with error; reachable hosts marked online.

**Evidence Requirements:**
- CLI stdout showing mixed online/error states
- Exit code (non-zero)
- Individual host error messages

---

## VAL-CLI-003: Fleet Pull - Single Host

**Title:** `fleet pull <host>` pulls latest changes on specified host

**Behavioral Description:**  
When `fleet pull <host>` is invoked with a valid host name, the CLI MUST:
1. SSH into the specified host
2. Execute `git pull` in the skills repository directory
3. Report the git output (commits pulled, already up-to-date, or error)
4. Exit 0 on success, non-zero on failure

**Pass Condition:** Git pull output displayed; repository updated; exit code reflects success/failure.

**Evidence Requirements:**
- CLI stdout showing git pull output
- Exit code
- Post-pull git log on host (verification)

---

## VAL-CLI-004: Fleet Pull - Multiple Hosts

**Title:** `fleet pull` without arguments pulls on all hosts

**Behavioral Description:**  
When `fleet pull` is invoked without a host argument, the CLI MUST:
1. Iterate through all configured hosts
2. Execute pull on each host
3. Aggregate and display results per host
4. Exit 0 only if all pulls succeed

**Pass Condition:** Pull results shown for each host; aggregated success/failure report.

**Evidence Requirements:**
- CLI stdout showing per-host pull results
- Overall exit code
- Summary line indicating X succeeded, Y failed

---

## VAL-CLI-005: Fleet Sync - Skill Transfer

**Title:** `fleet sync <skill> [hosts...]` copies skill to specified hosts

**Behavioral Description:**  
When `fleet sync <skill>` is invoked, the CLI MUST:
1. Locate the skill directory locally
2. Transfer skill files to target hosts via rsync/scp
3. Report transfer progress or completion per host
4. Exit 0 if all transfers succeed, non-zero otherwise

**Pass Condition:** Skill files present on target hosts after sync; CLI reports success per host.

**Evidence Requirements:**
- CLI stdout showing sync progress/completion
- Exit code
- File listing on target hosts confirming skill presence
- Checksum comparison (optional)

---

## VAL-CLI-006: Fleet Sync - Missing Skill Error

**Title:** `fleet sync` fails gracefully when skill doesn't exist

**Behavioral Description:**  
When `fleet sync <nonexistent-skill>` is invoked, the CLI MUST:
1. Check for skill existence locally before attempting transfer
2. Output clear error message: skill not found
3. Exit with non-zero code
4. NOT attempt SSH connections for invalid skill

**Pass Condition:** Error message displayed; exit code non-zero; no SSH connections made.

**Evidence Requirements:**
- CLI stderr/stdout showing "skill not found" or equivalent
- Exit code (non-zero)
- Absence of SSH connection attempts in verbose/debug output

---

## VAL-CLI-007: Fleet Activate - Symlink Creation

**Title:** `fleet activate <skill> [hosts...]` creates activation symlink

**Behavioral Description:**  
When `fleet activate <skill>` is invoked, the CLI MUST:
1. SSH to target hosts
2. Create symlink in the active skills directory pointing to the skill
3. Verify symlink was created
4. Report success/failure per host
5. Exit 0 if all activations succeed

**Pass Condition:** Symlink exists on target hosts; CLI reports activation success.

**Evidence Requirements:**
- CLI stdout showing activation result per host
- Exit code
- `ls -la` output from target hosts showing symlink

---

## VAL-CLI-008: Fleet Activate - Already Active

**Title:** `fleet activate` handles already-active skill idempotently

**Behavioral Description:**  
When `fleet activate <skill>` is invoked for a skill that is already active, the CLI MUST:
1. Detect existing symlink
2. Report that skill is already active (not an error)
3. Exit 0 (idempotent operation)

**Pass Condition:** CLI reports "already active" or equivalent; exit code 0.

**Evidence Requirements:**
- CLI stdout showing idempotent message
- Exit code 0
- Symlink unchanged on host

---

## VAL-CLI-009: Fleet Deactivate - Symlink Removal

**Title:** `fleet deactivate <skill> [hosts...]` removes activation symlink

**Behavioral Description:**  
When `fleet deactivate <skill>` is invoked, the CLI MUST:
1. SSH to target hosts
2. Remove the symlink for the specified skill
3. Verify symlink was removed
4. Report success/failure per host
5. Exit 0 if all deactivations succeed

**Pass Condition:** Symlink no longer exists on target hosts; CLI reports deactivation success.

**Evidence Requirements:**
- CLI stdout showing deactivation result per host
- Exit code
- `ls -la` output from target hosts confirming symlink removal

---

## VAL-CLI-010: Fleet Deactivate - Not Active

**Title:** `fleet deactivate` handles not-active skill gracefully

**Behavioral Description:**  
When `fleet deactivate <skill>` is invoked for a skill that is not currently active, the CLI MUST:
1. Detect missing symlink
2. Report that skill is not active (not an error, or warning)
3. Exit 0 (idempotent operation)

**Pass Condition:** CLI reports "not active" or equivalent; exit code 0.

**Evidence Requirements:**
- CLI stdout showing idempotent message
- Exit code 0

---

## VAL-CLI-011: Fleet Rollback - Checkout Reference

**Title:** `fleet rollback <ref> [hosts...]` checks out specified git reference

**Behavioral Description:**  
When `fleet rollback <ref>` is invoked, the CLI MUST:
1. SSH to target hosts
2. Execute `git checkout <ref>` in the skills repository
3. Report the checkout result per host
4. Exit 0 if all checkouts succeed, non-zero otherwise

**Pass Condition:** Target hosts at specified ref; CLI reports success per host.

**Evidence Requirements:**
- CLI stdout showing checkout result per host
- Exit code
- `git rev-parse HEAD` output from hosts matching expected ref

---

## VAL-CLI-012: Fleet Rollback - Invalid Reference

**Title:** `fleet rollback` fails gracefully for invalid git reference

**Behavioral Description:**  
When `fleet rollback <invalid-ref>` is invoked, the CLI MUST:
1. Attempt checkout on target hosts
2. Capture git error about invalid reference
3. Report failure with git error message
4. Exit non-zero

**Pass Condition:** Error message displayed indicating invalid ref; exit code non-zero.

**Evidence Requirements:**
- CLI stdout/stderr showing git error
- Exit code (non-zero)
- Hosts remain at previous ref (no state change)

---

## VAL-CLI-013: Fleet Tag - Create Tag

**Title:** `fleet tag <name> [ref]` creates git tag

**Behavioral Description:**  
When `fleet tag <name>` is invoked, the CLI MUST:
1. Create git tag at current HEAD (or specified ref)
2. Push tag to remote (if configured)
3. Report tag creation success
4. Exit 0 on success

**Pass Condition:** Tag exists in repository; CLI reports success.

**Evidence Requirements:**
- CLI stdout showing tag created
- Exit code
- `git tag -l <name>` output confirming tag exists

---

## VAL-CLI-014: Fleet Tag - Duplicate Tag Error

**Title:** `fleet tag` fails when tag already exists

**Behavioral Description:**  
When `fleet tag <name>` is invoked with an existing tag name, the CLI MUST:
1. Detect existing tag
2. Report error: tag already exists
3. Exit non-zero
4. NOT overwrite existing tag (unless force flag provided)

**Pass Condition:** Error message displayed; exit code non-zero; existing tag unchanged.

**Evidence Requirements:**
- CLI stdout/stderr showing "tag exists" error
- Exit code (non-zero)
- Original tag unchanged in repository

---

## VAL-CLI-015: Help Text - Main Command

**Title:** `fleet --help` displays usage information

**Behavioral Description:**  
When `fleet --help` or `fleet -h` is invoked, the CLI MUST:
1. Display usage synopsis
2. List all available subcommands with descriptions
3. Show global options
4. Exit 0

**Pass Condition:** Help text displayed with all commands listed; exit code 0.

**Evidence Requirements:**
- CLI stdout containing help text
- Exit code 0
- All subcommands (status, pull, sync, activate, deactivate, rollback, tag) present

---

## VAL-CLI-016: Help Text - Subcommand Help

**Title:** `fleet <command> --help` displays command-specific help

**Behavioral Description:**  
When `fleet <command> --help` is invoked for any subcommand, the CLI MUST:
1. Display command-specific usage
2. List command arguments and options
3. Show examples (if available)
4. Exit 0

**Pass Condition:** Command-specific help displayed; exit code 0.

**Evidence Requirements:**
- CLI stdout containing command-specific help
- Exit code 0
- Arguments and options documented

---

## VAL-CLI-017: Usage Error - Missing Required Argument

**Title:** CLI reports usage error for missing required arguments

**Behavioral Description:**  
When a command is invoked without required arguments (e.g., `fleet sync` without skill name), the CLI MUST:
1. Display error message indicating missing argument
2. Show correct usage syntax
3. Exit non-zero (typically exit code 1 or 2)

**Pass Condition:** Error message shows what's missing; usage hint provided; exit non-zero.

**Evidence Requirements:**
- CLI stderr/stdout showing missing argument error
- Usage syntax displayed
- Exit code (non-zero)

---

## VAL-CLI-018: Usage Error - Unknown Command

**Title:** CLI reports error for unknown subcommand

**Behavioral Description:**  
When an unknown subcommand is invoked (e.g., `fleet foobar`), the CLI MUST:
1. Display error: unknown command
2. Suggest similar commands or show available commands
3. Exit non-zero

**Pass Condition:** Error message for unknown command; available commands listed; exit non-zero.

**Evidence Requirements:**
- CLI stderr/stdout showing "unknown command" error
- List of valid commands or suggestion
- Exit code (non-zero)

---

## VAL-CLI-019: Partial Success - Mixed Host Results

**Title:** CLI reports partial success when some hosts fail

**Behavioral Description:**  
When a multi-host operation (pull, sync, activate, etc.) succeeds on some hosts but fails on others, the CLI MUST:
1. Complete operations on all hosts (not short-circuit)
2. Report per-host success/failure status
3. Display summary: X succeeded, Y failed
4. Exit with special code indicating partial failure (e.g., exit 2)

**Pass Condition:** All hosts attempted; per-host results shown; summary accurate; exit code indicates partial failure.

**Evidence Requirements:**
- CLI stdout showing per-host results
- Summary line with counts
- Exit code (partial failure code, not 0, not general error)

---

## VAL-CLI-020: Partial Success - Output Format

**Title:** Partial success output is machine-parseable

**Behavioral Description:**  
When partial success occurs, the CLI output MUST:
1. Use consistent format per host (e.g., `[OK] host1`, `[FAIL] host2: reason`)
2. Support optional JSON output mode (`--json` flag) for scripting
3. Include error details for failed hosts

**Pass Condition:** Output follows documented format; JSON mode produces valid JSON.

**Evidence Requirements:**
- CLI stdout in standard format
- CLI stdout with `--json` flag producing valid JSON
- JSON contains host, status, and error fields

---

## VAL-CLI-021: SSH Connection - Authentication

**Title:** CLI uses standard SSH authentication methods

**Behavioral Description:**  
The CLI MUST authenticate to hosts using standard SSH mechanisms:
1. SSH agent (if running)
2. Default SSH key (~/.ssh/id_rsa, id_ed25519, etc.)
3. SSH config file (~/.ssh/config) for host-specific settings
4. NOT prompt for password in non-interactive mode

**Pass Condition:** CLI successfully authenticates to configured hosts using standard SSH.

**Evidence Requirements:**
- Successful command execution on hosts
- No password prompts in logs
- SSH agent or key used for auth

---

## VAL-CLI-022: SSH Connection - Timeout Handling

**Title:** CLI handles SSH connection timeouts gracefully

**Behavioral Description:**  
When SSH connection to a host times out, the CLI MUST:
1. Apply reasonable timeout (configurable, default ~30s)
2. Report timeout error for affected host
3. Continue with other hosts
4. Include timeout in error message

**Pass Condition:** Timeout occurs within expected window; error message mentions timeout; other hosts processed.

**Evidence Requirements:**
- CLI output showing timeout error
- Time elapsed within timeout window
- Other hosts in operation still processed

---

## Summary

| ID | Command | Behavior |
|----|---------|----------|
| VAL-CLI-001 | status | Basic output |
| VAL-CLI-002 | status | Connection failure handling |
| VAL-CLI-003 | pull | Single host |
| VAL-CLI-004 | pull | Multiple hosts |
| VAL-CLI-005 | sync | Skill transfer |
| VAL-CLI-006 | sync | Missing skill error |
| VAL-CLI-007 | activate | Symlink creation |
| VAL-CLI-008 | activate | Already active (idempotent) |
| VAL-CLI-009 | deactivate | Symlink removal |
| VAL-CLI-010 | deactivate | Not active (idempotent) |
| VAL-CLI-011 | rollback | Checkout reference |
| VAL-CLI-012 | rollback | Invalid reference |
| VAL-CLI-013 | tag | Create tag |
| VAL-CLI-014 | tag | Duplicate tag error |
| VAL-CLI-015 | help | Main command help |
| VAL-CLI-016 | help | Subcommand help |
| VAL-CLI-017 | usage | Missing required argument |
| VAL-CLI-018 | usage | Unknown command |
| VAL-CLI-019 | partial | Mixed host results |
| VAL-CLI-020 | partial | Output format (machine-parseable) |
| VAL-CLI-021 | ssh | Authentication methods |
| VAL-CLI-022 | ssh | Timeout handling |

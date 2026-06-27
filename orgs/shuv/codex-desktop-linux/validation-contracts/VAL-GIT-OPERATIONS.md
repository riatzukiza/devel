# Validation Contract: Git Operations

**Area:** Git Operations  
**Milestone:** 2 - Git & Skill Operations  
**Scope:** Remote git repository operations via SSH on fleet hosts  
**Test Environment:** Remote hosts with `~/repos/shuvbot-skills` git repository

---

## VAL-GIT-001: Get HEAD Commit

**Title:** Retrieve HEAD commit SHA from remote repository

**Behavioral Description:**  
When `getHead` is invoked on a remote host, the system SHALL return the full 40-character SHA-1 hash of the current HEAD commit. The operation MUST execute via SSH on the target host and read from the repository at `~/repos/shuvbot-skills`.

**Pass Condition:**  
- Returns a valid 40-character hexadecimal string matching regex `^[0-9a-f]{40}$`
- The returned SHA matches the output of `git rev-parse HEAD` executed directly on the remote host

**Fail Condition:**  
- Returns null, empty string, or malformed SHA
- Returns a SHA that does not match the actual HEAD on the remote
- Operation times out or throws unhandled exception

**Evidence Requirements:**  
1. Captured return value from `getHead` operation
2. Direct SSH verification: `ssh <host> "cd ~/repos/shuvbot-skills && git rev-parse HEAD"`
3. Timestamp of operation execution
4. Host identifier where operation was performed

---

## VAL-GIT-002: Get Current Branch Name

**Title:** Retrieve current branch name from remote repository

**Behavioral Description:**  
When `getBranch` is invoked on a remote host, the system SHALL return the name of the currently checked-out branch. If the repository is in detached HEAD state, the system SHALL return `HEAD` or an appropriate indicator of detached state.

**Pass Condition:**  
- Returns a non-empty string representing the branch name
- For attached HEAD: matches output of `git rev-parse --abbrev-ref HEAD`
- For detached HEAD: returns `HEAD` or equivalent detached-state indicator

**Fail Condition:**  
- Returns null or empty string when a branch is checked out
- Returns incorrect branch name
- Fails silently without indication when in detached state

**Evidence Requirements:**  
1. Captured return value from `getBranch` operation
2. Direct SSH verification: `ssh <host> "cd ~/repos/shuvbot-skills && git rev-parse --abbrev-ref HEAD"`
3. Repository state confirmation (attached vs detached HEAD)
4. Host identifier and timestamp

---

## VAL-GIT-003: Check Repository Dirty State

**Title:** Detect uncommitted changes in remote repository

**Behavioral Description:**  
When `isDirty` is invoked on a remote host, the system SHALL return a boolean indicating whether the working tree has uncommitted changes. This includes staged changes, unstaged modifications, and untracked files (if configured to track).

**Pass Condition:**  
- Returns `true` when working tree has modifications (staged or unstaged)
- Returns `false` when working tree is clean
- Correctly identifies dirty state matching `git status --porcelain` output (non-empty = dirty)

**Fail Condition:**  
- Returns `false` when uncommitted changes exist
- Returns `true` when repository is clean
- Ignores staged changes or reports inconsistent state

**Evidence Requirements:**  
1. Captured boolean return value from `isDirty` operation
2. Direct SSH verification: `ssh <host> "cd ~/repos/shuvbot-skills && git status --porcelain"`
3. If dirty: list of modified files
4. State before/after test file modifications (for positive test case)

---

## VAL-GIT-004: Pull Latest Changes

**Title:** Pull latest changes from remote origin

**Behavioral Description:**  
When `pull` is invoked on a remote host, the system SHALL fetch and merge changes from the configured upstream remote (typically `origin`). The operation MUST report success/failure status and any conflicts encountered. After successful pull, local HEAD SHALL match or be ahead of the remote tracking branch.

**Pass Condition:**  
- Operation completes without error when no conflicts exist
- Local HEAD advances to include new commits from remote
- Returns success status with commit count or "already up to date" indicator
- Fast-forward merge succeeds when applicable

**Fail Condition:**  
- Operation fails silently without error indication
- Merge conflicts are not reported to caller
- HEAD does not advance when new commits exist on remote
- Network failures are not properly surfaced

**Evidence Requirements:**  
1. HEAD SHA before and after pull operation
2. Pull operation return value/status
3. Direct verification: `ssh <host> "cd ~/repos/shuvbot-skills && git log --oneline -5"`
4. Remote tracking branch state: `git rev-parse origin/main`
5. Any error messages or conflict indicators

---

## VAL-GIT-005: Push Changes to Remote

**Title:** Push local commits to remote origin

**Behavioral Description:**  
When `push` is invoked on a remote host, the system SHALL push local commits to the configured upstream remote. The operation MUST report success/failure status, including rejection reasons (non-fast-forward, permission denied, etc.).

**Pass Condition:**  
- Local commits are visible on remote after successful push
- Returns success status when push completes
- Properly reports rejection for non-fast-forward pushes
- Authentication/authorization failures are clearly indicated

**Fail Condition:**  
- Push succeeds locally but commits are not on remote
- Non-fast-forward rejection is not reported
- Silent failure without error indication
- Partial push (some refs pushed, others failed) not reported

**Evidence Requirements:**  
1. Local HEAD SHA before push
2. Push operation return value/status
3. Remote verification: commits exist on origin after push
4. Any rejection messages or error codes
5. Git reflog entry for push operation

---

## VAL-GIT-006: Create Tag

**Title:** Create annotated or lightweight tag on remote repository

**Behavioral Description:**  
When `createTag` is invoked with a tag name (and optional message/commit reference), the system SHALL create a git tag at the specified commit (or HEAD if unspecified). Annotated tags MUST include tagger information and message when provided.

**Pass Condition:**  
- Tag is created with specified name
- Tag points to correct commit (specified or HEAD)
- Annotated tags contain message and tagger metadata
- Duplicate tag name results in clear error (not silent failure)

**Fail Condition:**  
- Tag is not created despite success indication
- Tag points to wrong commit
- Annotated tag metadata is missing or corrupt
- Duplicate tag silently overwrites existing tag

**Evidence Requirements:**  
1. Tag name and target commit SHA provided to operation
2. Operation return value/status
3. Direct verification: `ssh <host> "cd ~/repos/shuvbot-skills && git show-ref --tags <tagname>"`
4. For annotated tags: `git cat-file -p <tagname>` to verify metadata
5. Timestamp and host identifier

---

## VAL-GIT-007: List Tags

**Title:** List all tags in remote repository

**Behavioral Description:**  
When `listTags` is invoked on a remote host, the system SHALL return a list of all tag names in the repository. The list MAY be optionally filtered by pattern and MAY include tag metadata (commit SHA, message).

**Pass Condition:**  
- Returns array/list of tag names
- Includes all tags present in repository
- Tag names match output of `git tag --list`
- Empty list returned (not error) when no tags exist

**Fail Condition:**  
- Missing tags from list
- Returns error when repository has no tags
- Includes refs that are not tags
- Malformed response structure

**Evidence Requirements:**  
1. Captured return value (list of tags)
2. Direct verification: `ssh <host> "cd ~/repos/shuvbot-skills && git tag --list"`
3. Count comparison: returned list length vs actual tag count
4. Specific tag verification: spot-check 2-3 tags exist in returned list

---

## VAL-GIT-008: Checkout Specific Ref

**Title:** Checkout specific ref for rollback/version switching

**Behavioral Description:**  
When `checkoutRef` is invoked with a ref (branch name, tag name, or commit SHA), the system SHALL update the working tree to match that ref. For branch names, HEAD SHALL be attached to the branch. For tags and SHAs, detached HEAD state is acceptable.

**Pass Condition:**  
- Working tree files match the specified ref's content
- `git rev-parse HEAD` returns SHA matching the target ref
- Branch checkout results in attached HEAD to that branch
- No uncommitted changes are lost (operation should fail if dirty)

**Fail Condition:**  
- Working tree does not match target ref
- Uncommitted changes are silently discarded
- Invalid ref does not produce clear error
- Checkout appears to succeed but HEAD unchanged

**Evidence Requirements:**  
1. Target ref provided to operation
2. HEAD SHA before and after checkout
3. Direct verification: `ssh <host> "cd ~/repos/shuvbot-skills && git rev-parse HEAD"`
4. Working tree state verification (sample file content check)
5. Dirty state check before operation (if applicable)

---

## VAL-GIT-009: Handle Non-Repository Directory

**Title:** Graceful error when operating on non-git directory

**Behavioral Description:**  
When any git operation is invoked on a path that is not a git repository, the system SHALL return a clear error indicating "not a git repository" or equivalent. The operation SHALL NOT create a new repository, corrupt files, or fail silently.

**Pass Condition:**  
- Returns error status with descriptive message
- Error message contains "not a git repository" or equivalent
- No modifications made to filesystem
- Error is distinguishable from other failure types

**Fail Condition:**  
- Operation appears to succeed
- Silent failure (null return without error)
- Unhandled exception crashes the system
- Unexpected repository initialization

**Evidence Requirements:**  
1. Target path that is not a git repository
2. Operation invoked (any git operation)
3. Captured error response/exception
4. Filesystem state verification (no .git directory created)

---

## VAL-GIT-010: Handle Merge Conflicts

**Title:** Report merge conflicts during pull operation

**Behavioral Description:**  
When `pull` encounters merge conflicts, the system SHALL report the conflict state, including which files are conflicted. The system SHALL NOT leave the repository in an unrecoverable state and SHOULD provide guidance or options for resolution.

**Pass Condition:**  
- Conflict is detected and reported (not silent)
- List of conflicted files is provided
- Repository state is recoverable (can abort merge)
- Error type is distinguishable from network or permission errors

**Fail Condition:**  
- Pull reports success despite conflicts
- Conflicted files not identified
- Repository left in broken/locked state
- Automatic merge resolution loses data

**Evidence Requirements:**  
1. Setup: create divergent branches with conflicting changes
2. Pull operation return value showing conflict
3. List of conflicted files from response
4. Repository state: `git status` showing "both modified" files
5. Verification that `git merge --abort` recovers clean state

---

## VAL-GIT-011: Handle Authentication Failure

**Title:** Report authentication/authorization errors clearly

**Behavioral Description:**  
When git operations requiring remote access (push, pull) fail due to authentication or authorization issues, the system SHALL return a clear error distinguishing auth failure from other network errors.

**Pass Condition:**  
- Authentication failure returns specific error type/code
- Error message indicates credential or permission issue
- Distinct from timeout, DNS, or connection errors
- No credentials are logged or exposed in error messages

**Fail Condition:**  
- Auth failure indistinguishable from network error
- Credentials appear in error messages or logs
- Silent failure without error indication
- Retry loop without surfacing auth issue

**Evidence Requirements:**  
1. Intentionally misconfigured credentials or permissions
2. Operation attempted (push or pull)
3. Captured error response
4. Verification that credentials are not in logs
5. Error classification/type in response

---

## VAL-GIT-012: Handle Network Timeout

**Title:** Graceful handling of network timeouts during remote operations

**Behavioral Description:**  
When remote git operations (push, pull) encounter network timeouts, the system SHALL report the timeout with appropriate error classification. Operations SHOULD have configurable timeout values and MUST clean up any partial state.

**Pass Condition:**  
- Timeout produces clear error message
- Error is classified as network/timeout (not generic failure)
- Partial fetches or pushes do not corrupt repository
- Operation respects configured timeout duration

**Fail Condition:**  
- Hangs indefinitely without timeout
- Timeout corrupts repository state
- Error indistinguishable from other failures
- Retry loop without timeout escalation

**Evidence Requirements:**  
1. Network condition simulating timeout (firewall, disconnect)
2. Operation attempted with known timeout setting
3. Time elapsed before error returned
4. Repository state after timeout (verify no corruption)
5. Error message and classification

---

## Summary

| ID | Title | Category |
|----|-------|----------|
| VAL-GIT-001 | Get HEAD Commit | Read |
| VAL-GIT-002 | Get Current Branch Name | Read |
| VAL-GIT-003 | Check Repository Dirty State | Read |
| VAL-GIT-004 | Pull Latest Changes | Write |
| VAL-GIT-005 | Push Changes to Remote | Write |
| VAL-GIT-006 | Create Tag | Write |
| VAL-GIT-007 | List Tags | Read |
| VAL-GIT-008 | Checkout Specific Ref | Write |
| VAL-GIT-009 | Handle Non-Repository Directory | Error |
| VAL-GIT-010 | Handle Merge Conflicts | Error |
| VAL-GIT-011 | Handle Authentication Failure | Error |
| VAL-GIT-012 | Handle Network Timeout | Error |

---

**Document Version:** 1.0  
**Created:** 2026-03-15  
**Author:** Validation Contract Generator

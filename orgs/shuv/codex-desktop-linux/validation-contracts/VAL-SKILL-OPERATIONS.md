# Validation Contract: Skill Operations

**Area:** Skill Operations  
**Milestone:** 2 - Git & Skill Operations  
**Scope:** Skill discovery, synchronization, activation, and drift detection across fleet hosts  
**Test Environment:** Remote hosts with `~/repos/shuvbot-skills` repository and active skills directory

---

## VAL-SKILL-001: List All Skills in Repository

**Title:** Discover and enumerate all skills present in the skills repository

**Behavioral Description:**  
When `listSkills` is invoked on a host, the system SHALL enumerate all skill directories present in `~/repos/shuvbot-skills`. Each skill MUST be identified by its directory name. The operation SHALL return a list containing skill name, path, and metadata (if available from skill manifest).

**Pass Condition:**  
- Returns an array/list of skill objects or names
- List contains all top-level directories that represent valid skills
- Each skill entry includes at minimum: name and path
- Empty repository returns empty list (not error)

**Fail Condition:**  
- Missing skills from enumeration
- Returns error when repository exists but has no skills
- Includes non-skill directories (e.g., `.git`, `__pycache__`)
- Malformed response structure

**Evidence Requirements:**
- Captured return value from `listSkills` operation
- Direct SSH verification: `ssh <host> "ls -la ~/repos/shuvbot-skills"`
- Count comparison: returned list length vs actual skill directories
- Sample skill verification: spot-check 2-3 skills exist in returned list

---

## VAL-SKILL-002: Distinguish Active vs Inactive Skills

**Title:** Identify activation state of each skill

**Behavioral Description:**  
When `listSkills` or `getSkillStatus` is invoked, the system SHALL indicate whether each skill is currently active (symlinked to active skills directory) or inactive. The system MUST check for valid symlinks in the active skills directory pointing to the skill's repository path.

**Pass Condition:**  
- Active skills show `active: true` or equivalent status
- Inactive skills show `active: false` or equivalent status
- Broken symlinks are reported as inactive (not active)
- Status accurately reflects filesystem state

**Fail Condition:**  
- Active skill reported as inactive
- Inactive skill reported as active
- Broken symlink reported as active
- Status check fails silently without indication

**Evidence Requirements:**
- List of skills with their active/inactive status
- Direct SSH verification: `ssh <host> "ls -la <active_skills_dir>"`
- Symlink target verification for active skills
- Before/after activation state change verification

---

## VAL-SKILL-003: Transfer Skill Directory to Remote Host

**Title:** Synchronize skill files from local to remote host

**Behavioral Description:**  
When `syncSkill` is invoked with a skill name and target host, the system SHALL transfer the complete skill directory from the local repository to the remote host's repository. The transfer MUST use rsync or equivalent to handle incremental updates efficiently. The operation SHALL preserve file permissions and directory structure.

**Pass Condition:**  
- All skill files are present on remote host after sync
- Directory structure matches source exactly
- File permissions are preserved
- Incremental sync only transfers changed files

**Fail Condition:**  
- Missing files on remote after sync
- Directory structure differs from source
- File permissions not preserved (executable scripts lose +x)
- Full transfer occurs when only incremental needed

**Evidence Requirements:**
- Source skill directory listing with checksums
- Remote skill directory listing with checksums after sync
- rsync/scp command output showing files transferred
- File permission comparison: `stat` output for key files

---

## VAL-SKILL-004: Verify File Integrity After Sync

**Title:** Confirm transferred files match source exactly

**Behavioral Description:**  
After `syncSkill` completes, the system SHALL verify that all transferred files match their source counterparts. Verification MUST use checksum comparison (MD5, SHA256, or equivalent) for critical files. The operation SHALL report any mismatches detected.

**Pass Condition:**  
- All file checksums match between source and destination
- No missing files reported
- No extra files on destination (unless expected)
- Verification completes without errors

**Fail Condition:**  
- Checksum mismatch between source and destination
- Verification reports missing files
- Verification silently skips files
- Checksum computation fails without error indication

**Evidence Requirements:**
- Checksum manifest from source directory
- Checksum manifest from destination directory
- Comparison report showing match/mismatch per file
- Transfer log showing completion status

---

## VAL-SKILL-005: Create Activation Symlink

**Title:** Activate skill by creating symlink in active skills directory

**Behavioral Description:**  
When `activateSkill` is invoked with a skill name, the system SHALL create a symbolic link in the active skills directory pointing to the skill's repository path. The symlink name MUST match the skill directory name. The operation SHALL fail gracefully if the skill is already active.

**Pass Condition:**  
- Symlink exists in active skills directory after activation
- Symlink points to correct skill path in repository
- Symlink is valid (not broken)
- Operation returns success status

**Fail Condition:**  
- Symlink not created despite success indication
- Symlink points to wrong path
- Symlink is broken (target does not exist)
- Already-active skill causes unhandled error

**Evidence Requirements:**
- Skill name provided to operation
- Return value/status from `activateSkill`
- Direct SSH verification: `ssh <host> "ls -la <active_skills_dir>/<skill>"`
- Symlink target verification: `readlink <active_skills_dir>/<skill>`

---

## VAL-SKILL-006: Remove Deactivation Symlink

**Title:** Deactivate skill by removing symlink from active skills directory

**Behavioral Description:**  
When `deactivateSkill` is invoked with a skill name, the system SHALL remove the symbolic link from the active skills directory. The operation SHALL NOT remove the actual skill files in the repository. The operation SHALL fail gracefully if the skill is already inactive.

**Pass Condition:**  
- Symlink no longer exists in active skills directory after deactivation
- Skill files in repository remain intact
- Operation returns success status
- Already-inactive skill returns success or appropriate status (not error)

**Fail Condition:**  
- Symlink still exists after deactivation
- Actual skill files deleted (not just symlink)
- Already-inactive skill causes unhandled error
- Operation fails silently without status indication

**Evidence Requirements:**
- Skill name provided to operation
- Return value/status from `deactivateSkill`
- Direct SSH verification: `ssh <host> "ls -la <active_skills_dir>/"` (skill symlink absent)
- Repository verification: `ssh <host> "ls -la ~/repos/shuvbot-skills/<skill>"` (files intact)

---

## VAL-SKILL-007: Compare HEAD Commits Across Hosts

**Title:** Detect drift by comparing repository HEAD across fleet hosts

**Behavioral Description:**  
When `checkDrift` is invoked, the system SHALL query the HEAD commit SHA from each configured host and compare them. The operation MUST identify a reference commit (e.g., from primary host or newest commit) and report which hosts match vs differ. The comparison SHALL include all configured hosts.

**Pass Condition:**  
- Returns drift status for all configured hosts
- Hosts with matching HEAD marked as "in sync"
- Hosts with different HEAD marked as "drifted" with their SHA
- Reference commit clearly identified

**Fail Condition:**  
- Missing hosts from drift report
- Incorrect drift detection (reports drift when in sync, or vice versa)
- Reference commit not identified
- Unreachable host causes entire operation to fail

**Evidence Requirements:**
- List of hosts with their HEAD SHAs
- Reference commit SHA used for comparison
- Drift status per host (in_sync/drifted)
- Direct SSH verification: `ssh <host> "cd ~/repos/shuvbot-skills && git rev-parse HEAD"` for each host

---

## VAL-SKILL-008: Identify Drifted Hosts with Details

**Title:** Report detailed drift information including commit differences

**Behavioral Description:**  
When drift is detected, the system SHALL provide detailed information about the divergence. This MUST include the commit SHA on each drifted host, the number of commits behind/ahead (if determinable), and optionally the commit messages for divergent commits. The report SHALL clearly distinguish which hosts need to pull vs push.

**Pass Condition:**  
- Drifted hosts include their current HEAD SHA
- Behind/ahead count provided when hosts share history
- Report indicates direction of drift (needs pull vs needs push)
- Commit details available for recent divergent commits

**Fail Condition:**  
- Drifted hosts missing SHA information
- Behind/ahead count incorrect
- Direction of drift not indicated
- Unrelated repository histories not handled gracefully

**Evidence Requirements:**
- Drift report output showing per-host details
- Commit SHAs for drifted hosts
- Behind/ahead counts for hosts sharing history
- Direct verification: `ssh <host> "cd ~/repos/shuvbot-skills && git log --oneline -5"` per host
- Reference host identification

---

## Summary

| ID | Title | Category |
|----|-------|----------|
| VAL-SKILL-001 | List All Skills in Repository | Discovery |
| VAL-SKILL-002 | Distinguish Active vs Inactive Skills | Discovery |
| VAL-SKILL-003 | Transfer Skill Directory to Remote Host | Sync |
| VAL-SKILL-004 | Verify File Integrity After Sync | Sync |
| VAL-SKILL-005 | Create Activation Symlink | Activation |
| VAL-SKILL-006 | Remove Deactivation Symlink | Deactivation |
| VAL-SKILL-007 | Compare HEAD Commits Across Hosts | Drift Detection |
| VAL-SKILL-008 | Identify Drifted Hosts with Details | Drift Detection |

---

**Document Version:** 1.0  
**Created:** 2026-03-15  
**Author:** Validation Contract Generator

# Codex Desktop ↔ Overseer Pattern Mapping

This document maps overseer fleet management patterns to potential Codex Desktop implementations.

---

## Executive Summary

Codex Desktop can serve as an orchestrator for fleet skill management by leveraging its **Remote Connections** feature (SSH to hosts). The overseer patterns translate well, with most requiring thin adapter scripts on remote hosts rather than full agent deployments.

---

## Pattern Mapping Table

| Overseer Feature | Overseer Implementation | Codex Equivalent | What Exists | What Needs Building |
|-----------------|------------------------|------------------|-------------|---------------------|
| **Gateway Registration** | Fleet Relay DB (`gateways` table) + HTTP API | Remote Connections | ✅ SSH connection config | Config file for host metadata (runtime type, tags, enabled state) |
| **Host Connectivity** | `GatewayManager.connectGateway()` → HTTP probe to agent `/api/health` | SSH connection test | ✅ SSH connectivity | Simple health check script on each host |
| **Skill Repository** | Git-backed `~/repos/shuvbot-skills` + skill-registry.ts ops | Same git repo, SSH commands | ✅ Git CLI | Codex MCP tool or prompt commands for git operations |
| **Skill Activation** | Symlink `SKILLS_DIR/{skill}` → `REPO_DIR/{skill}` | SSH `ln -sf` | ✅ Unix symlinks | Wrapper script or direct SSH commands |
| **Skill Deactivation** | `unlinkSync(symlinkPath)` | SSH `rm` symlink | ✅ Unix commands | Wrapper script or direct SSH commands |
| **Drift Detection** | Compare `HEAD` commits across fleet via `/api/skills/head` | SSH `git rev-parse HEAD` on each host | ✅ Git CLI | Comparison logic in Codex prompt/skill |
| **Bulk Sync (pull)** | `fleetSkillsRoutes.post("/repo")` → parallel host requests | SSH `git pull --rebase` | ✅ Git CLI | Fleet iteration logic |
| **Bulk Push** | Sequential push through first clean host | SSH `git push` | ✅ Git CLI | Host selection logic |
| **Tag Management** | `createTag()` + push to remote | SSH `git tag && git push --tags` | ✅ Git CLI | None needed |
| **Rollback** | `checkoutRef()` → `git checkout -B branch ref` | SSH `git checkout` | ✅ Git CLI | None needed |
| **Dead Symlink Cleanup** | `cleanupDeadSymlinks()` → detect + remove broken symlinks | SSH `find -L ... -type l` + `rm` | ✅ Unix commands | Detection script |
| **Audit Logging** | SQLite `audit_log` table + `writeAuditLog()` | Codex session history / file log | ✅ Session memory | Optional: structured log file |
| **Fleet Sync Log** | `fleet_sync_log` table with before/after head snapshots | Local JSON file + git history | ✅ Can use files | Simple JSON append log |

---

## Architecture: Codex as Fleet Orchestrator

```
┌─────────────────────────────────────────────────────────────────┐
│                      Codex Desktop (Local)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Fleet Skills Prompt/Skill                                  ││
│  │  - Host registry (JSON/YAML config file)                    ││
│  │  - Skill operations via SSH commands                        ││
│  │  - Drift detection logic                                    ││
│  │  - Sync log (append-only JSON file)                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                    SSH (Remote Connections)                      │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Host A       │    │  Host B       │    │  Host C       │
│  ┌──────────┐ │    │  ┌──────────┐ │    │  ┌──────────┐ │
│  │Git Repo  │ │    │  │Git Repo  │ │    │  │Git Repo  │ │
│  │skills/   │ │    │  │skills/   │ │    │  │skills/   │ │
│  └──────────┘ │    │  └──────────┘ │    │  └──────────┘ │
│  ┌──────────┐ │    │  ┌──────────┐ │    │  ┌──────────┐ │
│  │Active    │ │    │  │Active    │ │    │  │Active    │ │
│  │Symlinks  │ │    │  │Symlinks  │ │    │  │Symlinks  │ │
│  └──────────┘ │    │  └──────────┘ │    │  └──────────┘ │
│  ┌──────────┐ │    │  ┌──────────┐ │    │  ┌──────────┐ │
│  │Runtime   │ │    │  │Runtime   │ │    │  │Runtime   │ │
│  │(OpenClaw/│ │    │  │(OpenClaw/│ │    │  │(OpenClaw/│ │
│  │ Shiv)    │ │    │  │ Shiv)    │ │    │  │ Shiv)    │ │
│  └──────────┘ │    │  └──────────┘ │    │  └──────────┘ │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## What Codex Already Provides

1. **SSH Remote Connections** - Native feature for connecting to remote hosts
2. **Terminal Execution** - Can run arbitrary commands via SSH
3. **File Operations** - Can read/write files on remote hosts
4. **Session Memory** - Natural audit trail in conversation history
5. **Multi-file Context** - Can work with config files, scripts, logs

---

## What Needs Building

### 1. Host Registry Config (`~/.codex-fleet/hosts.yaml`)

```yaml
hosts:
  shuvtest:
    ssh: shuv@shuvtest
    runtime: openclaw
    tags: [dev, primary]
    skillRepo: ~/repos/shuvbot-skills
    activeSkillsDir: ~/.openclaw/workspace/skills
    enabled: true
    
  shuvprod:
    ssh: shuv@shuvprod
    runtime: shiv
    tags: [prod]
    skillRepo: ~/repos/shuvbot-skills
    activeSkillsDir: ~/.local/share/shiv/skills
    enabled: true
```

**Complexity**: Low - just a config file format definition

### 2. Fleet Skills Codex Skill/Prompt

A Codex skill that knows how to:
- Parse the host registry
- Execute SSH commands for skill operations
- Compare git HEADs for drift detection
- Format results as human-readable output

**Complexity**: Medium - needs well-structured prompts and possibly MCP integration

### 3. Helper Scripts on Hosts (Optional)

Thin scripts to simplify common operations:

```bash
#!/bin/bash
# ~/.local/bin/fleet-skill-status
# Returns JSON with skill state

REPO_DIR="${SKILL_REPO_DIR:-$HOME/repos/shuvbot-skills}"
SKILLS_DIR="${ACTIVE_SKILLS_DIR:-$HOME/.openclaw/workspace/skills}"

echo "{"
echo "  \"head\": \"$(git -C $REPO_DIR rev-parse HEAD 2>/dev/null)\","
echo "  \"branch\": \"$(git -C $REPO_DIR rev-parse --abbrev-ref HEAD 2>/dev/null)\","
echo "  \"dirty\": $(git -C $REPO_DIR diff --quiet && echo false || echo true),"
echo "  \"skills\": $(ls -1 $REPO_DIR 2>/dev/null | grep -v '^\\.' | jq -R . | jq -s .)"
echo "}"
```

**Complexity**: Low - simple shell scripts

### 4. Sync Log File (`~/.codex-fleet/sync-log.jsonl`)

Append-only JSON Lines file for tracking operations:

```jsonl
{"ts":"2024-01-15T10:30:00Z","action":"pull","hosts":["shuvtest","shuvprod"],"headsBefore":{"shuvtest":"abc123"},"headsAfter":{"shuvtest":"def456"}}
{"ts":"2024-01-15T10:35:00Z","action":"activate","hosts":["shuvtest"],"skill":"new-feature"}
```

**Complexity**: Low - just append to file

---

## Implementation Approach

### Phase 1: Manual Commands via Codex

Use Codex naturally with SSH remote connections:

```
User: Connect to shuvtest and check if skills are in sync
Codex: [SSH to shuvtest, runs git commands, reports status]

User: Pull latest skills on all hosts
Codex: [Iterates through known hosts, runs git pull on each]
```

### Phase 2: Structured Skill

Create a Codex skill that formalizes the operations:

```markdown
# Fleet Skills Manager

This skill manages skills across a fleet of hosts.

## Host Registry
Read hosts from ~/.codex-fleet/hosts.yaml

## Available Operations
- `fleet status` - Show drift status across all hosts
- `fleet pull [hosts...]` - Pull latest on specified hosts
- `fleet activate <skill> [hosts...]` - Activate skill on hosts
- `fleet deactivate <skill> [hosts...]` - Deactivate skill
- `fleet rollback <ref> [hosts...]` - Checkout specific ref
```

### Phase 3: MCP Integration (Optional)

If deeper integration is needed, create an MCP server that:
- Exposes fleet operations as tools
- Maintains connection state
- Provides structured responses

---

## Key Differences from Overseer

| Aspect | Overseer | Codex Fleet |
|--------|----------|-------------|
| **Agent Deployment** | Requires overseer-agent on each host | No agent needed, just SSH access |
| **UI** | Fleet PWA web interface | Codex chat interface |
| **Authentication** | RBAC with sessions | SSH keys (already configured) |
| **Real-time Updates** | SSE push events | On-demand queries |
| **Concurrency** | Effect-ts parallel operations | Sequential or parallel SSH |
| **State Storage** | SQLite database | Config files + git history |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| SSH connection overhead | Use connection multiplexing (`ControlMaster`) |
| No real-time drift alerts | Schedule periodic checks or rely on manual queries |
| No centralized audit DB | Git history + sync log provides audit trail |
| Complex rollback scenarios | Same git operations, just manual orchestration |

---

## Conclusion

Codex Desktop can effectively replace overseer's fleet-relay for skill management by:

1. Using SSH Remote Connections (already supported)
2. Running the same git/symlink operations via SSH
3. Storing configuration in simple files rather than a database
4. Leveraging conversation history as an audit trail

The main trade-off is losing the web UI and real-time push notifications, but gaining simpler deployment (no agents needed) and tighter integration with the AI assistant workflow.

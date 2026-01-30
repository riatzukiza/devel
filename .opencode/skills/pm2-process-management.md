# Skill: PM2 Process Management

## Goal
Start, stop, restart, and manage PM2 processes using pm2-clj DSL configurations.

## Use This Skill When
- The user wants to start/stop/restart a PM2 process
- You need to work with pm2-clj ecosystem files
- Managing system daemons or services under `system/daemons/**` or `orgs/**`
- The request mentions "pm2", "start", "stop", "restart" processes

## Do Not Use This Skill When
- The request is about creating new ecosystem configs (use separate skill)
- You need to migrate from legacy `ecosystem.config.*` to pm2-clj
- The task is purely about editing ecosystem files

## Inputs
- The target process name(s) or ecosystem file path
- Optional environment profile (development/production)
- PM2-specific operations (start, stop, restart, delete, logs, status, monit)

## Steps

### Start Processes
1. Identify the correct `ecosystem.pm2.edn` file for the target process
2. Use `pm2-clj start <path>/ecosystem.pm2.edn [--env <profile>]`
3. Verify with `pm2 list` or `pm2 status`

### Stop Processes
1. Identify process name(s) from the ecosystem
2. Use `pm2 stop <app-name>` for each process
3. Or use `pm2 delete <app-name>` to fully remove from PM2

### Restart Processes
1. Identify process name(s) to restart
2. Use `pm2 restart <app-name>` for each process
3. Verify with `pm2 list` or `pm2 logs <app-name>`

### Common Patterns

**System Daemons**:
```bash
# Start a specific daemon
pm2-clj start system/daemons/<group>/<name>/ecosystem.pm2.edn

# Start all daemons (via script)
cd system/daemons && ./start-all.sh

# Example: start heartbeat daemon
pm2-clj start system/daemons/services/heartbeat/ecosystem.pm2.edn
```

**Frontend Package**:
```bash
cd orgs/riatzukiza/promethean/packages/frontend
pm2-clj start ecosystem.pm2.edn --env development
# Starts: frontend-main, frontend-pantheon
```

**Sentinel Service**:
```bash
pm2-clj start orgs/riatzukiza/promethean/services/sentinel/ecosystem.pm2.edn
```

**Cephalon Discord Bots** (Multi-bot system with profiles):
```bash
# Start both Duck and OpenSkull bots
cd orgs/octave-commons/cephalon-clj
pm2-clj start ecosystem.pm2.edn

# Manage individual bots
pm2 restart duck-discord-io      # Restart Duck Discord interface
pm2 restart skull-discord-io     # Restart OpenSkull Discord interface
pm2 restart duck-brain           # Restart Duck brain process
pm2 restart skull-brain          # Restart OpenSkull brain process

# View Cephalon process status
pm2 list | grep -E "(duck|skull)"
# Shows: duck-discord-io, duck-brain, skull-discord-io, skull-brain

# Cephalon log management
pm2 logs duck-discord-io --lines 50
pm2 logs skull-brain --lines 100
```

### Environment Profiles
Use `--env` flag with pm2-clj to select environment:
```bash
pm2-clj start ecosystem.pm2.edn --env development
pm2-clj start ecosystem.pm2.edn --env production
```

## Strong Hints
- All ecosystem sources now use `*.pm2.edn` extension
- `pm2-clj start` renders config and passes to PM2 automatically
- Process names are defined in the `:apps` vector in the EDN file
- Use `pm2 list` to see running processes and their names
- Check logs with `pm2 logs <app-name>` or `pm2 monit` for real-time monitoring

## Output
- Confirmation of PM2 operation (start/stop/restart)
- Process status showing running/stopped state
- Any error messages from pm2-clj or PM2

## Related Skills
- Use `render-pm2-clj-config` skill to validate configs without starting
- Use `workspace-navigation` skill to locate ecosystem files

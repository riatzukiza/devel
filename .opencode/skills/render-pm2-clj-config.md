# Skill: PM2 Config Rendering

## Goal
Render pm2-clj ecosystem files to JSON for validation and debugging without starting processes.

## Use This Skill When
- The user wants to validate a pm2-clj ecosystem configuration
- You need to see what JSON pm2-clj will generate
- Debugging ecosystem DSL issues
- Verifying config parity after migrations

## Do Not Use This Skill When
- The user wants to actually start/stop/restart PM2 processes (use `pm2-process-management` skill)
- The request is about creating or editing ecosystem files
- You need to interact with running PM2 daemon

## Inputs
- Path to `ecosystem.pm2.edn` file
- Optional: output path for rendered JSON

## Steps
1. Locate the target `ecosystem.pm2.edn` file
2. Run `pm2-clj render <path>/ecosystem.pm2.edn`
3. Capture and validate the JSON output
4. Check for PM2 app structure validity

## Common Patterns

**Render single config**:
```bash
# Render to stdout
pm2-clj render system/daemons/services/heartbeat/ecosystem.pm2.edn

# Render to file
pm2-clj render system/daemons/services/heartbeat/ecosystem.pm2.edn > /tmp/heartbeat.json
```

**Validate structure**:
```bash
# Render and pipe to jq for validation
pm2-clj render ecosystem.pm2.edn | jq '.apps | length'
pm2-clj render ecosystem.pm2.edn | jq '.apps[].name'
```

**Verify environment variables**:
```bash
pm2-clj render ecosystem.pm2.edn | jq '.apps[].env'
pm2-clj render ecosystem.pm2.edn | jq '.apps[].env_production'
```

## Strong Hints
- pm2-clj outputs JSON to stdout by default
- Use `jq` for filtering and validation
- Check that `apps` array is present and non-empty
- Verify process names, scripts, and environment variables are correct
- Generated JSON should be valid PM2 configuration format

## Output
- Rendered JSON configuration
- Validation result (valid/invalid)
- Any errors or warnings from pm2-clj rendering

## Related Skills
- Use `pm2-process-management` skill to start/stop processes
- Use `workspace-navigation` skill to locate ecosystem files
- Use `create-pm2-clj-config` skill to create new ecosystem files

## Example Workflows

**Validate before starting**:
```bash
# 1. Render and validate
pm2-clj render system/daemons/services/heartbeat/ecosystem.pm2.edn | jq '.'

# 2. If valid, start process
pm2-clj start system/daemons/services/heartbeat/ecosystem.pm2.edn
```

**Compare configs**:
```bash
# Render both configs for comparison
pm2-clj render ecosystem.pm2.edn > /tmp/current.json
pm2-clj render ecosystem.pm2.edn.new > /tmp/new.json
diff /tmp/current.json /tmp/new.json
```

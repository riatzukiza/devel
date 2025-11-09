# Submodule CLI Migration Guide

## Overview

The submodule management system has been migrated from individual bash scripts to a unified Commander.js-based CLI tool.

## New CLI Structure

### Main Command
```bash
submodule <command> [options]
```

### Available Commands

#### `sync`
Sync .gitmodules mappings and initialize/update submodules.
```bash
submodule sync [--recursive] [--jobs <number>]
```

#### `update`
Fetch remote refs and update to latest tracked commits.
```bash
submodule update [--recursive] [--jobs <number>]
```

#### `status`
Show pinned commits and dirty submodule worktrees.
```bash
submodule status [--recursive]
```

#### `help`
Display help information.
```bash
submodule --help
submodule <command> --help
```

## Migration Mapping

| Old Script | New Command | Notes |
|------------|-------------|-------|
| `bin/submodules-sync` | `submodule sync` | Legacy alias still available with deprecation warning |
| `bin/submodules-update` | `submodule update` | Legacy alias still available with deprecation warning |
| `bin/submodules-status` | `submodule status` | Legacy alias still available with deprecation warning |

## Options

### Common Options
- `--recursive, -r`: Include nested submodules recursively
- `--jobs <number>, -j <number>`: Number of parallel jobs (default: 8)
- `--help, -h`: Display help for command

### Environment Variables
- `SUBMODULE_JOBS=<n>`: Control parallel job execution (default: 8)

## Examples

```bash
# Basic operations
submodule sync
submodule update
submodule status

# With options
submodule update --recursive --jobs 4
submodule status --recursive

# Help
submodule --help
submodule sync --help

# Using environment variable
SUBMODULE_JOBS=4 submodule update
```

## Backward Compatibility

Legacy script names continue to work for backward compatibility but display deprecation warnings:

```bash
# This still works but shows warning
./bin/submodules-update
# [warn] "submodules-update" is deprecated, use "submodule update" instead

# Preferred new syntax
submodule update
```

## Features

### Enhanced Help System
- Command-specific help with `submodule <command> --help`
- Comprehensive option descriptions
- Usage examples

### Improved Error Handling
- Better error messages
- Graceful handling of missing options
- Consistent exit codes

### Standardized Interface
- Consistent option flags across commands
- Unified output formatting
- Standardized logging

## Implementation Details

### Technology Stack
- **Commander.js**: CLI framework for command parsing and help generation
- **Bun**: JavaScript runtime for performance
- **TypeScript**: Type safety and better development experience

### Architecture
- Modular command structure
- Shared utilities for option parsing
- Consistent error handling
- Backward compatibility layer

### Future Enhancements
- Interactive mode for complex operations
- Progress bars for long-running operations
- Integration with workspace tools
- Advanced filtering and selection options
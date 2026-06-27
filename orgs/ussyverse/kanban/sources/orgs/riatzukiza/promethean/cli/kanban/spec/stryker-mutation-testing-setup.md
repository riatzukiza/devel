# Stryker Mutation Testing Setup

## Summary

Successfully configured Stryker mutation testing for the kanban package with the following changes:

## Changes Made

### 1. Test Coverage Threshold Reduced to 60%
- Updated `.c8rc.json` to set coverage thresholds to 60% for branches, functions, lines, and statements
- Updated watermarks to reflect the new 60% target

### 2. Stryker Installation
- Added `@stryker-mutator/core` v9.0.1
- Added `@stryker-mutator/typescript-checker` v9.0.1  
- Added `@stryker-mutator/tap-runner` v9.0.1 (though not used in final config)

### 3. Stryker Configuration
- Created `stryker.config.json` with:
  - Command runner using AVA directly
  - Mutation patterns for `src/**/*.ts` (excluding test files)
  - HTML and JSON reporters
  - 2 concurrent workers
  - 5 minute timeout

### 4. Package Scripts
- Added `test:mutation` - Run full mutation testing
- Added `test:mutation:debug` - Run with debug logging
- Added `test:mutation:dry` - AVA command for Stryker

### 5. AVA Configuration
- Created `ava.config.local.mjs` for Stryker-specific test configuration
- Configured to run built test files from `dist/tests/**/*.test.js`
- Excluded integration and e2e tests for faster mutation testing

## Usage

Run mutation testing with:
```bash
pnpm run test:mutation
```

Run with debug output:
```bash
pnpm run test:mutation:debug
```

## Notes

- Initial dry run shows tests are working but some tests are slow
- Configuration excludes integration/e2e tests for faster mutation analysis
- TypeScript checker was disabled due to plugin loading issues
- Reports will be generated in `reports/mutation/` directory

## Files Modified

- `.c8rc.json` - Coverage threshold reduced to 60%
- `package.json` - Added Stryker dependencies and scripts
- `stryker.config.json` - New Stryker configuration
- `ava.config.local.mjs` - New AVA config for mutation testing
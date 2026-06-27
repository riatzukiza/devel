# CI/CD Specification

**Version**: 1.0.0  
**Last Updated**: 2026-01-25  
**Dependencies**: core.md

## Overview

This project is a CLI-focused benchmarking tool for Ollama models with no traditional frontend/backend separation. The CI/CD pipeline will focus on testing the Clojure/babashka CLI tools and ensuring code quality.

## Project Structure

- **Backend**: Clojure CLI tools with babashka execution
- **Frontend**: TBD (will be added after CLI tool is mature)
- **Testing**: CLI tool validation and benchmark execution
- **Code Quality**: clj-kondo linting and typed Clojure annotations

## CI/CD Requirements

### GitHub Actions Workflow

#### Triggers
- Push to main branch
- Pull requests to main branch  
- Nightly runs (for full benchmark suite)

#### Jobs

1. **test-cli-tools**
   - Test all CLI benchmark scripts
   - Validate configuration files
   - Run quick development benchmarks

2. **lint-and-format**
   - clj-kondo static analysis
   - Code formatting checks
   - Documentation validation

3. **type-check**
   - Typed Clojure validation
   - Schema validation
   - Type annotation coverage

4. **integration-test**
   - Full benchmark execution (limited scope)
   - Tool calling validation
   - Report generation verification

### Test Commands

#### CLI Tool Tests
```bash
# Quick development tests
bb bench_ollama.clj --config config.dev.edn --out-dir reports-test -n 1

# Tool calling tests  
bb bench_tools.clj --config config.tools.edn --tools tools.clj --out-dir reports-test -n 1

# Advanced tool evaluation
bb bench_tool_calling.clj --model qwen3:4b --tools my_bench_tools.clj --out-dir reports-test -n 1

# Report aggregation test
bb aggregate_reports.clj reports-test
```

#### Linting
```bash
# clj-kondo static analysis
clj-kondo --lint src/ .clj

# Format validation (if formatter is added)
# TODO: Add cljfmt or similar
```

#### Type Checking
```bash
# Typed Clojure validation (requires deps.edn)
cd backend && clojure -X:typecheck
```

## Implementation Plan

### Phase 1: Basic CI/CD
- [ ] Create `.github/workflows/ci.yml`
- [ ] Add basic CLI tool testing
- [ ] Add clj-kondo linting
- [ ] Test configuration validation

### Phase 2: Type Checking
- [x] Create `deps.edn` for Clojure dependencies
- [x] Add basic typed Clojure annotations
- [ ] Configure type checking in CI (dependency issues with typed.clojure)
- [ ] Add type checking workflow (dependency issues with typed.clojure)

### Phase 3: Advanced Testing
- [ ] Add integration tests
- [ ] Add performance regression tests
- [ ] Add report validation
- [ ] Add nightly benchmark runs

## Files to Create

### `.github/workflows/ci.yml`
Main CI/CD workflow with all jobs

### `deps.edn` 
Clojure dependencies for type checking and testing

### Type annotations in key files:
- `src/promethean/ollama/config.clj`
- `src/promethean/ollama/client.clj` 
- `src/promethean/ollama/tools.clj`

## Success Criteria

1. **All tests pass** on every PR
2. **Type checking** validates without errors
3. **Linting** produces no warnings
4. **CLI tools** execute successfully in CI
5. **Reports** generate correctly
6. **Configuration** validation passes

## Dependencies

- **GitHub Actions**: Free tier sufficient
- **Babashka**: Pre-installed or setup in workflow
- **Clojure**: For type checking and testing
- **clj-kondo**: For static analysis
- **Ollama**: Optional for integration tests

## Notes

- Frontend development will be added after CLI tool maturity
- Type checking with typed.clojure has dependency resolution issues, optional for now
- Full benchmark suite may be too expensive for CI, use limited scope
- Configuration validation is critical for CLI tool reliability
- CLI tools are now working with babashka curl instead of clj-http
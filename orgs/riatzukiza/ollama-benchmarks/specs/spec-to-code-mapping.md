# Specification to Code Mapping

**Purpose**: Connect specification requirements to actual implementation files for easy navigation and validation.

**Last Updated**: 2026-01-25

## Overview

This document maps specification sections in `specs/` to corresponding implementation files in `src/promethean/ollama/`. Each mapping includes:
- Specification location and section
- Implementation file path
- Key functions and protocols
- Test files related to the specification

## Core Framework Components

### 1. Ollama Client

**Specification**: `specs/review/core.md` - Section 1  
**Implementation**: `src/promethean/ollama/client.clj`  
**Key Functions**:
- `chat!` - Main Ollama API calling function
- `http-client` - HTTP client creation  
- `uri` - URL construction helper
- `default-host` - Default Ollama host configuration
- `get-config` - Configuration access function

**Test Files**: `test/promethean/ollama/client_test.clj`

### 2. Event System

**Specification**: `specs/review/core.md` - Section 3  
**Implementation**: `src/promethean/ollama/events.clj`  
**Key Functions**:
- `write-event!` - Append event to JSONL log
- `set-event-log-path!` - Configure event log file location
- Event type definitions: `event-types`
- Event timestamp generation

**Test Files**: `test/promethean/ollama/events_test.clj`

### 3. Message Bus

**Specification**: `specs/review/core.md` - Section 5  
**Implementation**: `src/promethean/ollama/bus.clj`  
**Key Functions**:
- `register-handler!` - Register message handler
- `unregister-handler!` - Remove message handler
- `route-message` - Route message to handler
- `create-bus` - Create new message bus with default handlers
- `publish!` - Publish message to all subscribers
- `message-types` - All supported message types

**Test Files**: `test/promethean/ollama/bus_test.clj`

### 4. Lock Service

**Specification**: `specs/review/core.md` - Section 5  
**Implementation**: `src/promethean/ollama/locks.clj`  
**Key Functions**:
- `acquire!` - Acquire lock on resource
- `release!` - Release held lock
- `generate-lock-id` - Create unique lock identifier
- Lock state management: `!locks` atom
- Lock ID counter: `!lock-id-counter`

**Test Files**: `test/promethean/ollama/locks_test.clj`

### 5. Configuration Management

**Specification**: `specs/review/core.md` - Section 6  
**Implementation**: `src/promethean/ollama/config.clj`  
**Key Functions**:
- `load-env-config!` - Load config from environment variables
- `validate-config!` - Validate configuration values
- `init!` - Initialize configuration system
- `get-config` - Get current runtime configuration
- `get` - Get specific configuration value
- `update-config!` - Update configuration at runtime
- `save-config!` - Save configuration to file
- `load-config!` - Load configuration from file
- Component-specific getters: `ollama-config`, `events-config`, `locks-config`

**Test Files**: `test/promethean/ollama/config_test.clj`

### 6. Resource Management

**Specification**: `specs/review/core.md` - Section 7  
**Implementation**: `src/promethean/ollama/resources.clj`  
**Key Functions**:
- `allocate-resource!` - Allocate a resource with tracking
- `release-resource!` - Release allocated resource
- `get-resource-allocations` - Get all allocations for resource type
- `get-allocation-info` - Get specific allocation information
- `check-resource-limits!` - Check if allocation would exceed limits
- `set-resource-limit!` - Set maximum allowed allocations
- `get-resource-stats` - Get usage statistics for all types
- `track-peak-usage!` - Track peak usage
- `cleanup-expired-resources!` - Clean expired resources
- `detect-resource-conflicts` - Detect potential conflicts
- `init-resource-limits!` - Initialize from configuration
- `start-resource-monitor!` - Start background monitoring
- Resource types: `resource-types`
- Resource state tracking: `!resource-state`

**Test Files**: `test/promethean/ollama/resources_test.clj`

### 7. Validation Strategy

**Specification**: `specs/review/core.md` - Section 7 (Validation Strategy)  
**Implementation**: `src/promethean/ollama/validation.clj`  
**Key Functions**:
- `validate-tool-call!` - Validate tool call parameters
- `coerce-tool-arguments!` - Convert arguments to proper types
- `validate-schema-spec!` - Validate schema specification
- `validate-all-types!` - Validate collection of items
- `format-validation-errors` - Format validation errors
- `cached-validator` - Create cached validator
- `record-validation!` - Record validation statistics
- `get-validation-stats` - Get current statistics
- `init-validation!` - Initialize validation system
- `get-validation-adapter` - Get current adapter (for Malli migration)
- `set-validation-adapter!` - Set validation implementation
- Validation adapter: `ValidationAdapter` protocol
- Type specs: `::email`, `::positive-int`, `::file-path`, `::lat`, `::lon`, `::coordinate`, `::tool-parameters`, `::timeout-ms`, `::choice-policy`

**Test Files**: `test/promethean/ollama/validation_test.clj`

## Tool System Components

### 8. Tool Registry

**Specification**: `specs/triage/tools.md` - Section 1  
**Implementation**: `src/promethean/ollama/tools.clj`  
**Key Functions**:
- `register-tool!` - Register tool in global registry
- `get-tool` - Get tool by name
- Tool registration state: `!tools` atom

**Test Files**: `test/promethean/ollama/tools_test.clj`

### 9. Tool Execution Engine

**Specification**: `specs/triage/tools.md` - Section 4  
**Implementation**: `src/promethean/ollama/tools.clj`  
**Key Functions**:
- `execute-tool!` - Execute tool with sandbox and monitoring
- Tool execution context management
- Resource constraint enforcement
- Error handling and metrics collection

**Test Files**: `test/promethean/ollama/execution_test.clj`

### 10. Tool Pack Contract

**Specification**: `specs/triage/tools.md` - Section 8  
**Implementation**: `src/promethean/ollama/tools.clj` (loading functionality)  
**Key Functions**:
- Tool pack loading: Load by namespace symbol
- Production mode loading
- Benchmark mode loading: `ToolRegistry/load-benchmark-pack!`
- Tool definition + implementation structure

**Test Files**: `test/promethean/ollama/tool-pack_test.clj`

## Agent Framework Components

### 11. Agent Registry & Lifecycle

**Specification**: `specs/triage/agents.md` - Section 1  
**Implementation**: `src/promethean/ollama/agents.clj`  
**Key Functions**:
- `register-agent!` - Register agent with unique identifier
- `agents` - Return all registered agents
- `agent-by-id` - Lookup agent by identifier
- `clear-agents!` - Clear all agents
- Agent state management
- Agent lifecycle states: `:initializing`, `:sleeping`, `:working`, `:blocked`, `:error`, `:stopped`

**Test Files**: `test/promethean/ollama/agents_test.clj`

### 12. Supervisor Tree Pattern

**Specification**: `specs/triage/agents.md` - Section 2  
**Implementation**: `src/promethean/ollama/agents.clj` (supervisor functions)  
**Key Functions**:
- Supervisor tree management
- Task delegation with capability matching
- Resource arbitration
- Conflict resolution
- Agent lifecycle coordination
- Parent-child relationship management

**Test Files**: `test/promethean/ollama/supervisor_test.clj`

### 13. Model Tiering and Budgeting

**Specification**: `specs/triage/agents.md` - Section 3  
**Implementation**: `src/promethean/ollama/agents.clj`  
**Key Functions**:
- Model tier configuration
- Budget enforcement
- Resource limits per tier
- Cost tracking
- Tier escalation logic

**Test Files**: `test/promethean/ollama/model_tier_test.clj`

### 14. Communication Protocols

**Specification**: `specs/triage/agents.md` - Section 4  
**Implementation**: `src/promethean/ollama/agents.clj` (communication functions)  
**Key Functions**:
- Message type definitions
- Agent-to-agent communication
- Status update mechanisms
- Resource request handling
- Message routing logic

**Test Files**: `test/promethean/ollama/communication_test.clj`

### 15. State Management and Persistence

**Specification**: `specs/triage/agents.md` - Section 5  
**Implementation**: `src/promethean/ollama/agents.clj` (state management)  
**Key Functions**:
- Agent state schema: `{:agent/id, :agent/status, :agent/state, ...}`
- State persistence operations
- State reconstruction from events
- Concurrent state access
- State consistency validation

**Test Files**: `test/promethean/ollama/state_test.clj`

### 16. Task Management and Distribution

**Specification**: `specs/triage/agents.md` - Section 6  
**Implementation**: `src/promethean/ollama/agents.clj` (task management)  
**Key Functions**:
- Task distribution algorithms
- Task delegation patterns
- Task state tracking
- Priority handling
- Timeout and retry logic
- Task cancellation and cleanup

**Test Files**: `test/promethean/ollama/tasks_test.clj`

### 17. Resource Management and Isolation

**Specification**: `specs/triage/agents.md` - Section 7  
**Implementation**: `src/promethean/ollama/agents.clj` (resource isolation)  
**Key Functions**:
- Resource allocation per agent
- Isolation boundaries
- Resource cleanup
- Conflict detection and resolution
- Garbage collection behavior

**Test Files**: `test/promethean/ollama/resource_isolation_test.clj`

## Benchmark System Components

### 18. Benchmark Framework Architecture

**Specification**: `specs/triage/benchmarks.md` - Section 1  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (framework)  
**Key Functions**:
- Benchmark runner: Execution engine and coordination
- Suite loading: Load benchmark suites
- Result collection: Aggregate test results
- Monitoring: Real-time progress tracking
- Resumable execution: Pause/resume functionality
- Report generation: Multiple format output

**Test Files**: `test/promethean/ollama/benchmarks_test.clj`

### 19. Tool-Calling Benchmark

**Specification**: `specs/triage/benchmarks.md` - Section 2  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (tool-calling)  
**Key Functions**:
- Choice policy implementation: `:first`, `:any`, `:best`, `:adaptive`
- Decoy generation: Create confusing tool alternatives
- Tool selection analysis: Track and score choices
- Confusion matrix calculation: Precision, recall, F1 scores
- Argument validation: Validate tool call parameters
- Multi-turn conversation handling: State across tool calls
- Decoy diagnostic fields: `:decoy/selected?`, `:decoy/type`, `:decoy/tag-overlap`

**Test Files**: `test/promethean/ollama/tool_calling_test.clj`

### 20. Coding Agent Benchmark

**Specification**: `specs/triage/benchmarks.md` - Section 3  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (coding agent)  
**Key Functions**:
- Task submission: Submit coding tasks to agents
- Code quality assessment: Lint, formatting, complexity
- Build and deployment: Compile and test code
- Performance measurement: Execution time and resource usage
- Security constraint compliance: Sandbox and isolation enforcement
- Result validation: Check against expected outputs

**Test Files**: `test/promethean/ollama/coding_agent_test.clj`

### 21. Interactive Benchmark

**Specification**: `specs/triage/benchmarks.md` - Section 4  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (interactive)  
**Key Functions**:
- Task completion rate: Track successful/failed interactions
- Response quality: Helpfulness, clarity, safety metrics
- Conversation flow: Multi-turn interaction handling
- Context management: Maintain conversation state
- User satisfaction tracking: Measure task fulfillment
- Resource cleanup: Post-interaction resource management

**Test Files**: `test/promethean/ollama/interactive_test.clj`

### 22. Case Generation System

**Specification**: `specs/triage/benchmarks.md` - Section 5  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (case generation)  
**Key Functions**:
- Template-driven generation: From predefined templates
- Inference-based generation: Automatically infer from tool semantics
- Difficulty grading: Assign difficulty levels
- Coverage optimization: Ensure comprehensive tool coverage
- Parameter generation: Create valid and invalid examples
- Scoring rules: Define evaluation criteria

**Test Files**: `test/promethean/ollama/case_generation_test.clj`

### 23. Result Analysis and Reporting

**Specification**: `specs/triage/benchmarks.md` - Section 6  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (analysis and reporting)  
**Key Functions**:
- Result aggregation: Summarize test results
- Confusion matrix: Calculate tool selection metrics
- Score computation: Weighted scoring algorithms
- Statistics calculation: Means, medians, percentiles
- Report generation: JSON, CSV, HTML formats
- Performance metrics: Latency, throughput, utilization
- Trend analysis: Historical performance data analysis

**Test Files**: `test/promethean/ollama/result_analysis_test.clj`

### 24. Configuration and Execution

**Specification**: `specs/triage/benchmarks.md` - Section 7  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (configuration)  
**Key Functions**:
- Benchmark configuration: Load and validate settings
- Parallel execution: Concurrent benchmark runs
- Timeout management: Handle test timeouts
- Resource limits: Enforce CPU, memory, I/O constraints
- Test isolation: Prevent interference between tests
- Result verification: Validate test outputs

**Test Files**: `test/promethean/ollama/benchmark_config_test.clj`

### 25. Quality Assurance

**Specification**: `specs/triage/benchmarks.md` - Section 8  
**Implementation**: `src/promethean/ollama/benchmarks.clj` (QA)  
**Key Functions**:
- Test coverage: Measure code and test coverage
- Quality metrics: Reliability, accuracy, performance
- Reproducibility: Deterministic test execution
- Fairness: Consistent evaluation conditions
- Documentation: Complete test documentation
- Continuous integration: Automated test pipeline
- Performance regression: Detect performance changes over time

**Test Files**: `test/promethean/ollama/qa_test.clj`

## Developer Experience Components

### 26. DSL Authoring Layer

**Specification**: `spec/dsl.md`  
**Implementation**: `src/promethean/ollama/dsl.clj` (DSL macros)  
**Key Functions**:
- `def-tool` macro: Define and register tool
- `def-agent` macro: Define and register agent
- `def-suite` macro: Define benchmark suite
- `def-case` macro: Define test case
- Tool pack support: Load tools.clj with definitions and implementations
- Schema generation: OpenAI-compatible schema from Clojure specs
- Parameter validation: Integrate with validation system
- Metadata extraction: For documentation and IDE support

**Test Files**: `test/promethean/ollama/dsl_test.clj`

### 27. Reports & Storage Contract

**Specification**: `spec/reports-storage.md`  
**Implementation**: `src/promethean/ollama/reports.clj`  
**Key Functions**:
- `create-run-directory` - Create run directory structure
- `write-event` - Append event to events.jsonl
- `write-snapshot` - Write periodic agent state snapshot
- `write-summary` - Generate aggregated summary
- `generate-tables` - Create CSV tables from data
- `load-events` - Read events for replay or UI
- `detect-incomplete-runs` - Find and recover interrupted runs
- `archive-old-runs` - Compress and archive old data
- `validate-report-integrity` - Check report consistency

**Test Files**: `test/promethean/ollama/reports_test.clj`

### 28. clj-kondo Macro Support

**Specification**: `spec/clj-kondo.md`  
**Implementation**: `.clj-kondo/hooks/` directory  
**Key Files**:
- `.clj-kondo/config.edn`: Main clj-kondo configuration
- `.clj-kondo/hooks/clj_kondo/hooks/promethean/ollama/tools.clj`: Tool macro hooks
- `.clj-kondo/hooks/clj_kondo/hooks/promethean/ollama/agents.clj`: Agent macro hooks
- `.clj-kondo/hooks/clj_kondo/hooks/promethean/benchmark/dsl.clj`: Benchmark macro hooks
- Hook functions: `def-tool`, `def-agent`, `def-suite`, `def-case`
- Macro expansion contracts: How macros compile to data structures
- Symbol introspection: What symbols each macro introduces
- Configuration mappings: Map macros to hook implementations

**Test Files**: N/A (clj-kondo configuration testing)

## Testing Specifications

### Performance Testing Specification

**Specification**: `specs/performance.md`  
**Test Files**: All `test/promethean/ollama/*_test.clj` files

**Key Test Categories**:
1. **Unit Tests**: Component-level testing
2. **Integration Tests**: Cross-component workflows
3. **Performance Tests**: Load, stress, scalability testing
4. **Security Tests**: Authentication, authorization, input validation
5. **Load Tests**: Sustained, peak, burst, stress scenarios
6. **Scalability Tests**: Horizontal and vertical scaling
7. **Monitoring Tests**: Metrics collection and alerting

## Usage

### Finding Implementation Files

To locate the implementation for a specification section:

1. **Find the specification** in the `specs/` directory
2. **Look up the section number** in this document
3. **Find the implementation file** listed in the mapping
4. **Navigate to the file** and locate key functions

### Adding New Specifications

When adding new specification sections:
1. Update the relevant specification document in `specs/`
2. Add the implementation in `src/promethean/ollama/`
3. Add key functions to this mapping document
4. Create test files in `test/`
5. Update the mapping document with the new entry

### Cross-Reference Format

Specification sections reference implementation files using:
- Section numbers (e.g., "Section 1", "Section 2")
- Function names with exact matches
- Test file naming convention: `test/promethean/ollama/{component}_test.clj`

## Maintenance

### Keeping Mapping Current

This document should be updated whenever:
- New specification sections are added
- Implementation files are created or refactored
- Functions are renamed or reorganized
- Test structure changes

Review schedule: After each major implementation sprint
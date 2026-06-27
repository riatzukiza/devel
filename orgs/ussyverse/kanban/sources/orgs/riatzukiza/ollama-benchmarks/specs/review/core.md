'# Core Framework Specification

**Status**: DRAFT  
**Version**: 0.1.0  
**Last Updated**: 2026-01-25  
**Dependencies**: None (foundation spec)

## Overview

This specification defines the core framework components that underpin the entire ollama benchmark system, including the Ollama client, tool registry, event sourcing, and resource management systems.

## 1. Ollama Client Interface

### Purpose
Provide a unified, non-streaming interface to Ollama's /api/chat endpoint for both benchmark runners and production agents.

### Requirements
- **HTTP-based**: Java HttpClient with configurable timeouts
- **JSON handling**: Request/response serialization with cheshire
- **Tool support**: OpenAI-style tool schema transmission
- **Error handling**: Structured exception handling with detailed error context
- **Configuration**: Default host (http://localhost:11434), configurable model, options

### Interface
```clj
;; Core client interface
(defprotocol OllamaClient
  (chat! [{:keys [host model messages tools options timeout-ms think]}]
    "Calls Ollama /api/chat (non-stream)
   Returns decoded JSON response map."))

;; Tool schema format (OpenAI-compatible)
{:type "function"
 :function {:name "tool_name"
            :description "Tool description"
            :parameters {...JSON-Schema...}}}
```

## 2. Tool Registry and Validation

### Purpose
Centralized tool definition, registration, validation, and schema generation system supporting both production agents and benchmark environments.

### Requirements
- **Dynamic registration**: Tools can be registered at runtime
- **Schema generation**: Automatic OpenAI-compatible JSON schema from Clojure parameter definitions
- **Validation**: clojure.spec.alpha-based argument validation
- **Type coercion**: Automatic conversion between Clojure data types and JSON
- **Registry management**: Clear, list, and lookup operations

### Core Components
```clj
;; Tool definition structure
(defprotocol ToolRegistry
  (register-tool! [tool] "Register tool by name")
  (tools [] "Return all registered tools")
  (tool-by-name [name] "Lookup tool by name")
  (clear-tools! [] "Clear all tools"))

;; Tool validation
(defprotocol ToolValidator
  (validate-tool-call [{:keys [name arguments]}] "Validate tool call against spec")
  (coerce-arguments [arguments] "Convert JSON/string args to Clojure map")
  (tool->ollama-schema [tool] "Generate OpenAI-compatible schema"))
```

### Validation Strategy

We use **`clojure.spec.alpha`** for all validation and coercion:

#### Tool Definition Validation
```clj
;; Tool specs are defined using clojure.spec.alpha
(s/def ::tool-name string?)
(s/def ::tool-description string?)
(s/def ::tool-parameters (s/map-of keyword? any?))

(s/def ::tool (s/keys :req [::tool-name ::tool-description]
                       :opt [::tool-parameters]))
```

#### Runtime Validation
```clj
;; Tool call validation at runtime
(defn validate-tool-call! [tool-call]
  (let [tool (get-tool (:name tool-call))
        tool-spec (get-tool-spec tool)]
    (if (s/valid? tool-spec tool-call)
      tool-call
      (throw (ex-info "Invalid tool call" 
                      (s/explain-data tool-spec tool-call))))))
```

#### Coercion & Error Handling
```clj
;; JSON to Clojure coercion with clear error messages
(defn coerce-tool-arguments [args spec]
  (try
    (s/conform spec args)
    (catch Exception e
      (throw (ToolValidationError. 
               (str "Argument coercion failed: " (.getMessage e))
               args)))))
```

#### Migration Path to Malli
For future enhancement, the validation layer provides an abstraction that allows migration to Malli while maintaining backward compatibility:

```clj
;; Validation adapter interface
(defprotocol ValidationAdapter
  (validate [this data spec])
  (coerce [this data spec])
  (explain [this data spec]))

;; Current implementation uses spec.alpha
(defrecord SpecAdapter []
  ValidationAdapter
  (validate [data spec] (s/valid? spec data))
  (coerce [data spec] (s/conform spec data))
  (explain [data spec] (s/explain-data spec data)))

;; Future Malli implementation
(defrecord MalliAdapter []
  ValidationAdapter
  (validate [data spec] (m/validate spec data))
  (coerce [data spec] (m/decode spec data))
  (explain [data spec] (m/explain spec data)))
```

## 3. Event Sourcing and Logging

### Purpose
Provide durable, append-only event logging for state reconstruction, debugging, and resumable execution across benchmark runs and agent operations.

### Requirements
- **JSONL format**: Append-only structured logging
- **Event types**: Agent lifecycle, tool calls, state changes, errors
- **Atomic writes**: Thread-safe file operations
- **Replay capability**: Ability to reconstruct state from event stream
- **Performance**: Minimal overhead, async-friendly

### Event Schema
```clj
;; Core event types
{:event/type "agent/spawned"
 :agent/id "agent-identifier"
 :timestamp unix-ms
 :initial-state {...}}

{:event/type "tool/call-started"
 :agent/id "agent-identifier"
 :tool/name "tool-name"
 :call/id "unique-call-id"
 :arguments {...}
 :timestamp unix-ms}

{:event/type "tool/result"
 :agent/id "agent-identifier"
 :call/id "unique-call-id"
 :tool/name "tool-name"
 :ok true/false
 :value result-or-error-details
 :timestamp unix-ms}
```

## 4. Message Bus Architecture

### Purpose
Provide asynchronous communication between framework components (agents, benchmarks, tools) with structured routing and filtering capabilities.

### Requirements
- **Channel-based**: core.async channels for message passing
- **Event routing**: Type-based message filtering and delivery
- **Broadcast support**: One-to-many message distribution
- **Error isolation**: Channel-level error handling without cross-contamination
- **Performance**: Low-latency inter-component communication

### Message Types
```clj
;; Message protocol
(defprotocol BusMessage
  (message-type [] "Returns message type keyword")
  (target [] "Returns target recipient(s)")
  (payload [] "Returns message payload")
  (metadata [] "Returns optional metadata"))

;; Core message types
:agent/lifecycle     ; Agent start/stop/status
:tool/request       ; Tool execution requests  
:tool/result        ; Tool execution results
:bench/control      ; Benchmark control signals
:system/state       ; System state changes
```

## 5. File Locking and Resource Management

### Purpose
Provide exclusive access to shared resources (files, tools, models) with conflict detection, TTL support, and deadlock prevention.

### Requirements
- **Exclusive locks**: Write and read lock modes with owner tracking
- **TTL support**: Time-based lock expiration with heartbeat
- **Conflict resolution**: Structured conflict detection and escalation
- **Deadlock prevention**: Consistent locking order and timeout handling
- **Resource tracking**: Central registry of active locks and ownership

### Lock Operations
```clj
;; Lock service interface
(defprotocol LockService
  (acquire! [{:keys [path mode owner ttl-ms]}] "Acquire lock")
  (release! [{:keys [path owner]}] "Release lock")
  (heartbeat! [{:keys [path owner]}] "Extend lock TTL")
  (get-status [path] "Get lock status and owner")
  (force-release! [path] "Administrative override")
  (get-conflict-info [path requesting-owner] "Get conflict details for escalation")
  (open-conflict-thread! [path conflicting-owners] "Create conflict resolution thread"))
```

### Conflict Escalation Workflow

When an agent encounters a locked file, the framework provides a structured conflict resolution process:

#### Conflict Detection
```clojure
;; Agent attempts to acquire lock
(let [result (LockService/acquire! {:path "/data/results.csv"
                                    :mode :write
                                    :owner "agent-123"
                                    :ttl-ms 30000})]
  (if (= (:status result) :conflict)
    (handle-file-conflict! result)
    ;; Continue with lock acquired
    ))
```

#### Conflict Information Structure
```clojure
{:conflict/path "/data/results.csv"
 :conflict/requesting-owner "agent-123"
 :conflict/current-owner "agent-456"
 :conflict/lock-age-ms 15000
 :conflict/lock-ttl-ms 30000
 :conflict/mode :write
 :conflict/thread-id "thread-789"     ; If conflict thread exists
 :conflict/escalation-level 1       ; Current escalation level
 :conflict/available-actions [:wait :escalate :force-release]}
```

#### Conflict Resolution States
```clojure
{:conflict/states
 {:detected "Lock conflict identified"
 :negotiating "Agents in conflict resolution thread"
 :escalated "Supervisor intervention requested"
 :resolved "Conflict resolved, lock granted or alternative found"
 :failed "Conflict resolution failed, requires manual intervention"}}
```

#### Escalation Thread Creation
```clojure
(defn handle-file-conflict! [conflict-info]
  (let [conflict-thread (LockService/open-conflict-thread!
                          (:conflict/path conflict-info)
                          [(:conflict/current-owner conflict-info)
                           (:conflict/requesting-owner conflict-info)])]
    ;; Notify both agents of conflict thread
    (notify-agents! (:conflict/current-owner conflict-info)
                   (:conflict/requesting-owner conflict-info)
                   conflict-thread)
    ;; Start negotiation timeout
    (schedule-negotiation-timeout! conflict-thread)))

;; Conflict thread message structure
{:thread/id "thread-789"
 :thread/type :file-lock-conflict
 :thread/participants ["agent-456" "agent-123"]
 :thread/resource {:path "/data/results.csv" :type :file-lock}
 :thread/timeout-ms 60000
 :thread/state :negotiating
 :thread/messages [...]}
```

#### Negotiation Messages
```clojure
;; Agent proposing compromise
{:message/from "agent-123"
 :message/type :compromise-proposal
 :message/content {:proposal "I can write to a temporary file and merge later"
                   :estimated-time-ms 5000
                   :requires ["read-access" "temp-file-space"]}}

;; Agent accepting or rejecting
{:message/from "agent-456"
 :message/type :proposal-response
 :message/content {:response :accept ; or :reject, :counter-proposal
                   :reason "This works for my workflow"
                   :new-proposal nil}}
```

#### Supervisor Escalation
```clojure
;; When negotiation fails or timeout
(defn escalate-conflict-to-supervisor! [conflict-thread]
  (let [escalation-event {:type :supervisor/conflict-escalation
                          :from "file-lock-service"
                          :conflict-thread conflict-thread
                          :recommended-action [:arbitrate :force-release :reallocate-task]
                          :context {:participants (:thread/participants conflict-thread)
                                    :resource (:thread/resource conflict-thread)
                                    :negotiation-history (:thread/messages conflict-thread)}}]
    (EventBus/publish! escalation-event)))

;; Supervisor arbitration options
{:supervisor/actions
 {:arbitrate "Supervisor reviews conflict and makes binding decision"
 :force-release "Force release current lock (emergency only)"
 :reallocate-task "Reassign one agent's task to alternative resource"
 :time-share "Schedule time-shared access between agents"}}
```

#### Automatic Resolution Patterns
```clojure
;; Read-write conflicts can often be auto-resolved
{:resolution/patterns
 {:read-write {:solution "Allow concurrent reads, queue write"
               :when [(= current-mode :read) (= requesting-mode :write)]
               :action [:queue-requesting :notify-on-read-complete]}
 :write-write {:solution "Negotiate order or use merge strategy"
               :when [(= current-mode :write) (= requesting-mode :write)]
               :action [:create-conflict-thread :escalate-on-timeout]}
 :read-read {:solution "Allow both concurrent access"
             :when [(= current-mode :read) (= requesting-mode :read)]
             :action [:grant-immediate]}}}
```

## 6. Configuration Management

### Purpose
Centralized configuration system with environment variable support, default values, and runtime override capabilities.

### Requirements
- **Environment integration**: Support for .env files and system properties
- **Type safety**: Configuration validation with helpful error messages
- **Runtime updates**: Ability to modify configuration without restart
- **Namespacing**: Hierarchical configuration with dot-notation access
- **Secrets handling**: Secure management of sensitive configuration

### Configuration Structure
```clj
;; Configuration hierarchy
{:ollama/default-host "http://localhost:11434"
 :ollama/default-timeout-ms 300000
 :tools/validation-enabled true
 :events/log-path "logs/events.jsonl"
 :locks/default-ttl-ms 60000
 :agents/max-concurrent 10
 :benchmarks/default-steps 4}
```

## Implementation Notes

### Error Handling Strategy
- **Graceful degradation**: Components should operate in degraded mode when dependencies fail
- **Context preservation**: All errors include relevant state and context
- **Recovery mechanisms**: Automatic retry with exponential backoff where appropriate
- **User-friendly errors**: Clear error messages with actionable suggestions

### Performance Considerations
- **Lazy initialization**: Components initialize on first use
- **Resource pooling**: Reuse HTTP clients and connections where possible
- **Async by default**: All I/O operations should be non-blocking
- **Memory efficiency**: Avoid unnecessary object creation in hot paths

### Security Considerations
- **Input validation**: All external inputs validated before processing
- **Path traversal prevention**: File operations restricted to allowed directories
- **Resource limits**: Configurable limits on tool calls, file handles, etc.
- **Audit logging**: Security-relevant events logged with timestamps

## Testing Strategy

### Unit Testing
- Interface compliance testing for all protocols
- Error condition simulation and validation
- Mock implementations for external dependencies
- Property-based testing for configuration variations

### Integration Testing
- End-to-end workflow testing with real Ollama instances
- Concurrent operation testing with multiple agents/benchmarks
- Resource contention scenarios (file locks, tool conflicts)
- Error recovery and resilience testing

### Validation Testing
- Schema validation correctness with comprehensive test cases
- Tool registration and lookup edge cases
- Message routing and delivery guarantees
- Lock service correctness under various failure modes

## Migration and Compatibility

### Version Compatibility
- **Semantic versioning**: Use SemVer for all public interfaces
- **Backward compatibility**: Maintain compatibility for at least one minor version
- **Migration path**: Clear upgrade procedures with data migration support
- **Deprecation policy**: Gradual deprecation with advance notice

### Extensibility Points
- **Plugin architecture**: Support for custom tool providers
- **Custom event types**: Allow registration of domain-specific events
- **Alternative lock providers**: Support for distributed lock services
- **Custom benchmarks**: Framework for user-defined benchmark types

## 10. Integration Testing

### Purpose
Ensure all framework components work together correctly through end-to-end workflows, cross-system communication, and realistic usage scenarios.

### Requirements
- **Component integration**: All core components integrate seamlessly
- **Cross-system workflows**: Tools, agents, and benchmarks work together
- **Communication protocols**: Message routing between all systems
- **Resource sharing**: Proper resource allocation across components
- **Error propagation**: Failures propagate and are handled correctly
- **Performance under load**: Systems scale correctly with multiple components

### Integration Test Categories

#### 1. Core Framework Integration
```clj
;; Core component integration tests
- Event system integration with all producers
- Message bus routing to all registered handlers
- Lock service integration with agent framework
- Configuration management across all components
- Validation integration with tools and agents
- Resource management across framework
```

#### 2. Tools Integration
```clj
;; Tool system integration tests
- Tool registration and discovery
- Tool pack loading and execution
- Tool validation integration with agents
- Schema generation for Ollama integration
- Tool execution with agent coordination
- Error handling and propagation through framework
```

#### 3. Agent Framework Integration
```clj
;; Agent framework integration tests
- Agent registration with core framework
- Supervisor tree with tool access
- Agent lifecycle with resource management
- Communication via message bus
- Task delegation and tool calling
- Conflict resolution with lock service
- State management with event logging
```

#### 4. Benchmark Integration
```clj
;; Benchmark framework integration tests
- Benchmark runner with tool packs
- Agent spawning for benchmark tasks
- Result collection from tool calls
- Event logging for benchmark execution
- Report generation from benchmark data
- Real-time monitoring and streaming
```

### Integration Test Scenarios

#### 1. End-to-End Workflows
```clj
;; Complete workflow tests
{:test/name "tool-calling-workflow"
 :description "Complete tool selection and execution workflow"
 :steps [:register-tools :spawn-agent :call-tool :validate-result :cleanup]}

{:test/name "agent-coordination-workflow"
 :description "Multiple agents coordinating through supervisor"
 :steps [:spawn-supervisor :register-children :distribute-tasks :aggregate-results :shutdown]}

{:test/name "benchmark-execution-workflow"
 :description "Full benchmark run from start to report"
 :steps [:load-tool-pack :create-suite :execute-tests :generate-reports :cleanup]}
```

#### 2. Cross-System Communication
```clj
;; Communication protocol integration tests
{:test/name "message-bus-routing"
 :description "Message routing to correct handlers"
 :steps [:register-handlers :publish-events :verify-routing :cleanup]}

{:test/name "agent-to-agent-communication"
 :description "Direct agent communication via parent relay"
 :steps [:spawn-agents :send-messages :verify-delivery :cleanup]}

{:test/name "system-to-agent-communication"
 :description "System notifications to agents"
 :steps [:configure-notifications :trigger-events :verify-receipt :cleanup]}
```

#### 3. Resource Management Integration
```clj
;; Resource management integration tests
{:test/name "lock-service-integration"
 :description "Lock acquisition and release with agents"
 :steps [:agent-registers-lock :agent-acquires-lock :agent-releases-lock :verify-availability :timeout-recovery]}

{:test/name "tool-execution-resources"
 :description "Tool execution with proper resource allocation"
 :steps [:tool-registers-resources :tool-requests-resources :tool-releases-resources :monitor-usage :cleanup]}
```

#### 4. Error Handling Integration
```clj
;; Error handling across systems
{:test/name "tool-validation-errors"
 :description "Tool validation errors propagate correctly"
 :steps [:trigger-validation-error :verify-error-logging :agent-receives-error :cleanup]}

{:test/name "agent-lifecycle-errors"
 :description "Agent lifecycle errors handled correctly"
 :steps [:trigger-agent-error :verify-error-propagation :supervisor-receives-error :attempt-recovery :cleanup]}

{:test/name "system-error-scenarios"
 :description "System-level error handling and recovery"
 :steps [:trigger-system-error :verify-emergency-response :attempt-automated-recovery :manual-intervention :cleanup]}
```

### Integration Test Requirements

#### Test Environment Setup
```clj
;; Integration test configuration
{:test/enable-component-integration true
 :test/enable-cross-system-communication true
 :test/enable-resource-sharing true
 :test/enable-error-propagation true
 :test/timeout-multiplier 2.0
 :test/cleanup-after-test true}
```

#### Test Data Validation
```clj
;; Integration data validation
- Event log consistency across systems
- State synchronization between components
- Result aggregation accuracy
- Resource allocation tracking correctness
- Message ordering and delivery guarantees
```

### Performance Requirements

#### Integration Performance Tests
```clj
;; Performance benchmarks
- 100+ concurrent tool registrations and calls
- 50+ concurrent agent operations
- 1000+ messages/second through bus
- Memory usage < 2GB with all components active
- Component startup time < 5 seconds each
- End-to-end workflow completion < 30 seconds
```

### Test Reporting

#### Integration Test Results
```clj
;; Test result format and content
- Component integration success/failure matrix
- Communication protocol compliance reports
- Resource utilization across integration tests
- Error propagation and recovery statistics
- Performance metrics and bottleneck identification
- Security and isolation validation results
```

### Continuous Integration

#### CI/CD Integration
- **Automated integration tests**: Run on every pull request
- **Cross-platform testing**: Test on Linux, macOS, Windows
- **Performance regression tests**: Run nightly and trend
- **Integration smoke tests**: Run on every deployment
- **Documentation validation**: All integration scenarios documented

#### Monitoring and Alerting
- **Integration health checks**: Monitor component interactions
- **Performance alerts**: Alert on degradation thresholds
- **Error rate monitoring**: Track integration failures
- **Resource exhaustion alerts**: Warn on limits approached
- **Automated recovery**: Self-healing for common failures
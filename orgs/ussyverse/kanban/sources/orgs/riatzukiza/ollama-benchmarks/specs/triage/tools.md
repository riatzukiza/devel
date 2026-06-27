# Tool System Specification

**Status**: DRAFT  
**Version**: 0.1.0  
**Last Updated**: 2026-01-25  
**Dependencies**: core.md (Core Framework)

## Overview

This specification defines the tool system including tool registration, validation, schema generation, execution, and integration with the agent framework.

## 1. Tool Definition and Registration

### Purpose
Dynamic tool registration system with OpenAI-compatible schema generation, comprehensive validation, and runtime execution capabilities.

### Requirements
- **Dynamic registration**: Tools can be registered at runtime with unique names
- **Type safety**: Strong parameter and return type validation
- **Schema generation**: Automatic OpenAI-compatible JSON schema generation
- **Documentation**: Rich tool metadata including descriptions and usage examples
- **Versioning**: Tool versioning with backward compatibility

### Tool Definition Structure
```clj
;; Tool registry interface
(defprotocol ToolRegistry
  (register-tool! [tool] "Register tool by unique name")
  (tools [] "Return all registered tools")
  (tool-by-name [name] "Lookup tool by name")
  (clear-tools! [] "Clear all tools")
  (tools-by-tag [tag] "Find tools by capability tag"))

;; Tool definition schema
{:tool/name "unique-tool-identifier"
 :tool/description "Human-readable description"
 :tool/version "semantic-version"
 :tool/domain :math|:search|:io|:general|:custom
 :tool/tags #{:math :arithmetic :search :io :text-generation}
 :tool/parameters {...}
 :tool/capabilities #{:deterministic :side-effect-free :idempotent}
 :tool/metadata {...}}
```

## 2. Parameter System and Validation

### Purpose
Type-safe parameter handling with automatic conversion between Clojure data types and JSON, comprehensive validation, and rich error reporting.

### Requirements
- **Type system**: Rich type system with primitive and complex types
- **Validation**: clojure.spec.alpha-based validation with custom predicates
- **Coercion**: Automatic conversion between string, map, and structured types
- **Default values**: Sensible defaults for optional parameters
- **Validation chains**: Multi-step validation for complex constraints

### Parameter Types
```clj
;; Supported parameter types
:int        "32-bit integer"
:float      "64-bit floating point"
:string     "UTF-8 string"
:boolean    "true/false"
:keyword    "Clojure keyword"
:enum       "Fixed set of allowed values"
:array      "Ordered collection"
:object     "Key-value map"
:timestamp  "Unix timestamp"
:uuid       "Universally unique identifier"
:file-path  "Validated file system path"
:url        "Validated URL"
:email      "Validated email address"
```

### Validation Rules
```clj
;; Validation examples
(s/def ::email
  (s/and string? #(re-find #".+@.+\..+" %)))

(s/def ::positive-int
  (s/and int? #(pos? %)))

(s/def ::file-path
  (s/and string? #(re-find #"^[a-zA-Z0-9_\-/.]+$" %)))

;; Correct coordinate validation for lat/lon tuples
(s/def ::lat (s/and number? #(<= -90 % 90)))
(s/def ::lon (s/and number? #(<= -180 % 180)))
(s/def ::coordinate (s/tuple ::lat ::lon))
```

## 3. Schema Generation

### Purpose
Automatically generate OpenAI-compatible JSON schemas from tool parameter definitions with proper type mapping and rich documentation.

### Requirements
- **OpenAI compatibility**: Generated schemas must work with OpenAI tool calling format
- **Type mapping**: Automatic conversion from Clojure types to JSON schema types
- **Documentation**: Rich descriptions and examples in generated schemas
- **Validation**: Schema validation ensures proper structure
- **Extensibility**: Support for custom schema annotations and extensions

### Schema Mapping Rules
```clj
;; Clojure to JSON type mapping
:int        -> "integer"
:float      -> "number"
:string     -> "string"
:boolean    -> "boolean"
:keyword    -> "string"
:vector     -> "array"
:map        -> "object"
:set        -> "array" (of unique values)
:any        -> "string" (for flexible input)
```

### Generated Schema Example
```json
{
  "type": "function",
  "function": {
    "name": "calculate_age",
    "description": "Calculate age from birth year",
    "parameters": {
      "type": "object",
      "properties": {
        "birth_year": {
          "type": "integer",
          "description": "Birth year (4 digits)"
        },
        "current_year": {
          "type": "integer", 
          "description": "Current year (4 digits)"
        }
      },
      "required": ["birth_year", "current_year"]
    }
  }
}
```

## 4. Tool Execution Engine

### Purpose
Safe and efficient tool execution with proper error handling, resource management, and integration with the agent framework.

### Requirements
- **Safety**: Input validation and sandboxed execution where possible
- **Error handling**: Comprehensive error catching with structured error reporting
- **Resource management**: CPU, memory, and I/O resource tracking
- **Timeouts**: Per-tool and global execution timeouts
- **Logging**: Detailed execution logs for debugging and auditing

### Execution Interface
```clj
;; Tool execution interface
(defprotocol ToolExecutor
  (execute-tool! [{:keys [tool-name arguments context timeout-ms]}]
    "Execute tool with given arguments")
  (execute-tool-with-context! [{:keys [tool-name arguments agent-context timeout-ms]}]
    "Execute tool within agent conversation context")
  (cancel-execution! [execution-id] "Cancel running tool execution")
  (get-execution-status [execution-id] "Get current execution status")
  (list-active-executions [] "Get all active tool executions"))
```

### Execution Context
```clj
;; Execution context structure
{:execution/id "unique-execution-identifier"
 :agent/id "agent-identifier"
 :conversation/id "conversation-thread-identifier"
 :tool/name "tool-being-executed"
 :arguments {...}
 :start-time unix-ms
 :timeout-ms 30000
 :resource/usage {:cpu-percent :memory-bytes :file-handles}
 :execution/status :running|:completed|:failed|:cancelled
 :result {...}
 :error {...}}
```

## 5. Tool Categories and Capabilities

### Purpose
Organize tools by capability and domain for intelligent selection, delegation, and access control.

### Tool Categories
- **Math**: Arithmetic operations, calculations, statistical functions
- **Search**: Web search, database queries, information retrieval
- **Text Processing**: Text analysis, generation, manipulation
- **File Operations**: File reading, writing, directory operations
- **Communication**: Email, messaging, notifications
- **System**: System information, process management
- **Custom**: Domain-specific or user-defined categories

### Capability System
```clj
;; Tool capability definitions
:deterministic     "Tool produces same output for same input"
:idempotent       "Tool can be called multiple times safely"
:side-effect-free  "Tool doesn't modify external state"
:stateful          "Tool maintains internal state across calls"
:expensive         "Tool requires significant resources"
:external-api      "Tool calls external services"
:multi-modal       "Tool handles multiple data types"
```

### Tool Metadata
```clj
;; Rich tool metadata
{:tool/category "math|search|text-processing"
 :tool/complexity :low|:medium|:high
 :tool/cost-per-call {:tokens :cpu-time :money}
 :tool/reliability 0.0-1.0
 :tool/performance {:avg-latency-ms :throughput-per-second}
 :tool/security {:requires-auth :accesses-files :external-network}
 :tool/compliance [:gdpr :ccpa :sox]}
```

## 6. Integration with Agent Framework

### Purpose
Seamless integration between tools and agents for coordinated problem solving and resource management.

### Requirements
- **Agent tool access**: Agents can be assigned specific tool sets based on capabilities
- **Tool delegation**: Agents can delegate tasks to other agents with appropriate tools
- **Resource sharing**: Tools can access agent resources under controlled conditions
- **Context passing**: Execution context passed between agents and tools
- **Security**: Tool access controlled by agent permissions and capabilities

### Integration Patterns
```clj
;; Agent-tool integration
{:agent/id "agent-1"
 :agent/tools [:math-calculator :web-search :file-reader]
 :agent/permissions #{:execute-tools :delegate-tasks :access-files}
 :tool-assignments {:math-calculator "agent-1" :web-search "agent-2"}
 :delegation-rules {:can-delegate-to [:agent-2] :cannot-delegate-to [:agent-3]}})

;; Tool execution in agent context
{:execution/id "exec-123"
 :agent/id "agent-1"
 :conversation/id "conv-456"
 :tool/name "math-calculator"
 :arguments {:a 10 :b 20}
 :agent/context {:current-task "solve-equation" :available-tools [:math-calculator :web-search]}
 :execution/timeout-ms 60000}
 :result {:value 200 :confidence 1.0}
```

## 7. Security and Access Control

### Purpose
Comprehensive security model for tool access, execution, and resource protection with audit logging.

### Requirements
- **Authentication**: Tool access requires proper agent authentication
- **Authorization**: Role-based access control to tools and capabilities
- **Input validation**: All tool inputs validated against schemas and security rules
- **Sandboxing**: Tool execution in controlled environments where possible
- **Audit logging**: All tool accesses and executions logged for compliance
- **Resource limits**: Configurable limits on tool usage and resource consumption

### Security Model
```clj
;; Security contexts
{:security/context "benchmark" :production "development"}
 :agent/roles #{:admin :user :tool-executor :delegate}
 :tool/access-levels #{:read-only :execute :admin :delegated}
 :resource/sensitivity {:public :internal :confidential :secret}

;; Access control rules
{:rule/name "tool-access-by-role"
 :condition {:agent/role :admin}
 :allow #{:all-tools}
 :deny #{}}}

{:rule/name "file-access-by-tool"
 :condition {:tool/category :file-operations}
 :allow #{"/tmp/agent-work" :/var/data"}
 :deny #{"/etc/system" "/etc/passwd"}}
```

## 8. Performance and Monitoring

### Purpose
Comprehensive performance monitoring and optimization for the tool system with metrics collection and analysis capabilities.

### Requirements
- **Metrics collection**: Execution time, success rates, resource usage
- **Performance profiling**: Tool-specific performance analysis and optimization
- **Health monitoring**: Tool availability and response time monitoring
- **Load management**: Request queuing and rate limiting
- **Benchmarks**: Standardized tool performance benchmarks

### Performance Metrics
```clj
;; Tool performance metrics
{:tool/name "database-query"
 :execution/times [p50 p90 p95 p99]
 :success-rate 0.95
 :error-rate 0.05
 :average-latency-ms 250
 :throughput-per-second 40
 :resource/usage {:avg-cpu-percent 15 :peak-memory-mb 256}
 :cost-per-call {:tokens 50 :money 0.001}
 :error-types {:timeout 0.03 :validation-failed 0.01 :execution-error 0.01}}
```

## 8. Tool Pack Contract

### Purpose
Define how tool packs (namespaces containing both tool definitions and implementations) are loaded and managed, enabling the same tools to be used in both production agents and benchmarks.

### Tool Pack Requirements
A tool pack namespace must:
- **Declare tools** with metadata, schemas, and validation specifications
- **Provide implementations** as callable functions
- **Register tools** automatically when the namespace is loaded
- **Support dual modes**: production agent mode and benchmark mode

### Tool Pack Structure
```clj
;; Example tool pack namespace
(ns my-org.tools.customer-data
  (:require [ollama.dsl :refer [def-tool]]))

(def-tool load-customer-data
  {:description "Load and validate customer data"
   :domain :customer-data
   :tags #{:data-loading :validation}
   :parameters {:file-path {:type :string :required true}
               :validate? {:type :boolean :default false}}}
  (fn [{:keys [file-path validate?]}]
    (let [data (load-file file-path)]
      (if validate?
        (validate-customer-data data)
        data))))

(def-tool process-customer-insights
  {:description "Generate insights from customer data"
   :domain :customer-data
   :tags #{:data-processing :analytics}
   :parameters {:data {:type :object :required true}
               :insight-type {:type :string :required true}}}
  (fn [{:keys [data insight-type]}]
    (generate-insights data insight-type)))
```

### Loading Modes

#### Production Mode
```clj
;; Standard tool loading for production agents
(require '[my-org.tools.customer-data :as tools])
;; Tools automatically registered in ToolRegistry
;; Implementations available for direct execution
```

#### Benchmark Mode
```clj
;; Enhanced loading for benchmark environments
(ToolRegistry/load-benchmark-pack! 'my-org.tools.customer-data
  {:decoy-generation true
   :strict-validation true
   :sandbox {:enabled true :timeout-ms 5000}
   :metrics-collection true})
```

### Integration Points
- **ToolRegistry**: Automatic registration on pack load
- **ValidationEngine**: Schema validation and coercion
- **ExecutionEngine**: Sandbox and monitoring in benchmark mode
- **EventSystem**: Tool lifecycle events and metrics

## 9. Testing and Validation

### Purpose
Comprehensive testing framework for tool registration, validation, execution, and integration.

### Requirements
- **Unit tests**: Test all tool components in isolation
- **Integration tests**: Test tool-agent integration workflows
- **Validation tests**: Test parameter validation and schema compliance
- **Performance tests**: Load testing and stress testing
- **Security tests**: Test access control and input validation

### Test Categories
- **Functionality tests**: Correct tool behavior and output
- **Error handling tests**: Appropriate error responses and recovery
- **Performance tests**: Scalability and resource usage
- **Security tests**: Authentication, authorization, and input validation
- **Compliance tests**: Schema compliance and protocol adherence
# DSL Authoring Layer

**Version**: 1.0.0  
**Dependencies**: core.md, tools.md, agents.md

## Overview

The DSL Authoring Layer provides macro-based syntax for defining tools and agents that feels natural to Clojure developers while generating the required data structures and registrations. All macros expand to protocol-implementing data structures and automatically register with appropriate registries.

## Core Macros

### def-tool Macro

Defines a tool with OpenAI Agent SDK-like syntax while generating Clojure tool maps.

```clojure
(def-tool name
  "Docstring describing tool purpose"
  [{:keys [param1 param2] :as args}]
  (implementation-body)
  {:ollama/function {:description "Tool description for Ollama"
                     :name "function-name"}
   :schema {:param1 {:type "string" :description "Parameter 1 description"}
            :param2 {:type "integer" :description "Parameter 2 description"}}
   :metadata {:tags #{:data-processing :validation}
             :domain :customer-data
             :examples [{:param1 "example" :param2 42}]
             :decoy-profile {:type :exact-match :confidence 0.9}
             :permission-scope #{:read-files :write-files}})
```

#### Expansion Contract

The macro expands to:

```clojure
(def ^:tool name
  (let [tool-map {:tool/id (generate-id "name")
                  :tool/name "name"
                  :tool/description "Tool description for Ollama"
                  :tool/implementation (fn [args] 
                                        (let [{:keys [param1 param2]} args]
                                          (implementation-body)))
                  :tool/schema {:param1 {:type "string" :description "Parameter 1 description"}
                               :param2 {:type "integer" :description "Parameter 2 description"}}
                  :tool/metadata {:tags #{:data-processing :validation}
                                 :domain :customer-data
                                 :examples [{:param1 "example" :param2 42}]
                                 :decoy-profile {:type :exact-match :confidence 0.9}
                                 :permission-scope #{:read-files :write-files}}}]
    (ToolRegistry/register! tool-map)
    tool-map))
```

#### Required Metadata Fields

- `:tags` - Set of keywords for categorization
- `:domain` - Keyword indicating tool domain (e.g., `:customer-data`, `:system-ops`)
- `:permission-scope` - Set of required permissions
- Optional: `:examples`, `:decoy-profile`, `:timeout-ms`

### def-agent Macro

Defines an agent with supervisor/agent hierarchy support.

```clojure
(def-agent name
  "Docstring describing agent purpose"
  {:model "gpt-4"
   :capabilities #{:task-execution :tool-usage :communication}
   :permissions #{:read-files :write-files :execute-tools}
   :max-concurrent-tasks 5
   :default-tools [:file-reader :data-processor]
   :budget {:max-tokens 10000 :max-cpu-percent 80}
   :parent-coordination-enabled true
   :auto-escalation true
   :system-prompt "You are a helpful assistant specialized in..."}
  {:supervisor/max-children 10
   :supervisor/heartbeat-interval-ms 30000
   :supervisor/task-timeout-ms 300000})
```

#### Expansion Contract

The macro expands to:

```clojure
(def ^:agent name
  (let [agent-config {:agent/id (generate-id "name")
                      :agent/name "name"
                      :agent/description "Agent description"
                      :agent/model "gpt-4"
                      :agent/capabilities #{:task-execution :tool-usage :communication}
                      :agent/permissions #{:read-files :write-files :execute-tools}
                      :agent/configuration
                       {:system-prompt "You are a helpful assistant specialized in..."
                        :max-concurrent-tasks 5
                        :default-tools [:file-reader :data-processor]
                        :budget {:max-tokens 10000 :max-cpu-percent 80}
                        :parent-coordination-enabled true
                        :auto-escalation true}
                      :supervisor/configuration
                       {:supervisor/max-children 10
                        :supervisor/heartbeat-interval-ms 30000
                        :supervisor/task-timeout-ms 300000}}]
    (AgentRegistry/register! agent-config)
    agent-config))
```

## Tool Pack Contract

A **Tool Pack** is a single namespace that contains both tool definitions and implementations, loadable in two modes.

### Tool Pack Structure

```clojure
(ns my-org.tools.customer-data
  (:require [ollama.dsl :refer [def-tool]]
            [ollama.core :refer [with-lock]]))

(def-tool load-customer-data
  "Loads customer data from file with validation"
  [{:keys [file-path validate?]}]
  (let [data (with-lock :read file-path
                (slurp file-path))]
    (if validate?
      (validate-customer-data data)
      data))
  {:ollama/function {:description "Load and validate customer data"
                     :name "load_customer_data"}
   :schema {:file-path {:type "string" :description "Path to customer data file"}
            :validate? {:type "boolean" :description "Whether to validate data"}}
   :metadata {:tags #{:data-loading :validation}
             :domain :customer-data
             :permission-scope #{:read-files}}})

(def-tool process-customer-insights
  "Generates insights from customer data"
  [{:keys [data insight-type]}]
  (generate-insights data insight-type)
  {:ollama/function {:description "Generate insights from customer data"
                     :name "process_customer_insights"}
   :schema {:data {:type "object" :description "Customer data object"}
            :insight-type {:type "string" :description "Type of insights to generate"}}
   :metadata {:tags #{:data-processing :analytics}
             :domain :customer-data
             :permission-scope #{:data-processing}}})
```

### Loading Modes

#### Production Mode
```clojure
(require '[my-org.tools.customer-data :as tools])
;; Tools available with normal implementations
;; Automatic registration with ToolRegistry
```

#### Benchmark Mode
```clojure
(require '[my-org.tools.customer-data :as tools])
(ToolRegistry/load-benchmark-pack! 'my-org.tools.customer-data
  {:decoy-generation true
   :strict-validation true
   :sandbox {:enabled true :timeout-ms 5000}})
```

## Shared Options

Both `def-tool` and `def-agent` support common options:

### Tags
Standardized tag keywords:
- Domain tags: `:customer-data`, `:system-ops`, `:analytics`, `:validation`
- Function tags: `:data-loading`, `:data-processing`, `:file-ops`, `:network-ops`
- Security tags: `:sensitive`, `:public`, `:internal`

### Permission Scopes
- `:read-files` - Read file system access
- `:write-files` - Write file system access  
- `:execute-tools` - Use other tools
- `:network-access` - External network calls
- `:system-ops` - System-level operations

### Tool-Specific Options

#### Decoy Profiles
```clojure
:decoy-profile {:type :exact-match     ; Exact parameter matching
                :type :semantic-match  ; Semantic similarity
                :type :hybrid          ; Both exact and semantic
                :confidence 0.8        ; Minimum confidence threshold
                :generation-count 5}   ; Number of decoys to generate
```

#### Argument Specifications
```clojure
:arg-spec {:param1 {:spec string?        ; clojure.spec.alpha spec
                    :coercion str        ; Coercion function
                    :default "default"}  ; Default value
           :param2 {:spec pos-int?
                    :coercion int
                    :required true}}
```

### Agent-Specific Options

#### Budget Management
```clojure
:budget {:max-tokens 10000        ; Token limit per task
         :max-cpu-percent 80      ; CPU usage limit
         :max-memory-mb 512       ; Memory limit
         :time-limit-ms 300000}   ; Time limit per task
```

#### Escalation Policy
```clojure
:escalation-policy {:threshold 3           ; Failure count threshold
                    :auto-escalate true    ; Auto-escalate on threshold
                    :escalation-to [:supervisor :human]}
```

## Compilation Pipeline

1. **Macro Expansion** - DSL expands to data structures
2. **Registration** - Automatic registration with appropriate registry
3. **Validation** - Schema and metadata validation
4. **Metadata Attachment** - clj-kondo metadata for IDE support

## Error Handling

### Compilation Errors
- Invalid schema definitions throw `ToolCompilationError`
- Missing required metadata throws `MetadataError`
- Invalid permission scopes throw `PermissionError`

### Runtime Errors
- Tool execution errors wrapped in `ToolExecutionError`
- Agent configuration errors wrapped in `AgentConfigurationError`

## Version Compatibility

- **Clojure**: 1.11+
- **clj-kondo**: 2023.10+ (for macro analysis)
- **clojure.spec.alpha**: 0.3.0+ (for validation)
# clj-kondo Support

**Version**: 1.0.0  
**Dependencies**: dsl.md, core.md

## Overview

clj-kondo support provides IDE-level analysis and autocompletion for the DSL macros through custom hooks that understand the macro expansion behavior and provide accurate symbol information.

## Hook Architecture

### Hook Location Structure
```
.clj-kondo/
├── config.edn                           ; Main clj-kondo configuration
└── hooks/
    └── clj_kondo/
        └── hooks/
            └── promethean/
                ├── ollama/
                │   ├── tools.clj         ; def-tool macro hook
                │   └── agents.clj        ; def-agent macro hook
                └── benchmark/
                    └── dsl.clj           ; Benchmark DSL hooks
```

### Base Configuration (.clj-kondo/config.edn)
```clojure
{:hooks {:analyze-call {promethean.ollama.dsl/def-tool hooks/promethean/ollama/tools/def-tool
                        promethean.ollama.dsl/def-agent hooks/promethean/ollama/agents/def-agent
                        promethean.benchmark.dsl/def-suite hooks/promethean/benchmark/dsl/def-suite}}
 :lint-as {promethean.ollama.dsl/def-tool clojure.core/def
           promethean.ollama.dsl/def-agent clojure.core/def}
 :config-paths ["hooks"]}
```

## Tool Macro Hook

### def-tool Hook Implementation
```clojure
(ns clj-kondo.hooks.promethean.ollama.tools)

(defn def-tool [{:keys [node]}]
  (let [[_name docstring args & body] (:children node)
        tool-name (some-> node :children first :val)
        meta-node (when (and (sequential? body)
                             (= 'clojure.core/map (some-> body last :children first :val)))
                    (-> body last :children second))
        
        ;; Extract tool implementation function name
        impl-fn (gensym (str tool-name "-impl"))
        
        ;; Create var for tool registration
        tool-var {:node (assoc node
                              :val tool-name
                              :meta {:no-doc true
                                     :tool true})}
        
        ;; Create implementation function
        impl-fn-var {:node {:node-type :token
                           :val impl-fn
                           :raw (str impl-fn)
                           :meta {:no-doc true
                                  :tool-implementation true}}}]
    
    {:findings []
     :defs [tool-var impl-fn-var]
     :lint-as 'clojure.core/def}))
```

### Tool Registry Analysis
```clojure
(defn analyze-tool-registration [{:keys [node]}]
  (let [[_tool-name & options] (:children node)
        tool-id (some-> options first :children second :val)
        tool-meta (extract-tool-meta options)]
    
    {:findings (when-not (:description tool-meta)
                 [{:level :warning
                   :message "Tool should include :description in metadata"
                   :filename (:filename node)
                   :row (:row node)
                   :col (:col node)}])
     :defs []
     :vars [{:name tool-id
             :meta tool-meta
             :tool true}]}))
```

## Agent Macro Hook

### def-agent Hook Implementation
```clojure
(ns clj-kondo.hooks.promethean.ollama.agents)

(defn def-agent [{:keys [node]}]
  (let [[_name docstring config & body] (:children node)
        agent-name (some-> node :children first :val)
        
        ;; Extract agent configuration
        config-map (when (map? config)
                      (parse-config-map config))
        
        ;; Create agent var with metadata
        agent-var {:node (assoc node
                               :val agent-name
                               :meta {:no-doc true
                                      :agent true
                                      :agent-config config-map})}]
    
    {:findings []
     :defs [agent-var]
     :lint-as 'clojure.core/def}))

(defn parse-config-map [config-node]
  (let [pairs (partition 2 (rest (:children config-node)))]
    (into {}
          (map (fn [[k v]]
                 [(keyword (-> k :children first :val))
                  (parse-value v)])
               pairs))))

(defn parse-value [value-node]
  (case (:node-type value-node)
    :token (:val value-node)
    :vector (mapv parse-value (:children value-node))
    :map (parse-map-node value-node)
    :quote (-> value-node :children first :val)
    nil))
```

### Agent Validation Rules
```clojure
(defn validate-agent-config [{:keys [node]}]
  (let [config-map (extract-agent-config node)
        required-keys #{:model :capabilities :permissions}
        missing-keys (remove config-map required-keys)]
    
    {:findings (for [key missing-keys]
                 {:level :error
                  :message (str "Missing required agent configuration key: " key)
                  :filename (:filename node)
                  :row (:row node)
                  :col (:col node)})
     :defs []
     :vars []}))
```

## Benchmark DSL Hooks

### def-suite Hook
```clojure
(ns clj-kondo.hooks.promethean.benchmark.dsl)

(defn def-suite [{:keys [node]}]
  (let [[_name config & tests] (:children node)
        suite-name (some-> node :children first :val)
        
        ;; Create suite var
        suite-var {:node (assoc node
                               :val suite-name
                               :meta {:no-doc true
                                      :benchmark-suite true
                                      :suite-config (parse-suite-config config)})}
        
        ;; Process individual tests
        test-vars (mapcat extract-test-var tests)]
    
    {:findings []
     :defs (cons suite-var test-vars)
     :lint-as 'clojure.core/def}))

(defn extract-test-var [test-node]
  (let [[test-type test-name & test-config] (:children test-node)
        test-id (keyword (-> test-name :val))
        var-name (gensym (str "test-" test-id "-"))]
    [{:node {:node-type :token
             :val var-name
             :meta {:test true
                    :test-type test-type
                    :test-id test-id
                    :test-config (parse-test-config test-config)}}]))
```

## Symbol Introspection

### Tool Symbol Information
```clojure
;; Tools appear as available symbols with completion:
;; 1. Tool name itself (the var created by def-tool)
;; 2. Tool implementation function (for direct calls)
;; 3. Tool metadata for documentation

{:tool/name "load-customer-data"
 :tool/implementation-fn "load-customer-data-impl"
 :tool/metadata {:description "Load and validate customer data"
                 :parameters {:file-path {:type "string" :required true}
                              :validate? {:type "boolean" :default false}}
                 :tags #{:data-loading :validation}
                 :domain :customer-data}}
```

### Agent Symbol Information
```clojure
;; Agents appear as available symbols with configuration:
{:agent/name "customer-service-agent"
 :agent/config {:model "gpt-4"
                :capabilities #{:task-execution :tool-usage}
                :permissions #{:read-files :write-files}}
 :agent/metadata {:description "Handles customer service requests"
                   :supervisor "support-coordinator"
                   :max-concurrent-tasks 3}}
```

## Completion Support

### Parameter Completion
```clojure
;; When typing tool calls, clj-kondo provides:
;; 1. Parameter name completion
;; 2. Type information
;; 3. Required/optional indicators
;; 4. Example values

(defn provide-parameter-completion [tool-name context]
  (let [tool (ToolRegistry/get-tool tool-name)
        params (:tool/schema tool)]
    {:completions (for [[param-name param-info] params]
                    {:label (name param-name)
                     :kind :property
                     :detail (:description param-info)
                     :documentation (:type param-info)
                     :insert-text (str ":" param-name " ")
                     :required (:required param-info true)})}))
```

### Macro Expansion Documentation
```clojure
;; clj-kondo shows expanded form documentation:
;; 
;; (def-tool my-tool "description" [args] body {:metadata ...})
;; 
;; Expands to:
;; - Tool map with generated ID
;; - Implementation function
;; - Registry registration
;; - Metadata attachment
```

## Linting Rules

### Tool Validation
```clojure
{:linters
 {:tool-missing-description {:level :warning}
  :tool-invalid-schema {:level :error}
  :tool-missing-implementation {:level :error}
  :agent-missing-required-config {:level :error}
  :agent-invalid-capabilities {:level :warning}}}
```

### Validation Implementations
```clojure
(defn tool-missing-description [{:keys [node]}]
  (let [metadata (extract-tool-metadata node)]
    (when-not (:description metadata)
      {:finding {:level :warning
                 :message "Tool should include description in metadata"
                 :filename (:filename node)
                 :row (:row node)
                 :col (:col node)}})))

(defn agent-invalid-capabilities [{:keys [node]}]
  (let [config (extract-agent-config node)
        capabilities (:capabilities config)
        valid-caps #{:task-execution :tool-usage :communication :learning}
        invalid-caps (remove valid-caps capabilities)]
    (when (seq invalid-caps)
      {:finding {:level :warning
                 :message (str "Invalid agent capabilities: " (string/join ", " invalid-caps))
                 :filename (:filename node)
                 :row (:row node)
                 :col (:col node)}})))
```

## IDE Integration Features

### Hover Information
```clojure
;; Hovering over tool name shows:
(defn get-hover-info [symbol]
  (cond
    (tool? symbol)
    {:contents (format-tool-docstring (get-tool symbol))
     :range symbol-range}
    
    (agent? symbol)
    {:contents (format-agent-docstring (get-agent symbol))
     :range symbol-range}
    
    :else nil))

(defn format-tool-docstring [tool]
  (str (:tool/description tool) "\n\n"
       "Parameters:\n" 
       (string/join "\n" 
                    (for [[param info] (:tool/schema tool)]
                      (format "  %s: %s %s"
                              (name param)
                              (:type info)
                              (if (:required info) "(required)" "(optional)"))))))
```

### Go-to-Definition
```clojure
;; Clicking on tool name goes to:
;; 1. def-tool macro call (primary)
;; 2. Implementation function (secondary)

(defn find-definition [symbol]
  (if-let [tool (tool? symbol)]
    [{:uri (:source-file tool)
      :range (:definition-range tool)}]
    ;; Fallback to normal clj-kondo definition finding
    nil))
```

### Code Actions
```clojure
;; Provide quick fixes for common issues:
;; 1. Add missing tool description
;; 2. Fix invalid agent capabilities
;; 3. Generate tool parameter template

(defn code-actions [position finding]
  (case (:message finding)
    "Tool should include description in metadata"
    [{:title "Add tool description"
      :kind :quickfix
      :edit {:range metadata-range
             :newText (str metadata "\n:description \"TODO: Add tool description\"")}}]
    
    "Invalid agent capabilities"
    [{:title "Fix agent capabilities"
      :kind :quickfix
      :edit {:range capabilities-range
             :newText (string/join " " (filter valid-capabilities current-caps))}}]
    
    nil))
```

## Testing Hooks

### Hook Test Suite
```clojure
(deftest test-def-tool-hook
  (let [code "(def-tool my-tool \"test\" [x] x {:description \"test tool\"})"
        analysis (analyze-code code)]
    (is (= 1 (count (:defs analysis))))
    (is (= 'my-tool (-> analysis :defs first :val)))
    (is (:tool (-> analysis :defs first :meta)))))

(deftest test-def-agent-hook
  (let [code "(def-agent my-agent {:model \"gpt-4\" :capabilities #{:task-execution}})"
        analysis (analyze-code code)]
    (is (= 1 (count (:defs analysis))))
    (is (= 'my-agent (-> analysis :defs first :val)))
    (is (:agent (-> analysis :defs first :meta)))))
```

## Performance Optimization

### Hook Caching
```clojure
;; Cache expensive analysis results
(def ^:private analysis-cache (atom {}))

(defn cached-analysis [code-hash analysis-fn]
  (or (get @analysis-cache code-hash)
      (let [result (analysis-fn)]
        (when (< (count @analysis-cache) 1000) ; Limit cache size
          (swap! analysis-cache assoc code-hash result))
        result)))
```

### Incremental Analysis
```clojure
;; Only reanalyze changed parts of files
(defn incremental-analysis [old-code new-code]
  (let [changes (diff-code old-code new-code)]
    (when (contains-tool-or-agent-macros? changes)
      (reanalyze-affected-regions changes))))
```

## Version Compatibility

### Hook Version Matrix
```clojure
{:clj-kondo/versions
 {"2023.10.0" {:hooks-version "1.0.0" :features [:basic-analysis :completion]}
 "2023.12.0" {:hooks-version "1.1.0" :features [:basic-analysis :completion :code-actions]}
 "2024.01.0" {:hooks-version "1.2.0" :features [:basic-analysis :completion :code-actions :incremental]}}}
```

## Troubleshooting

### Common Issues
```clojure
;; 1. Hooks not loading
;; - Check .clj-kondo/config.edn paths
;; - Verify hook namespace syntax

;; 2. No completion showing
;; - Ensure hooks compiled correctly
;; - Check clj-kondo version compatibility

;; 3. False positive linting
;; - Review validation rules in hooks
;; - Check macro expansion logic
```

### Debug Mode
```clojure
;; Enable debug output in hooks
(def debug-hooks? (atom false))

(defn debug-log [message & args]
  (when @debug-hooks?
    (println "[clj-kondo-hook]" (apply format message args))))
```
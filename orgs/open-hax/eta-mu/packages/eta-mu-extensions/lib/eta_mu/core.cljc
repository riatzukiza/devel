(ns eta-mu.core
  "Macros for the unified CLJS extension DSL.

  These macros capture extension specifications as data structures.
  The build system generates platform-specific init wrappers."
  (:require [clojure.string :as str]))

(defn- parse-kw-opts [forms]
  (loop [forms forms, opts {}]
    (if (and (seq forms) (keyword? (first forms)))
      (let [k (first forms)
            v (second forms)]
        (if v
          (recur (nnext forms) (assoc opts k v))
          [opts forms]))
      [opts forms])))

(defn- form-op [form]
  (when (seq? form)
    (let [head (first form)]
      (when (symbol? head)
        (symbol (name head))))))

(defmacro defextension
  "Define a cross-platform extension.

  Stores the extension spec as a def for build system introspection.
  The build system generates the platform-specific init function."
  [sym & body]
  (let [[opts rest-body] (parse-kw-opts body)
        name (:name opts)
        description (:description opts)
        commands (filter #(= 'command (form-op %)) rest-body)
        tools (filter #(= 'tool (form-op %)) rest-body)
        events (filter #(= 'on (form-op %)) rest-body)]
   `(def ~sym
      ~(or description (str sym))
      {:eta-mu/extension true
        :name ~(or name (name sym))
        :description ~description
        :init ~(:init opts)
        :commands ~(vec commands)
        :tools ~(vec tools)
        :events ~(vec events)})))

(defmacro command
  [cmd-name & body]
  (let [[opts _] (parse-kw-opts body)]
    `{:type :command
      :name ~(str cmd-name)
      :description ~(:description opts)
      :handler ~(:handler opts)}))

(defmacro tool
  "Define a tool extension.

  The :execute function receives exactly 5 arguments in this order:
    _tcid   - Tool call ID (string, e.g. 'websearch_123')
    params  - Tool parameters as a JS object (use aget/aset for access)
    sig     - AbortSignal for cancellation
    onupd   - onUpdate callback for progress updates (may be nil)
    ctx     - Extension context object

  Example:
    (em/tool \"my-tool\"
      :execute (fn [_tcid params signal onUpdate ctx]
                 (let [value (aget params \"key\")]
                   ...)))"
  [tool-name & body]
  (let [[opts _] (parse-kw-opts body)
        execute-fn (:execute opts)]
    `{:type :tool
      :name ~(str tool-name)
      :label ~(:label opts)
      :description ~(:description opts)
      :parameters ~(:parameters opts)
      :execute (fn [_tcid# params# sig# onupd# ctx#]
                 (.resolve js/Promise (~execute-fn _tcid# params# sig# onupd# ctx#)))}))

(defmacro on
  [event-name & body]
  (let [[opts _] (parse-kw-opts body)]
    `{:type :event
      :event ~(str event-name)
      :handler ~(:handler opts)}))

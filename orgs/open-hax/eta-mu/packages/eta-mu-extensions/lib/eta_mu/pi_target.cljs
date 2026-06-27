(ns eta-mu.pi-target
  "Code generation for Pi agent extensions.

  Takes an extension spec (produced by eta-mu.core macros) and generates
  the TypeScript/JavaScript code that Pi expects:
  - A CommonJS module with (defn init [pi] ...) entry point
  - pi.registerCommand() for commands
  - pi.registerTool() for tools
  - pi.on() for events
  - index.ts shim for ESM interop"
  (:require [clojure.string :as str]))

(defn- indent [n s]
  (let [pad (apply str (repeat n " "))]
    (str/replace s #"(?m)^" pad)))

(defn- js-fn [params body]
  (let [param-str (str/join ", " params)]
    (str "async (" param-str ") => " body)))

(defn- gen-command [cmd]
  (let [name (:name cmd)
        desc (:description cmd)
        handler (:handler cmd)]
    (str "pi.registerCommand(\"" name "\", {\n"
         "  description: \"" desc "\",\n"
         "  handler: " (js-fn ['args 'ctx] (pr-str handler)) "\n"
         "});")))

(defn- gen-parameters [params]
  (when params
    (let [required (->> params
                        (remove (fn [[_ spec]] (:optional spec)))
                        (map (comp name key))
                        vec)
          properties (into {}
                           (map (fn [[k spec]]
                                  [(name k) (dissoc spec :optional)]))
                           params)
          schema (cond-> {:type "object"
                          :properties properties
                          :additionalProperties false}
                   (seq required) (assoc :required required))]
      (pr-str schema))))

(defn- gen-tool [tool]
  (let [name (:name tool)
        label (:label tool)
        desc (:description tool)
        params (:parameters tool)
        execute (:execute tool)]
    (str "pi.registerTool({\n"
         "  name: \"" name "\",\n"
         "  label: \"" label "\",\n"
         "  description: \"" desc "\",\n"
         "  parameters: " (gen-parameters params) ",\n"
         "  async execute(_toolCallId, params, _signal, _onUpdate, ctx) {\n"
         "    return " (pr-str execute) "\n"
         "  }\n"
         "});")))

(defn- gen-event [evt]
  (let [event (:event evt)
        handler (:handler evt)]
    (str "pi.on(\"" event "\", " (js-fn ['event 'ctx] (pr-str handler)) ");")))

(defn gen-pi-extension [ext]
  "Generate a Pi extension module from an extension spec.

  Returns a map with:
    :runtime-js - the compiled CLJS runtime code (CommonJS)
    :index-ts - the TypeScript shim for ESM interop"
  (let [name (:name ext)
        desc (:description ext)
        commands (:commands ext)
        tools (:tools ext)
        events (:events ext)]
    {:index-ts (str "const runtime = require(\"./runtime.js\");\n\nexport default runtime.default ?? runtime;\n")
     :extension-spec {:name name
                      :description desc
                      :commands (count commands)
                      :tools (count tools)
                      :events (count events)}}))

(defn gen-pi-init-body [ext]
  "Generate the body of the (defn init [pi] ...) function as a string.

  This is embedded into the CLJS source so shadow-cljs compiles it
  into the runtime.js output."
  (let [init-fn (:init ext)
        commands (:commands ext)
        tools (:tools ext)
        events (:events ext)]
    (str/join "\n"
              (concat
               (when init-fn
                 [(str "(when-let [init-fn# (:init spec#)]\n"
                       "  (init-fn# pi#))")])
               (map gen-command commands)
               (map gen-tool tools)
               (map gen-event events)))))

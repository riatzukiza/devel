(ns my.opencode.dsl.macros)

(defmacro hook
  "Add a raw hook by name (string or keyword). Handler signature: (fn [ctx &args])."
  [event handler]
  `{:hooks {~event ~handler}})

(defmacro before-tool
  "Add a tool.execute.before hook filtered by tool name.
   Handler signature: (fn [ctx input output])."
  [tool-name handler]
  `(hook "tool.execute.before"
         (fn [ctx# input# output#]
           (when (= ~tool-name (.-tool input#))
             (~handler ctx# input# output#)))))

(defmacro after-tool
  "Add a tool.execute.after hook filtered by tool name.
   Handler signature: (fn [ctx input output])."
  [tool-name handler]
  `(hook "tool.execute.after"
         (fn [ctx# input# output#]
           (when (= ~tool-name (.-tool input#))
             (~handler ctx# input# output#)))))

(defmacro tools
  "Add tools map. Values must already be tool objects."
  [m]
  `{:tools ~m})

(defmacro extra
  "Add arbitrary extra keys to the returned plugin object."
  [m]
  `{:extra ~m})

(defmacro init
  "Add an init function (composed in order). Signature: (fn [ctx])."
  [f]
  `{:init ~f})

(defmacro defplugin
  "Define a composed plugin spec and compile it to a plugin function.

  (defplugin plugin*
    (init (fn [ctx] ...))
    (hook "event" (fn [ctx payload] ...))
    (before-tool "read" (fn [ctx in out] ...))
    (tools {"hello" hello-tool}))

  Produces:
    - <name>-spec : merged spec map
    - <name>      : plugin function (ctx -> Promise<hooks>)
  "
  [name & forms]
  (let [spec-sym (symbol (str name "-spec"))]
    `(do
       (def ~spec-sym
         (my.opencode.spec/merge-specs ~@forms))
       (def ~name
         (my.opencode.runtime/build-plugin ~spec-sym)))))

(ns my.opencode.dsl.macros)

(defmacro hook [event handler]
  `{:hooks {~event ~handler}})

(defmacro before-tool [tool-name handler]
  `(hook "tool.execute.before"
         (fn [ctx# input# output#]
           (when (= ~tool-name (.-tool input#))
             (~handler ctx# input# output#)))))

(defmacro after-tool [tool-name handler]
  `(hook "tool.execute.after"
         (fn [ctx# input# output#]
           (when (= ~tool-name (.-tool input#))
             (~handler ctx# input# output#)))))

(defmacro tools [m]
  `{:tools ~m})

(defmacro extra [m]
  `{:extra ~m})

(defmacro init [f]
  `{:init ~f})

(defmacro defplugin [name & forms]
  (let [spec-sym (symbol (str name "-spec"))]
    `(do
       (def ~spec-sym
         (my.opencode.spec/merge-specs ~@forms))
       (def ~name
         (my.opencode.runtime/build-plugin ~spec-sym)))))

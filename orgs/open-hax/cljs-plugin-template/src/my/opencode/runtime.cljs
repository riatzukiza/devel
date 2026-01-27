(ns my.opencode.runtime)

(defn ^:private key->str [k]
  (cond
    (string? k) k
    (keyword? k) (name k)
    :else (str k)))

(defn clj->js-obj
  "Convert a CLJ map into a JS object; string keys stay strings."
  [m]
  (let [o (js-obj)]
    (doseq [[k v] m]
      (aset o (key->str k) v))
    o))

(defn wrap-handler
  "Wrap handler so it receives ctx first: (fn [ctx &args])."
  [ctx handler]
  (fn [& args]
    (apply handler ctx args)))

(defn build-plugin
  "spec -> (fn [ctx] -> Promise<JS hooks object>)"
  [spec]
  (fn [ctx]
    (-> (js/Promise.resolve ((:init spec) ctx))
        (.then
         (fn [_]
           (let [out (js-obj)]
             ;; hooks
             (doseq [[k handler] (:hooks spec)]
               (aset out (key->str k) (wrap-handler ctx handler)))
             ;; tools under "tool"
             (when (seq (:tools spec))
               (aset out "tool" (clj->js-obj (:tools spec))))
             ;; extra top-level properties
             (when (seq (:extra spec))
               (.assign js/Object out (clj->js-obj (:extra spec))))
             out))))))

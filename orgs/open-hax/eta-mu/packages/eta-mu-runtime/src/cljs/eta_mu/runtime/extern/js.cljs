(ns eta-mu.runtime.extern.js)

(defn value->clj
  "Decode a JavaScript value into keywordized CLJS data at a named boundary."
  [value]
  (js->clj value :keywordize-keys true))

(defn object->clj
  "Decode a possibly nil JavaScript object into a keywordized CLJS map."
  [value]
  (js->clj (or value #js {}) :keywordize-keys true))

(defn array->clj-vector
  "Decode a possibly nil JavaScript array into a CLJS vector."
  [value]
  (vec (js->clj (or value #js []) :keywordize-keys true)))

(defn clj->value
  "Encode CLJS data as a JavaScript value at a named boundary."
  [value]
  (clj->js value))

(defn success
  [boundary value]
  {:ok true
   :boundary boundary
   :value value})

(defn error
  ([boundary message]
   (error boundary message nil nil))
  ([boundary message code cause]
   (cond-> {:ok false
            :boundary boundary
            :message message}
     code (assoc :code code)
     cause (assoc :cause cause))))

(ns eta-mu.runtime.extern.time)

(defn finite-number!
  [value label]
  (if (and (number? value) (js/Number.isFinite value))
    value
    (throw (ex-info (str "Invalid eta-mu runtime " label)
                    {:label label
                     :value value}))))

(defn now-ms
  []
  (finite-number! (.getTime (js/Date.)) "timestamp"))

(defn now-iso
  []
  (.toISOString (js/Date.)))

(defn timestamp-ms
  [value]
  (cond
    (number? value)
    (finite-number! value "timestamp")

    (string? value)
    (finite-number! (.getTime (js/Date. value)) "timestamp")

    :else
    (now-ms)))

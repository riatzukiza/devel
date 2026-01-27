(ns my.opencode.state)

(defn ensure!
  "Ensure ctx has a shared mutable state bucket. Returns the bucket."
  [ctx]
  (let [k "__cljsPluginState"]
    (or (aget ctx k)
        (let [s (js-obj)]
          (aset ctx k s)
          s))))

(defn get
  [ctx key]
  (let [s (ensure! ctx)]
    (aget s key)))

(defn set!
  [ctx key value]
  (let [s (ensure! ctx)]
    (aset s key value)
    value))

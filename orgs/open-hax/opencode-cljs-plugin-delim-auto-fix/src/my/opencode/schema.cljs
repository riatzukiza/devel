(ns my.opencode.schema
  (:require ["zod" :as zod]))

(def z (.-z zod))

(defn ^:private apply-mods [schema mods]
  (reduce-kv
   (fn [s k v]
     (case k
       :min (.min s v)
       :max (.max s v)
       :email (.email s)
       :url (.url s)
       :regex (.regex s v)
       :optional (.optional s)
       :nullable (.nullable s)
       :default (.default s v)
       s))
   schema
   (or mods {})))

(defn field
  "Field spec formats:
  - :string | :number | :boolean | :any
  - [:string {:min 1 :max 32 :optional true}]
  - [:number {:min 0 :max 100}]
  - [:boolean {:default false}]"
  [spec]
  (cond
    (keyword? spec)
    (case spec
      :string (.string z)
      :number (.number z)
      :boolean (.boolean z)
      :any (.any z)
      (.any z))

    (and (vector? spec) (keyword? (nth spec 0)))
    (let [[t mods] spec
          base (field t)]
      (apply-mods base mods))

    :else
    (.any z)))

(defn object
  "EDN schema map -> z.object({ ... })"
  [m]
  (.object z
           (clj->js
            (reduce-kv
             (fn [acc k v]
               (assoc acc (name k) (field v)))
             {}
             (or m {})))))

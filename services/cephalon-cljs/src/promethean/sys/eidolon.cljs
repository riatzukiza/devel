(ns promethean.sys.eidolon
  (:require
    [promethean.eidolon.nexus-index :as ni]
    [promethean.eidolon.embed :as emb]))

(defn- enqueue-effect [w eff]
  (update w :effects conj eff))

(defn sys-eidolon-index [w]
  (let [idx (get-in w [:env :stores :nexus])
        events (:events-in w)
        model (get-in w [:env :config :models :embedding] "qwen3-embedding") ]
    (reduce
      (fn [w evt]
        (if (= (:event/type evt) :memory/created)
          (let [mem (get-in evt [:event/payload :memory])
                mid (:memory/id mem)
                keys (:memory/nexus-keys mem)]
            (ni/upsert! idx mid keys)
            ;; schedule embedding for canonical lane (MVP)
            (let [eff-id (str (random-uuid))
                  input (emb/memory->embedding-input
                          {:agent-name "promethean"
                           :circuit :c1-survival
                           :persistent-snippet ""
                           :recent-snippet ""}
                          mem)]
              (enqueue-effect w {:effect/type :llm/embed
                                 :effect/id eff-id
                                 :model model
                                 :input input
                                 :meta {:memory-id mid
                                        :lane :canonical
                                        :ts (:memory/ts mem)}})))
          w))
      w
      events)))

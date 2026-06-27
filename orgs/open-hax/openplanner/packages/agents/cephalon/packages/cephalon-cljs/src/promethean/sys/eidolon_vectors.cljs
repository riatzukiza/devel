(ns promethean.sys.eidolon-vectors
  (:require
    [promethean.eidolon.vector-store :as vs]
    [promethean.memory.store :as ms]))

(defn sys-eidolon-vectors [w]
  (let [vectors (get-in w [:env :stores :vectors])
        mem-store (get-in w [:env :stores :mem])
        events (:events-in w)]
    (reduce
      (fn [w evt]
        (if (= (:event/type evt) :llm/embed.result)
          (let [effect (get-in evt [:event/payload :effect])
                lane (get-in effect [:meta :lane] :canonical)
                mid (get-in effect [:meta :memory-id])
                ts (get-in effect [:meta :ts] (.now js/Date))
                resp (get-in evt [:event/payload :result])
                embedding (get-in resp [:data 0 :embedding])
                mem (ms/get-memory mem-store mid)]
            (when (and embedding mem)
              (vs/upsert! vectors lane mid embedding {:ts ts :deleted (get-in mem [:memory/lifecycle :deleted])}))
            w)
          w))
      w
      events)))

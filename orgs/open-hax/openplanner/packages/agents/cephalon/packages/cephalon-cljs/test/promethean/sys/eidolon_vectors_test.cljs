(ns promethean.sys.eidolon-vectors-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.sys.eidolon-vectors :as ev]
            [promethean.eidolon.vector-store :as vs]
            [promethean.memory.store :as ms]))

(deftest sys-eidolon-vectors-upserts-embedding
  (let [vectors (vs/make-store)
        mem-store (ms/make-store)
        mem {:memory/id "m1" :memory/lifecycle {:deleted false}}
        _ (ms/put-memory! mem-store mem)
        evt {:event/type :llm/embed.result
             :event/payload {:effect {:meta {:lane :canonical :memory-id "m1" :ts 1000}}
                             :result {:data [{:embedding [1 0 0]}]}}}
        w {:env {:stores {:vectors vectors :mem mem-store}}
           :events-in [evt]}
        w' (ev/sys-eidolon-vectors w)]
    (is (= w w'))
    (let [results (vs/search vectors :canonical [1 0 0] {:k 1 :now-ms 1000})
          [mid _score deleted] (first results)]
      (is (= "m1" mid))
      (is (false? deleted)))))

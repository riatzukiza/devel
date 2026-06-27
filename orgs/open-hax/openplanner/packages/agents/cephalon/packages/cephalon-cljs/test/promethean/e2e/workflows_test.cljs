(ns promethean.e2e.workflows-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.ecs.world :as world]
            [promethean.sys.memory :as sys.memory]
            [promethean.sys.eidolon :as sys.eidolon]
            [promethean.memory.store :as ms]
            [promethean.eidolon.nexus-index :as ni]
            [promethean.eidolon.vector-store :as vs]))

(defn- make-world []
  (-> (world/empty-world)
      (assoc :env {:stores {:mem (ms/make-store)
                            :nexus (ni/make-index)
                            :vectors (vs/make-store)}}
             :events-in []
             :events-out []
             :effects [])))

(deftest discord-message-flow
  (let [evt {:event/id "evt-1"
             :event/ts 1
             :event/type :discord.message/new
             :event/source {:channel-id "c1" :author-id "a1" :message-id "m1"}
             :event/payload {:content "hello" :author-bot false}}
        w0 (assoc (make-world) :events-in [evt])
        w1 (sys.memory/sys-memory-ingest w0)
        created (first (:events-out w1))
        w2 (-> w1
               (assoc :events-in [created])
               (assoc :events-out []))
        w3 (sys.eidolon/sys-eidolon-index w2)
        eff (first (:effects w3))]
    (is (= :memory/created (:event/type created)))
    (is (= :llm/embed (:effect/type eff)))))

(deftest fs-created-flow
  (let [evt {:event/id "evt-2"
             :event/ts 2
             :event/type :fs.file/created
             :event/payload {:path "/docs/notes/a.md"}}
        w0 (assoc (make-world) :events-in [evt])
        w1 (sys.memory/sys-memory-ingest w0)
        created (first (:events-out w1))
        mem (get-in created [:event/payload :memory])]
    (is (= :memory/created (:event/type created)))
    (is (= "/docs/notes/a.md" (get-in mem [:memory/meta :fs/path])))))

(deftest memory-dedupe-flow
  (let [evt1 {:event/id "evt-3"
              :event/ts 3
              :event/type :discord.message/new
              :event/source {:channel-id "c1" :author-id "a1" :message-id "m2"}
              :event/payload {:content "dup" :author-bot false}}
        evt2 (assoc evt1 :event/id "evt-4")
        w0 (assoc (make-world) :events-in [evt1 evt2])
        w1 (sys.memory/sys-memory-ingest w0)
        stats (get-in @(:mem (get-in w1 [:env :stores])) [:stats])]
    (is (= 1 (:put stats)))
    (is (= 1 (:deduped stats)))))

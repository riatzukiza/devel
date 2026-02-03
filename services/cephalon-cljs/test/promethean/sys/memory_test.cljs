(ns promethean.sys.memory-test
  (:require
    [cljs.test :refer-macros [deftest is testing]]
    [promethean.ecs.world :as world]
    [promethean.sys.memory :as memory]
    [promethean.memory.store :as ms]
    [promethean.memory.tags :as tags]))

(deftest sys-memory-ingest-test
  (let [store (ms/make-store)
        w (-> (world/empty-world)
              (assoc-in [:env :stores :mem] store))]
    
    (testing "discord.message/new event produces :memory/created event"
      (let [evt {:event/id "evt-1"
                 :event/ts 1000
                 :event/type :discord.message/new
                 :event/source {:channel-id "chan-1"
                                :author-id "auth-1"
                                :message-id "msg-1"}
                 :event/payload {:content "hello world"
                                 :author-bot false}}
            w' (-> w
                   (assoc :events-in [evt])
                   memory/sys-memory-ingest)
            out-evts (:events-out w')
            created-evt (first (filter #(= :memory/created (:event/type %)) out-evts))
            mem (get-in created-evt [:event/payload :memory])]
        (is (= 1 (count out-evts)))
        (is (= :memory/created (:event/type created-evt)))
        (is (= "hello world" (:memory/text mem)))
        (is (= "chan-1" (get-in mem [:memory/meta :discord/channel-id])))
        (is (= "auth-1" (get-in mem [:memory/meta :discord/author-id])))))

    (testing "fs.file/created event produces memory with :fs/path and tags"
      (let [evt {:event/id "evt-2"
                 :event/ts 2000
                 :event/type :fs.file/created
                 :event/payload {:path "/foo/bar.txt"}}
            w' (-> w
                   (assoc :events-in [evt])
                   memory/sys-memory-ingest)
            created-evt (first (filter #(= :memory/created (:event/type %)) (:events-out w')))
            mem (get-in created-evt [:event/payload :memory])]
        (is (= "/foo/bar.txt" (get-in mem [:memory/meta :fs/path])))
        (is (= (tags/tags-for-event evt) (:memory/tags mem)))))))

(ns promethean.sys.memory-test
  (:require
    [cljs.test :refer-macros [deftest is testing]]
    [promethean.ecs.world :as world]
    [promethean.sys.memory :as memory]
    [promethean.debug.log :as log]
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
        (is (= (tags/tags-for-event evt) (:memory/tags mem)))))

    (testing "memory/created emits OpenPlanner EventEnvelopeV1"
      (let [captured (atom nil)
            evt {:event/id "evt-3"
                 :event/ts 3000
                 :event/type :discord.message/new
                 :event/source {:channel-id "chan-1"
                                :author-id "auth-1"
                                :message-id "msg-99"}
                 :event/payload {:content "hello planner"
                                 :author-bot false}}
            w-with-config (assoc-in w [:env :config :openplanner] {:url "http://planner.test"
                                                                    :api-key "test-key"})]
        (with-redefs [memory/openplanner-post-events!
                      (fn [cfg events]
                        (reset! captured {:cfg cfg :events events})
                        (js/Promise.resolve {:indexed 1}))]
          (-> w-with-config
              (assoc :events-in [evt])
              memory/sys-memory-ingest)
          (is (= {:url "http://planner.test" :api-key "test-key"}
                 (:cfg @captured)))
          (is (= 1 (count (:events @captured))))
          (let [envelope (first (:events @captured))]
            (is (= "openplanner.event.v1" (:schema envelope)))
            (is (string? (:id envelope)))
            (is (string? (:ts envelope)))
            (is (= "cephalon-cljs" (:source envelope)))
            (is (= "memory.created" (:kind envelope)))
            (is (contains? envelope :source_ref))
            (is (= "hello planner" (:text envelope)))
            (is (contains? envelope :meta))
            (is (contains? envelope :extra))))))

    (testing "OpenPlanner failure logs error and does not crash"
      (let [errors (atom [])
            evt {:event/id "evt-4"
                 :event/ts 4000
                 :event/type :discord.message/new
                 :event/source {:channel-id "chan-1"
                                :author-id "auth-1"
                                :message-id "msg-err"}
                 :event/payload {:content "planner failure"
                                 :author-bot false}}
            w-with-config (assoc-in w [:env :config :openplanner] {:url "http://planner.test"
                                                                    :api-key "test-key"})]
        (with-redefs [memory/openplanner-post-events!
                      (fn [_cfg _events]
                        (throw (js/Error. "boom")))
                      log/error
                      (fn [& args]
                        (swap! errors conj args))]
          (let [w' (-> w-with-config
                       (assoc :events-in [evt])
                       memory/sys-memory-ingest)]
            (is (= 1 (count (:events-out w'))))
            (is (= 1 (count @errors)))))))))

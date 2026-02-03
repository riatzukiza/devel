(ns promethean.sys.sentinel-test
  (:require
    [clojure.string :as str]
    [cljs.test :refer-macros [deftest is testing]]
    [promethean.ecs.world :as world]
    [promethean.sys.sentinel :as sentinel]))

(deftest sys-sentinel-integration-test
  (testing "idle -> reading on :fs.file/created"
    (let [w (-> (world/empty-world)
                (sentinel/bootstrap-docs-notes-sentinel)
                (assoc :events-in [{:event/type :fs.file/created
                                    :event/payload {:path "notes/test.md"}}]))
          seid (first (world/entities-with w :sentinel/name))
          w' (sentinel/sys-sentinel w)
          s' (world/get-entity w' seid)
          eff (first (:effects w'))]
      (is (= :reading (:sentinel/state s')))
      (is (= "notes/test.md" (get-in s' [:sentinel/input :path])))
      (is (some? (:sentinel/awaiting s')))
      (is (= :fs/read (:effect/type eff)))
      (is (= "notes/test.md" (:path eff)))))

  (testing "reading -> llm on :fs/read.result"
    (let [seid "sentinel-1"
          awaiting-id "eff-1"
          w (-> (world/empty-world)
                (world/add-entity seid {:sentinel/name "notes-frontmatter"
                                        :sentinel/state :reading
                                        :sentinel/input {:path "notes/test.md"}
                                        :sentinel/awaiting awaiting-id})
                (assoc :events-in [{:event/type :fs/read.result
                                    :event/payload {:effect-id awaiting-id
                                                    :result "# Hello\nContent"}}]))
          w' (sentinel/sys-sentinel w)
          s' (world/get-entity w' seid)
          eff (first (:effects w'))]
      (is (= :llm (:sentinel/state s')))
      (is (some? (:sentinel/awaiting s')))
      (is (not= awaiting-id (:sentinel/awaiting s')))
      (is (= :llm/chat (:effect/type eff)))
      (is (str/includes? (get-in eff [:messages 1 :content]) "# Hello\nContent"))))

  (testing "llm -> writing on :llm/chat.result with valid frontmatter"
    (let [seid "sentinel-1"
          awaiting-id "eff-2"
          valid-md "---\ntitle: Test\nslug: test\ndescription: desc\ntags: [t1]\n---\n# Hello"
          w (-> (world/empty-world)
                (world/add-entity seid {:sentinel/name "notes-frontmatter"
                                        :sentinel/state :llm
                                        :sentinel/input {:path "notes/test.md"}
                                        :sentinel/awaiting awaiting-id})
                (assoc :events-in [{:event/type :llm/chat.result
                                    :event/payload {:effect-id awaiting-id
                                                    :result {:choices [{:message {:content valid-md}}]}}}]))
          w' (sentinel/sys-sentinel w)
          s' (world/get-entity w' seid)
          eff (first (:effects w'))]
      (is (= :writing (:sentinel/state s')))
      (is (= :fs/write (:effect/type eff)))
      (is (= valid-md (:content eff)))
      (is (= "notes/test.md" (:path eff))))))

(ns test-state
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.state :as state]))

(deftest test-buffer-operations
  (testing "create-buffer"
    (let [buffer (state/create-buffer "test-id" "content")]
      (is (= "test-id" (:id buffer)))
      (is (= "content" (:content buffer)))
      (is (= "Buffer test-id" (:name buffer)))))

  (testing "add-buffer!"
    (reset! state/app-state {:buffers {} :current-buffer nil})
    (let [buffer (state/create-buffer "buf1" "content")]
      (state/add-buffer! buffer)
      (is (= buffer (get-in @state/app-state [:buffers "buf1"])))
      (is (= "buf1" (:current-buffer @state/app-state)))))

  (testing "remove-buffer!"
    (reset! state/app-state {:buffers {"buf1" {:id "buf1"} "buf2" {:id "buf2"}}
                             :current-buffer "buf1"})
    (state/remove-buffer! "buf1")
    (is (nil? (get-in @state/app-state [:buffers "buf1"])))
    (is (= "buf2" (:current-buffer @state/app-state))))

  (testing "set-current-buffer!"
    (reset! state/app-state {:buffers {"buf1" {} "buf2" {}}
                             :current-buffer "buf1"})
    (state/set-current-buffer! "buf2")
    (is (= "buf2" (:current-buffer @state/app-state)))))

(deftest test-evil-state
  (testing "set/get evil mode"
    (reset! state/app-state {:evil-state {:mode :normal}})
    (state/set-evil-mode! :insert)
    (is (= :insert (state/get-evil-mode)))))

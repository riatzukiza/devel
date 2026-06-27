(ns test-plugins
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.plugins :as plugins]
            [opencode-unified.state :as state]))

(defn reset-plugins! []
  (reset! plugins/plugin-state {:loaded-plugins {}
                                :active-plugins {}
                                :available-plugins []
                                :plugin-hooks {}
                                :plugin-commands []
                                :last-error nil}))

(deftest test-plugin-validation
  (testing "validate-plugin success"
    (let [valid {:name "test-plugin" :version "1.0.0" :main "foo.js"}]
      (is (:valid (plugins/validate-plugin valid)))))

  (testing "validate-plugin failure"
    (let [invalid {:name "test-plugin"}] ;; Missing version/main
      (is (not (:valid (plugins/validate-plugin invalid)))))
    (let [invalid-ver {:name "p" :version "bad" :main "foo.js"}]
      (is (not (:valid (plugins/validate-plugin invalid-ver)))))))

(deftest test-plugin-lifecycle
  (testing "load-plugin"
    (reset-plugins!)
    (let [meta {:name "p1" :version "1.0.0" :main "p1.js" :hooks [:buffer-created]}]
      (plugins/load-plugin meta)
      (let [loaded (get-in @plugins/plugin-state [:loaded-plugins "p1"])]
        (is (some? loaded))
        (is (= :loaded (:state loaded)))
        (is (= "p1" (get-in loaded [:metadata :name]))))))

  (testing "activate-plugin"
    (reset-plugins!)
    (let [meta {:name "p1" :version "1.0.0" :main "p1.js"}
          activated? (atom false)]
      (plugins/load-plugin meta)
      ;; Patch instance
      (swap! plugins/plugin-state assoc-in [:loaded-plugins "p1" :instance :activate]
             (fn [] (reset! activated? true)))
      
      (plugins/activate-plugin "p1")
      (is @activated?)
      (is (= :active (get-in @plugins/plugin-state [:loaded-plugins "p1" :state])))
      (is (some? (get-in @plugins/plugin-state [:active-plugins "p1"])))))

  (testing "deactivate-plugin"
    (reset-plugins!)
    (let [meta {:name "p1" :version "1.0.0" :main "p1.js"}
          deactivated? (atom false)]
      (plugins/load-plugin meta)
      (plugins/activate-plugin "p1")
      
      (swap! plugins/plugin-state assoc-in [:active-plugins "p1" :instance :deactivate]
             (fn [] (reset! deactivated? true)))
      
      (plugins/deactivate-plugin "p1")
      (is @deactivated?)
      (is (= :loaded (get-in @plugins/plugin-state [:loaded-plugins "p1" :state])))
      (is (nil? (get-in @plugins/plugin-state [:active-plugins "p1"]))))))

(deftest test-hooks
  (testing "execute-hook"
    (reset-plugins!)
    (let [meta {:name "p1" :version "1.0.0" :main "p1.js" :hooks [:buffer-created]}
          hook-called? (atom false)]
      (plugins/load-plugin meta)
      
      ;; Patch hook in instance
      (swap! plugins/plugin-state assoc-in [:loaded-plugins "p1" :instance :hooks :buffer-created]
             (fn [buf] (reset! hook-called? (:id buf))))
      
      (plugins/activate-plugin "p1")
      
      (plugins/execute-hook :buffer-created {:id "buf1"})
      (is (= "buf1" @hook-called?)))))

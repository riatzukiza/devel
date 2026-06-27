(ns test-command-palette
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.command-palette :as cp]
            [opencode-unified.state :as state]))

(deftest test-command-registration
  (testing "register-command!"
    (reset! cp/command-registry {})
    (let [cmd {:id "test.cmd" :title "Test Command" :description "Desc" :handler (fn [] :ok) :keywords ["foo"]}]
      (cp/register-command! cmd)
      (let [registered (get @cp/command-registry "test.cmd")]
        (is (= "test.cmd" (:id registered)))
        (is (= "Test Command" (:title registered)))
        (is (= "Desc" (:description registered)))
        (is (= ["foo"] (:keywords registered)))))))

(deftest test-filtering
  (testing "filtered-commands"
    (reset! cp/command-registry {})
    (cp/register-commands!
     [{:id "c1" :title "Alpha" :handler #() :keywords []}
      {:id "c2" :title "Beta" :handler #() :keywords ["gamma"]}])
    
    ;; Default state (empty query) -> all commands
    (cp/update-query! "")
    (is (= 2 (count (cp/filtered-commands))))

    ;; Match title
    (cp/update-query! "alp")
    (let [results (cp/filtered-commands)]
      (is (= 1 (count results)))
      (is (= "c1" (:id (first results)))))

    ;; Match keyword
    (cp/update-query! "gamma")
    (let [results (cp/filtered-commands)]
      (is (= 1 (count results)))
      (is (= "c2" (:id (first results)))))

    ;; No match
    (cp/update-query! "zeta")
    (is (empty? (cp/filtered-commands)))))

(deftest test-execution
  (testing "execute! sync success"
    (reset! state/app-state {:ui {:command-palette cp/default-palette-state}})
    (let [executed? (atom false)
          cmd {:id "exec.test" 
               :title "Exec Test" 
               :handler (fn [] (reset! executed? true) {:success true})}]
      (cp/execute! cmd)
      (is @executed?)
      (let [feedback (:feedback (cp/palette-state))]
        (is (= :success (:status feedback)))
        (is (= "exec.test" (:command-id feedback))))))

  (testing "destructive confirmation flow"
    (reset! state/app-state {:ui {:command-palette cp/default-palette-state}})
    (let [executed? (atom false)
          cmd {:id "destruct.test" 
               :title "Boom" 
               :destructive? true
               :handler (fn [] (reset! executed? true))}]
      
      ;; 1. Trigger execution -> Should ask for confirmation
      (cp/execute! cmd)
      (is (not @executed?))
      (is (= cmd (:pending-confirmation (cp/palette-state))))

      ;; 2. Confirm -> Should execute
      (cp/confirm-destructive!)
      (is @executed?)
      (is (nil? (:pending-confirmation (cp/palette-state)))))))

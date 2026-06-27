(ns test-buffers-motion
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.buffers :as buffers]
            [opencode-unified.state :as state]))

(defn mock-event [value selection-start]
  (let [target #js {:value value
                    :selectionStart selection-start
                    :selectionEnd selection-start
                    :length (count value)}]
    #js {:target target
         :preventDefault (fn [])}))

(deftest test-cursor-motion
  (testing "move-cursor-right"
    (reset! state/app-state {:buffers {"1" {:id "1" :cursor-pos 0}} :current-buffer "1"})
    (let [e (mock-event "abc" 0)]
      (buffers/move-cursor-right e)
      (is (= 1 (.-selectionStart (.-target e))))
      (is (= 1 (:cursor-pos (state/get-current-buffer))))))

  (testing "move-cursor-left"
    (reset! state/app-state {:buffers {"1" {:id "1" :cursor-pos 1}} :current-buffer "1"})
    (let [e (mock-event "abc" 1)]
      (buffers/move-cursor-left e)
      (is (= 0 (.-selectionStart (.-target e))))
      (is (= 0 (:cursor-pos (state/get-current-buffer))))))

  (testing "move-to-line-end"
    (reset! state/app-state {:buffers {"1" {:id "1" :cursor-pos 0}} :current-buffer "1"})
    (let [content "line1\nline2"
          e (mock-event content 0)]
      (buffers/move-to-line-end e)
      (is (= 5 (.-selectionStart (.-target e))))
      (is (= 5 (:cursor-pos (state/get-current-buffer)))))))

(deftest test-operators
  (testing "delete-char"
    (reset! state/app-state {:buffers {"1" {:id "1" :content "abc" :cursor-pos 1}} :current-buffer "1"})
    (let [e (mock-event "abc" 1)]
      (buffers/delete-char e)
      (is (= "ac" (.-value (.-target e))))
      (is (= "ac" (:content (state/get-current-buffer))))
      (is (= 1 (:cursor-pos (state/get-current-buffer)))))))

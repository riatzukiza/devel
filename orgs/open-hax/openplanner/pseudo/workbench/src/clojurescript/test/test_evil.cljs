(ns test-evil
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.evil :as evil]
            [opencode-unified.state :as state]
            [opencode-unified.buffers :as buffers]))

(defn reset-state! []
  (reset! state/app-state {:buffers {}
                           :current-buffer nil
                           :evil-state {:mode :normal}
                           :statusbar {}}))

(defn mock-buffer [content cursor-pos]
  (let [buffer-id "test-buffer"]
    (swap! state/app-state assoc :buffers {buffer-id {:id buffer-id 
                                                      :content content 
                                                      :cursor-pos cursor-pos}})
    (swap! state/app-state assoc :current-buffer buffer-id)))

(deftest test-mode-transitions
  (testing "enter-insert-mode"
    (reset-state!)
    (evil/enter-insert-mode)
    (is (= :insert (evil/get-mode)))
    (is (= "INSERT" (get-in @state/app-state [:statusbar :left]))))

  (testing "enter-visual-mode"
    (reset-state!)
    (mock-buffer "abc" 1)
    (evil/enter-visual-mode)
    (is (= :visual (evil/get-mode)))
    (is (= {:start 1 :end 1} (get-in (state/get-current-buffer) [:selection])))
    (is (= "VISUAL" (get-in @state/app-state [:statusbar :left]))))

  (testing "exit-visual-mode"
    (reset-state!)
    (evil/set-mode! :visual)
    (evil/exit-visual-mode)
    (is (= :normal (evil/get-mode)))
    (is (nil? (get-in (state/get-current-buffer) [:selection])))))

(deftest test-cursor-movement-logic
  ;; Testing the logic that would be invoked by keys
  (testing "move-cursor right"
    (reset-state!)
    (mock-buffer "abc" 0)
    (evil/move-cursor :right)
    (is (= 1 (:cursor-pos (state/get-current-buffer)))))

  (testing "move-cursor left"
    (reset-state!)
    (mock-buffer "abc" 1)
    (evil/move-cursor :left)
    (is (= 0 (:cursor-pos (state/get-current-buffer)))))

  (testing "move-cursor down"
    (reset-state!)
    (mock-buffer "l1\nl2" 0)
    (evil/move-cursor :down)
    (is (= 3 (:cursor-pos (state/get-current-buffer))))) ;; 3 is 'l' on 2nd line

  (testing "move-cursor up"
    (reset-state!)
    (mock-buffer "l1\nl2" 3)
    (evil/move-cursor :up)
    (is (= 0 (:cursor-pos (state/get-current-buffer))))))

(deftest test-text-objects
  (testing "word-forward"
    (reset-state!)
    (mock-buffer "ab cd" 0)
    (evil/word-forward)
    (is (= 3 (:cursor-pos (state/get-current-buffer)))))

  (testing "word-backward"
    (reset-state!)
    (mock-buffer "ab cd" 3)
    (evil/word-backward)
    (is (= 0 (:cursor-pos (state/get-current-buffer))))))

(deftest test-line-ops
  (testing "delete-line"
    (reset-state!)
    (mock-buffer "line1\nline2\nline3" 6) ;; cursor on line2
    (evil/delete-current-line)
    (let [buffer (state/get-current-buffer)]
      (is (= "line1\nline3" (:content buffer)))
      ;; Check register content
      (is (= "line2\n" (state/get-evil-register)))))

  (testing "yank-line"
    (reset-state!)
    (mock-buffer "line1\nline2" 0)
    (evil/yank-line)
    (is (= "line1\n" (state/get-evil-register)))))

(deftest test-paste
  (testing "paste-after"
    (reset-state!)
    (mock-buffer "abc" 1)
    (state/set-evil-register! "x")
    (evil/paste-after)
    (is (= "abxc" (:content (state/get-current-buffer)))))

  (testing "paste-before"
    (reset-state!)
    (mock-buffer "abc" 1)
    (state/set-evil-register! "x")
    (evil/paste-before)
    (is (= "axbc" (:content (state/get-current-buffer))))))

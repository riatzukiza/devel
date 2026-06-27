(ns opencode.ui.github-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [ajax.core :as ajax]
            [opencode.ui.github :as gh]
            [opencode.ui.state :as S]
            [opencode.ui.config :as config]))

(use-fixtures :each
  (fn [f]
    (reset! S/!state {:issues [] :issues-loading? false :issues-error nil
                      :prs [] :prs-loading? false :prs-error nil
                      :worktrees [] :worktrees-loading? false :worktrees-error nil
                      :worktree-config {:baseDir "worktrees"}
                      :fs {:path "." :entries [] :loading? false :error nil}
                      :events []
                      :connected? false
                      :repo "riatzukiza/opencode"
                      :repo-history ["riatzukiza/opencode"]})
    (reset! gh/issue-detail-cache {})
    (reset! gh/pr-detail-cache {})
    (set! (.-XMLHttpRequest js/globalThis)
          (fn []
            (let [xhr (js-obj)]
              (set! (.-open xhr) (fn [& _]))
              (set! (.-setRequestHeader xhr) (fn [& _]))
              (set! (.-send xhr) (fn [] nil))
              xhr)))
    (f)))

(deftest issues-fetch-sets-loading-and-error
  (let [xhr (js-obj)]
    (with-redefs [config/api-base (fn [] "http://api.test")
                  js/XMLHttpRequest (fn []
                                      (set! (.-open xhr) (fn [& _]))
                                      (set! (.-setRequestHeader xhr) (fn [& _]))
                                      (set! (.-send xhr) (fn []
                                                           (set! (.-status xhr) 500)
                                                           (set! (.-statusText xhr) "Boom")
                                                           ((.-onload xhr))))
                                      xhr)]
      (gh/fetch-issues!)
      (is (false? (:issues-loading? @S/!state)))
      (is (= "Boom" (:issues-error @S/!state))))))

(deftest prs-fetch-success-updates-state
  (let [xhr (js-obj)]
    (with-redefs [config/api-base (fn [] "http://api.test")
                  js/XMLHttpRequest (fn []
                                      (set! (.-open xhr) (fn [& _]))
                                      (set! (.-setRequestHeader xhr) (fn [& _]))
                                      (set! (.-send xhr) (fn []
                                                           (set! (.-status xhr) 200)
                                                           (set! (.-__mockResponse xhr) (js/JSON.stringify #js[{"id" 1 "number" 5}]))
                                                           ((.-onload xhr))))
                                      xhr)]
      (gh/fetch-prs!)
      (is (false? (:prs-loading? @S/!state)))
      (is (nil? (:prs-error @S/!state))))))

(deftest watch-cache-once-removes-after-hit
  (let [seen (atom [])
        stop (gh/watch-cache-once! gh/issue-detail-cache "repo/1" #(swap! seen conj %))]
    (swap! gh/issue-detail-cache assoc "repo/1" {:id 1})
    (is (= [{:id 1}] @seen))
    (reset! seen [])
    (stop)
    (swap! gh/issue-detail-cache assoc "repo/1" {:id 2})
    (is (empty? @seen))))

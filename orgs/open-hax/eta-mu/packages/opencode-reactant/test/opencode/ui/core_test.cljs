(ns opencode.ui.core-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [opencode.ui.core :as core]
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
    (reset! core/ws-conn nil)
    (reset! core/reconnect-timeout nil)
    (f)))

(deftest connect-ws-sets-connected-and-reconnects
  (let [opened (atom nil)
        scheduled (atom nil)
        fake-ws (js-obj)]
    (set! (.-close fake-ws) (fn [] nil))
    (with-redefs [config/ws-url (fn [] "ws://test/events")
                  js/WebSocket (fn [url]
                                 (reset! opened url)
                                 fake-ws)
                  js/setTimeout (fn [f ms]
                                   (reset! scheduled ms)
                                   (f)
                                   123)]
      (core/connect-ws!)
      ((.-onopen fake-ws))
      (is (true? (:connected? @S/!state)))
      ((.-onclose fake-ws))
      (is (false? (:connected? @S/!state)))
      (is (= 500 @scheduled))
      (is (= "ws://test/events" @opened)))))

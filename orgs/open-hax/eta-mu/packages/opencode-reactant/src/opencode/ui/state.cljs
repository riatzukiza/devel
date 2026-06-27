(ns opencode.ui.state
  (:require [reagent.core :as r]
            [cljs.reader :as reader]))

(goog-define REPO_SLUG "riatzukiza/opencode")

(defonce !state
  (r/atom {:issues []
           :issues-loading? false
           :issues-error nil
           :prs []
           :prs-loading? false
           :prs-error nil
           :worktrees []
           :worktrees-loading? false
           :worktrees-error nil
           :worktree-config {:baseDir "worktrees"}
           :fs {:path "." :entries [] :loading? false :error nil :loaded? false}
           :events []
           :connected? false
           :repo (or REPO_SLUG "riatzukiza/opencode")
           :repo-history [(or REPO_SLUG "riatzukiza/opencode")]}))

(defn- persist-repo-history! [repos]
  (when-let [ls (.-localStorage js/window)]
    (.setItem ls "opencode/repos" (pr-str repos))))

(defn load-repo-history! []
  (when-let [ls (.-localStorage js/window)]
    (when-let [raw (.getItem ls "opencode/repos")]
      (try
        (when-let [parsed (reader/read-string raw)]
          (when (vector? parsed)
            (swap! !state assoc :repo-history parsed)))
        (catch :default _))))
  nil)

(defn set-repo! [repo]
  (let [repos (swap! !state
                     (fn [s]
                       (let [history (->> (cons repo (:repo-history s))
                                          distinct
                                          (take 8)
                                          vec)]
                          (-> s
                              (assoc :repo repo)
                              (assoc :issues [])
                              (assoc :prs [])
                              (assoc :worktrees [])
                              (assoc :worktree-config {:baseDir "worktrees"})
                              (assoc :fs {:path "." :entries [] :loading? false :error nil :loaded? false})
                              (assoc :repo-history history)))))]
    (persist-repo-history! (:repo-history repos))))


(defn push-event! [e]
  (swap! !state update :events #(->> (conj % e) (take-last 500))))

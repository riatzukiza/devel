(ns opencode.ui.router
  (:require [reagent.core :as r]))

(defonce current-page (r/atom {:name ::home :params {}}))

(defn parse-path [path]
  (let [parts (subs path 1) ; Remove leading /
        parts (when (seq parts) (.split parts "/"))]
    (cond
      (or (nil? parts) (empty? parts) (= parts [""]))
      {:name ::home :params {}}
      
      (= (first parts) "issues")
      (if-let [id (second parts)]
        {:name ::issue :params {:id id}}
        {:name ::issues :params {}})
      
      (= (first parts) "prs")
      (if-let [id (second parts)]
        {:name ::pr :params {:id id}}
        {:name ::prs :params {}})

      (= (first parts) "worktrees")
      {:name ::worktrees :params {}}

      (= (first parts) "files")
      {:name ::files :params {}}

      (= (first parts) "events")
      {:name ::events :params {}}
      
      :else
      {:name ::not-found :params {}})))

(defn navigate! [page-name & params]
  (let [path (case page-name
               ::home "/"
               ::issues "/issues"
               ::prs "/prs"
               ::worktrees "/worktrees"
               ::files "/files"
               ::events "/events"
               ::issue (str "/issues/" (first params))
               ::pr (str "/prs/" (first params))
               "/")]
    (.pushState js/history #{} "" path)
    (reset! current-page (parse-path path))))

(defn init-router! []
  ;; Set initial page based on current URL
  (reset! current-page (parse-path (.. js/window -location -pathname)))
  
  ;; Listen for browser navigation
  (.addEventListener js/window "popstate"
    (fn [e]
      (reset! current-page (parse-path (.. js/window -location -pathname))))))
(ns opencode.ui.core
  (:require [reagent.core :as r]
            [reagent.dom :as dom]
            [opencode.ui.state :as S]
            [opencode.ui.github :as gh]
            [opencode.ui.files :as files]
            [opencode.ui.components :as comp]
            [opencode.ui.router :as router]
            [opencode.ui.detail :as detail]
            [opencode.ui.config :as config]))

(defonce ws-conn (atom nil))
(defonce reconnect-timeout (atom nil))

(defn- clear-timeout! [t]
  (when t (js/clearTimeout t)))

(defn- schedule-reconnect! [connect-fn]
  (clear-timeout! @reconnect-timeout)
  (reset! reconnect-timeout (js/setTimeout connect-fn (config/ws-reconnect-ms))))

(defn connect-ws! []
  (letfn [(connect! []
            (when-let [existing @ws-conn]
              (.close existing))
            (let [ws (js/WebSocket. (config/ws-url))]
              (reset! ws-conn ws)
              (set! (.-onopen ws) #(swap! S/!state assoc :connected? true))
              (set! (.-onclose ws)
                    (fn []
                      (swap! S/!state assoc :connected? false)
                      (schedule-reconnect! connect!)))
              (set! (.-onerror ws)
                    (fn []
                      (swap! S/!state assoc :connected? false)
                      (schedule-reconnect! connect!)))
              (set! (.-onmessage ws)
                    (fn [m]
                      (let [e (js/JSON.parse (.-data m))
                            e (js->clj e :keywordize-keys true)]
                        (S/push-event! e)
                        (when (= (:type e) :refresh/gh)
                          (gh/fetch-issues!)
                          (gh/fetch-prs!)))))))]
    (connect!)
    nil))



(defn home-page []
  (let [{:keys [issues prs worktrees worktree-config connected? repo]} @S/!state]
    ;; Debug logging
    (js/console.log "APP RENDER - issues:" issues)
    (js/console.log "APP RENDER - prs:" prs)
    (js/console.log "APP RENDER - worktrees:" worktrees)
    (js/console.log "APP RENDER - seq issues:" (seq issues))
    (js/console.log "APP RENDER - seq prs:" (seq prs))
    (js/console.log "APP RENDER - seq worktrees:" (seq worktrees))
    (js/console.log "APP RENDER - issues first item:" (first issues))
   (js/console.log "APP RENDER - current route:" @router/current-page)
    (js/console.log "APP RENDER - prs first item:" (first prs))
    [comp/main-layout issues prs worktrees worktree-config connected? repo]))

(defn issues-page []
  (let [{:keys [issues]} @S/!state]
    [comp/issues-section issues]))

(defn prs-page []
  (let [{:keys [prs]} @S/!state]
    [comp/prs-section prs]))

(defn worktrees-page []
  (let [{:keys [worktrees worktree-config]} @S/!state]
    [comp/worktrees-section worktrees worktree-config]))

(defn files-page []
  (let [{:keys [fs]} @S/!state]
    (when (and (not (:loaded? fs)) (not (:loading? fs)))
      (files/fetch-files! (:path fs)))
    [comp/file-explorer]))

(defn events-page []
  [comp/events-log])

(defn not-found-page []
  [:div.h-screen.bg-gray-50.flex.items-center.justify-center
   [:div.text-center
    [:h1.text-2xl.font-bold.text-gray-900 "404 - Page Not Found"]
    [:p.text-gray-600.mt-2 "The page you're looking for doesn't exist."]
    [:button.bg-blue-500.hover:bg-blue-600.text-white.px-4.py-2.rounded-md.mt-4
     {:on-click #(router/navigate! ::router/home)}
     "Go Home"]]])

(defn app []
  (let [current-route @router/current-page]
    (case (:name current-route)
      ::router/home [comp/main-layout (:issues @S/!state) (:prs @S/!state) (:worktrees @S/!state) (:worktree-config @S/!state) (:connected? @S/!state) (:repo @S/!state)]
      ::router/issues [issues-page]
      ::router/prs [prs-page]
      ::router/worktrees [worktrees-page]
      ::router/files [files-page]
      ::router/events [events-page]
      ::router/issue [detail/issue-detail]
      ::router/pr [detail/pr-detail]
      [not-found-page])))

(defn init []
  (js/console.log "Initializing app v4 with routing...")
  (S/load-repo-history!)
  (router/init-router!)
  (connect-ws!)
   
   ;; Fetch data after a short delay to ensure page is ready
   (js/setTimeout 
     (fn []
       (js/console.log "Fetching data...")
       (gh/fetch-issues!)
       (gh/fetch-prs!)
       (gh/fetch-worktrees!)
       (gh/fetch-worktree-config!)
       (files/fetch-files! "."))
     500)
    
  (dom/render [app] (.getElementById js/document "app")))

(ns opencode.ui.github
  (:require [reagent.core :as r]
            [ajax.core :refer [GET POST]]
            [opencode.ui.state :as S]
            [opencode.ui.config :as config]))

;; Cache atoms for issue and PR details
(defonce issue-detail-cache (r/atom {}))
(defonce pr-detail-cache (r/atom {}))

(defn clear-detail-caches! []
  (reset! issue-detail-cache {})
  (reset! pr-detail-cache {}))

(defn watch-cache-once! [cache-atom cache-key callback]
  (let [watch-key [:cache cache-key]]
    (add-watch cache-atom watch-key
               (fn [_ _ _ new-cache]
                 (when-let [v (get new-cache cache-key)]
                   (remove-watch cache-atom watch-key)
                   (callback v))))
    #(remove-watch cache-atom watch-key)))

(defn- mark-loading! [resource]
  (case resource
    :issues (swap! S/!state assoc :issues-loading? true :issues-error nil)
    :prs (swap! S/!state assoc :prs-loading? true :prs-error nil)
    :worktrees (swap! S/!state assoc :worktrees-loading? true :worktrees-error nil)
    nil))

(defn- mark-error! [resource msg]
  (case resource
    :issues (swap! S/!state assoc :issues-loading? false :issues-error msg)
    :prs (swap! S/!state assoc :prs-loading? false :prs-error msg)
    :worktrees (swap! S/!state assoc :worktrees-loading? false :worktrees-error msg)
    nil))

(defn- mark-loaded! [resource payload]
  (case resource
    :issues (swap! S/!state assoc :issues payload :issues-loading? false :issues-error nil)
    :prs (swap! S/!state assoc :prs payload :prs-loading? false :prs-error nil)
    :worktrees (swap! S/!state assoc :worktrees payload :worktrees-loading? false :worktrees-error nil)
    nil))

(defn fetch-issues! []
  (let [repo (:repo @S/!state)]
    (mark-loading! :issues)
    (let [xhr (js/XMLHttpRequest.)]
      (.open xhr "GET" (str (config/api-base) "/issues?repo=" repo) true)
      (.setRequestHeader xhr "Accept" "application/json")
      (set! (.-onload xhr)
            (fn []
              (if (= (.-status xhr) 200)
                (let [response-text (.-responseText xhr)
                      data (js/JSON.parse response-text)
                      clj-data (js->clj data :keywordize-keys true)]
                  (mark-loaded! :issues clj-data))
                (mark-error! :issues (or (.-statusText xhr) "Request failed")))))
      (set! (.-onerror xhr)
            (fn []
              (mark-error! :issues "Network error")))
      (.send xhr))))

(defn fetch-prs! []
  (let [repo (:repo @S/!state)
        xhr (js/XMLHttpRequest.)]
    (mark-loading! :prs)
    (.open xhr "GET" (str (config/api-base) "/prs?repo=" repo) true)
    (.setRequestHeader xhr "Accept" "application/json")
    (set! (.-onload xhr)
          (fn []
            (if (= (.-status xhr) 200)
              (let [raw (or (.-__mockResponse xhr) (.-responseText xhr))
                    data (js/JSON.parse raw)
                    clj-data (try
                               (js->clj data :keywordize-keys true)
                               (catch :default _ []))]
                (mark-loaded! :prs clj-data))
              (mark-error! :prs (or (.-statusText xhr) "Request failed")))))
    (set! (.-onerror xhr)
          (fn [] (mark-error! :prs "Network error")))
    (.send xhr)))

(defn fetch-worktrees! []
  (let [repo (:repo @S/!state)
        xhr (js/XMLHttpRequest.)]
    (mark-loading! :worktrees)
    (.open xhr "GET" (str (config/api-base) "/worktrees?repo=" repo) true)
    (.setRequestHeader xhr "Accept" "application/json")
    (set! (.-onload xhr)
          (fn []
            (if (= (.-status xhr) 200)
              (let [raw (or (.-__mockResponse xhr) (.-responseText xhr))
                    data (js/JSON.parse raw)
                    clj-data (try
                               (js->clj data :keywordize-keys true)
                               (catch :default _ []))]
                (mark-loaded! :worktrees clj-data))
              (mark-error! :worktrees (or (.-statusText xhr) "Request failed")))))
    (set! (.-onerror xhr)
          (fn [] (mark-error! :worktrees "Network error")))
    (.send xhr)))

(defn create-worktree! [issue-number]
  (let [repo (:repo @S/!state)]
    (POST (str (config/api-base) "/worktrees")
          {:params {:repo repo :issue issue-number}
           :format :json
           :handler (fn [response]
                      (S/push-event! {:type :ui/command-ok :cmd :worktree :data response})
                      (fetch-worktrees!))
           :error-handler #(S/push-event! {:type :ui/command-error :cmd :worktree :err %})})))

(defn open-pr! [issue-number]
  (let [repo (:repo @S/!state)]
    (POST (str (config/api-base) "/pulls")
           {:params {:repo repo :issue issue-number}
            :format :json
            :handler #(S/push-event! {:type :ui/command-ok :cmd :pr-open :data %})
            :error-handler #(S/push-event! {:type :ui/command-error :cmd :pr-open :err %})})))

(defn fetch-worktree-config! []
  (GET (str (config/api-base) "/worktrees/config")
       {:handler (fn [response]
                  (let [clj-data (js->clj response :keywordize-keys true)]
                    (swap! S/!state assoc :worktree-config clj-data)))
        :error-handler (fn [{:keys [status status-text]}]
                         (mark-error! :worktrees (str status " " status-text)))}))

(defn reply-comment! [{:keys [repo pr-number body]}]
  (POST (str (config/api-base) "/pr-comment")
        {:params {:repo repo :pr pr-number :body body}
         :format :json
         :handler #(S/push-event! {:type :ui/command-ok :cmd :pr-comment :data %})
         :error-handler #(S/push-event! {:type :ui/command-error :cmd :pr-comment :err %})}))

(defn fetch-issue-detail! [issue-id]
  (let [repo (:repo @S/!state)
        cache-key (str repo "/" issue-id)]
    ;; Check cache first
    (if-let [cached-result (get @issue-detail-cache cache-key)]
      (do
        (js/console.log "Using cached issue detail for:" cache-key)
        cached-result)
      ;; Fetch from API if not cached
      (do
        (js/console.log "Fetching issue detail for:" repo "issue:" issue-id "NEW CODE")
        (GET (str (config/api-base) "/issues/" issue-id)
             {:params {:repo repo}
              :handler (fn [response]
                          (let [clj-data (js->clj response :keywordize-keys true)
                                mapped-data (if (:arr clj-data)
                                              (apply hash-map (:arr clj-data))
                                              clj-data)]
                            (swap! issue-detail-cache assoc cache-key mapped-data)
                            mapped-data))
              :error-handler (fn [{:keys [status status-text]}]
                               (swap! issue-detail-cache assoc cache-key {:error (str status " " status-text)})
                               nil)})))))

(defn fetch-pr-detail! [pr-id]
  (let [repo (:repo @S/!state)
        cache-key (str repo "/" pr-id)]
    ;; Check cache first
    (if-let [cached-result (get @pr-detail-cache cache-key)]
      (do
        (js/console.log "Using cached PR detail for:" cache-key)
        cached-result)
      ;; Fetch from API if not cached
      (do
        (js/console.log "Fetching PR detail for:" repo "PR:" pr-id)
        (GET (str (config/api-base) "/prs/" pr-id)
             {:params {:repo repo}
              :handler (fn [response]
                         (let [clj-data (js->clj response :keywordize-keys true)
                               mapped-data (if (:arr clj-data)
                                             (apply hash-map (:arr clj-data))
                                             clj-data)]
                           (swap! pr-detail-cache assoc cache-key mapped-data)
                           mapped-data))
              :error-handler (fn [{:keys [status status-text]}]
                               (swap! pr-detail-cache assoc cache-key {:error (str status " " status-text)})
                               nil)})))))

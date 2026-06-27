(ns opencode.ui.files
  (:require [clojure.string :as string]
            [opencode.ui.config :as config]
            [opencode.ui.state :as S]))

(defn set-loading! [path]
  (swap! S/!state update :fs #(merge {:path path :entries [] :loading? true :error nil :loaded? false} %)))

(defn set-error! [msg]
  (swap! S/!state assoc :fs {:path (:path (:fs @S/!state))
                             :entries []
                             :loading? false
                             :error msg
                             :loaded? true}))

(defn set-entries! [path entries]
  (swap! S/!state assoc :fs {:path path
                             :entries entries
                             :loading? false
                             :error nil
                             :loaded? true}))

(defn fetch-files! [path]
  (let [encoded (js/encodeURIComponent path)]
    (set-loading! path)
    (let [xhr (js/XMLHttpRequest.)]
      (.open xhr "GET" (str (config/api-base) "/files?path=" encoded) true)
      (.setRequestHeader xhr "Accept" "application/json")
      (set! (.-onload xhr)
            (fn []
              (if (= (.-status xhr) 200)
                (let [data (js->clj (js/JSON.parse (.-responseText xhr)) :keywordize-keys true)]
                  (set-entries! (:path data) (:entries data))
                  (S/push-event! {:type :ui/fs-load
                                  :path (:path data)
                                  :count (count (:entries data))
                                  :ts (.now js/Date)}))
                (set-error! (.-statusText xhr)))))
      (set! (.-onerror xhr)
            (fn []
              (set-error! "Network error")
              (S/push-event! {:type :ui/fs-error
                              :path path
                              :ts (.now js/Date)})))
      (.send xhr))))

(defn go-parent! []
  (let [current (:path (:fs @S/!state))
        parent (if (or (nil? current) (= current "."))
                 "."
                 (let [segments (clojure.string/split current #"/")
                       trimmed (butlast segments)
                       p (clojure.string/join "/" trimmed)]
                   (if (seq p) p ".")))]
    (fetch-files! parent)))

(ns promethean.adapters.fs
  (:require [clojure.string :as str]))

(defn now-ms [] (.now js/Date))

(defn make-fs []
  ;; node built-ins + chokidar
  {:fsp (js/require "fs/promises")
   :path (js/require "path")
   :chokidar (js/require "chokidar")})

(defn read-file! [{:keys [fsp]} path]
  (-> (.readFile fsp path "utf8")
      (.then (fn [s] s))))

(defn write-file! [{:keys [fsp]} path content]
  (-> (.writeFile fsp path content "utf8")
      (.then (fn [_] {:ok true :path path}))))

(defn- emit! [world* evt]
  (swap! world* update :events-out conj evt))

(defn start-notes-watcher! [env world* notes-dir]
  (let [{:keys [chokidar]} (get-in env [:adapters :fs])
        watcher (.watch chokidar notes-dir (clj->js {:ignoreInitial true
                                                     :awaitWriteFinish true}))]
    (.on watcher "add"
         (fn [p]
           (emit! world*
                  {:event/id (str (random-uuid))
                   :event/ts (now-ms)
                   :event/type :fs.file/created
                   :event/source {:kind :fs}
                   :event/payload {:path (str p)}})))
    (.on watcher "change"
         (fn [p]
           (emit! world*
                  {:event/id (str (random-uuid))
                   :event/ts (now-ms)
                   :event/type :fs.file/modified
                   :event/source {:kind :fs}
                   :event/payload {:path (str p)}})))
    watcher))

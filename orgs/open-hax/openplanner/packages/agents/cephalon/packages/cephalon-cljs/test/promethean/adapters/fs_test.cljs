(ns promethean.adapters.fs-test
  (:require [cljs.test :refer-macros [deftest is testing async]]
            [promethean.adapters.fs :as fs]))

(deftest read-file-uses-utf8-test
  (async done
    (let [calls (atom [])
          env {:fsp (clj->js {:readFile (fn [_path encoding]
                                          (swap! calls conj encoding)
                                          (js/Promise.resolve "MOCK-DATA"))})}]
      (-> (fs/read-file! env "/tmp/file")
          (.then (fn [data]
                   (is (= ["utf8"] @calls))
                   (is (= "MOCK-DATA" data))
                   (done)))))))

(deftest write-file-returns-map-test
  (async done
    (let [calls (atom [])
          env {:fsp (clj->js {:writeFile (fn [_path content encoding]
                                           (swap! calls conj [content encoding])
                                           (js/Promise.resolve true))})}]
      (-> (fs/write-file! env "/tmp/new.txt" "hello")
          (.then (fn [res]
                   (is (= [["hello" "utf8"]] @calls))
                   (is (= {:ok true :path "/tmp/new.txt"} res))
                   (done)))))))

(deftest start-notes-watcher-emits-events-test
  (let [handlers (atom {})
        watcher (js-obj)
        _ (set! (.-on watcher)
                (fn [evt handler]
                  (swap! handlers assoc evt handler)
                  watcher))
        chokidar (clj->js {:watch (fn [_dir _opts] watcher)})
        world* (atom {:events-out []})
        env {:adapters {:fs {:chokidar chokidar}}}]
    (fs/start-notes-watcher! env world* "/notes")
    ((get @handlers "add") "/notes/file.md")
    ((get @handlers "change") "/notes/file.md")
    (let [events (:events-out @world*)]
      (is (= 2 (count events)))
      (is (= :fs.file/created (:event/type (first events))))
      (is (= :fs.file/modified (:event/type (second events)))))))

(ns my.opencode.entry-test
  (:require [cljs.test :as cljs.test :refer [deftest is async run-tests]]
            [my.opencode.entry :as entry]
            [my.opencode.nrepl :as nrepl]
            [my.opencode.perm :as perm]
            ["net" :as net]))

(defonce ^:private summary-hook-installed? (atom false))

(defn- install-summary-exit-hook! []
  (when-not @summary-hook-installed?
    (let [base-report cljs.test/report]
      (set! cljs.test/report
            (fn [m]
              (base-report m)
              (when (= :summary (:type m))
                (let [fail (:fail m 0)
                      error (:error m 0)]
                  (when (pos? (+ fail error))
                    (.exit js/process 1)))))))
    (reset! summary-hook-installed? true)))

(defn- normalize-result [value]
  (if (map? value)
    value
    (js->clj value :keywordize-keys true)))

(defn- b-str [s]
  (let [txt (if (string? s) s (str s))]
    (str (.-length (js/Buffer.from txt)) ":" txt)))

(declare b-val)

(defn- b-map [m]
  (let [pairs (->> m
                   (map (fn [[k v]] [(if (keyword? k) (name k) (str k)) v]))
                   (sort-by first))]
    (str "d"
         (apply str (map (fn [[k v]] (str (b-str k) (b-val v))) pairs))
         "e")))

(defn- b-val [v]
  (cond
    (string? v) (b-str v)
    (number? v) (str "i" v "e")
    (vector? v) (str "l" (apply str (map b-val v)) "e")
    (map? v) (b-map v)
    (nil? v) (b-str "")
    :else (b-str (str v))))

(defn- extract-id [encoded]
  (let [marker "2:id"
        start (.indexOf encoded marker)]
    (when (not= -1 start)
      (let [len-start (+ start (.-length marker))
            colon (.indexOf encoded ":" len-start)]
        (when (not= -1 colon)
          (let [id-len (js/parseInt (.slice encoded len-start colon) 10)
                id-start (inc colon)
                id-end (+ id-start id-len)]
            (when (and (not (js/isNaN id-len)) (<= id-end (.-length encoded)))
              (.slice encoded id-start id-end))))))))

(defn- install-net-mock! [mode]
  (let [orig (.-createConnection net)
        connect-opts (atom nil)
        handlers (atom {})
        writes (atom [])
        socket #js {}
        emit! (fn [payload]
                (when-let [on-data (get @handlers "data")]
                  (on-data (js/Buffer.from payload "utf8"))))]
    (letfn [(emit-buffer! [^js payload]
              (when-let [on-data (get @handlers "data")]
                (on-data payload)))
            (trigger! [event payload]
              (when-let [handler (get @handlers event)]
                (handler payload)))]
    (aset socket "on" (fn [event cb]
                         (swap! handlers assoc event cb)
                         socket))
    (aset socket "write" (fn [buffer]
                            (let [msg (.toString buffer "utf8")
                                  id (extract-id msg)]
                              (swap! writes conj msg)
                              (cond
                                (and id (not= -1 (.indexOf msg "clone")))
                                (case mode
                                  :chunked
                                  (js/setTimeout
                                   (fn []
                                     (let [payload (b-map {"id" id
                                                           "new-session" "sess-1"
                                                           "status" ["done"]})
                                           halfway (js/Math.floor (/ (.-length payload) 2))]
                                       (emit-buffer! (js/Buffer.from (.slice payload 0 halfway) "utf8"))
                                       (emit-buffer! (js/Buffer.from (.slice payload halfway) "utf8"))))
                                   0)

                                  (js/setTimeout
                                   (fn []
                                     (emit! (b-map {"id" id
                                                    "new-session" "sess-1"
                                                    "status" ["done"]})))
                                   0))

                                (and id (not= -1 (.indexOf msg "eval")) (= mode :ok))
                                (js/setTimeout
                                 (fn []
                                     (emit! (b-map {"id" id "out" "hello "}))
                                   (emit! (b-map {"id" id
                                                  "value" "3"
                                                  "ns" "user"
                                                   "session" "sess-1"
                                                   "status" ["done"]})))
                                  0)

                                (and id (not= -1 (.indexOf msg "eval")) (= mode :chunked))
                                (js/setTimeout
                                 (fn []
                                   (let [first-payload (b-map {"id" id "out" "chunk-"})
                                         second-payload (b-map {"id" id
                                                                "value" "9"
                                                                "ns" "user"
                                                                "session" "sess-1"
                                                                "status" ["done"]})]
                                     (emit-buffer! (js/Buffer.from first-payload "utf8"))
                                     (emit-buffer! (js/Buffer.from second-payload "utf8"))))
                                 0)

                                (and id (not= -1 (.indexOf msg "eval")) (= mode :ok-session))
                                (js/setTimeout
                                 (fn []
                                   (emit! (b-map {"id" id
                                                  "value" "42"
                                                  "ns" "custom.ns"
                                                  "session" "existing"
                                                  "status" ["done"]})))
                                 0)

                                (and id (not= -1 (.indexOf msg "eval")) (= mode :error))
                                (js/setTimeout
                                 (fn []
                                     (emit! (b-map {"id" id
                                                   "err" "boom"
                                                   "status" ["error" "done"]})))
                                  0)

                                (and id (not= -1 (.indexOf msg "eval")) (= mode :decode-error))
                                (js/setTimeout
                                 (fn []
                                   (emit-buffer! (js/Buffer.from "x" "utf8")))
                                 0)

                                (and id (not= -1 (.indexOf msg "eval")) (= mode :socket-error))
                                (js/setTimeout
                                 (fn []
                                   (trigger! "error" (js/Error. "socket failed")))
                                 0)

                                (and id (not= -1 (.indexOf msg "eval")) (= mode :close))
                                (js/setTimeout
                                 (fn []
                                   (trigger! "close" nil))
                                 0)

                                :else nil))))
    (aset socket "end" (fn [] nil))
    (set! (.-createConnection net)
          (fn [opts]
            (reset! connect-opts opts)
            socket))
    {:handlers handlers
     :opts connect-opts
     :writes writes
     :emit! emit!
     :emit-buffer! emit-buffer!
     :trigger! trigger!
     :restore! (fn [] (set! (.-createConnection net) orig))})))

(defn- trigger-connect! [net-mock]
  (when-let [on-connect (get @(-> net-mock :handlers) "connect")]
    (on-connect)))

(deftest eval-throws-when-port-missing
  (let [orig-port (aget (.-env js/process) "NREPL_PORT")]
    (aset (.-env js/process) "NREPL_PORT" "")
    (try
      (nrepl/eval! #js {:code "(+ 1 2)"} #js {})
      (is false "expected missing port error")
      (catch js/Error err
        (is (string? (.-message err))))
      (finally
        (if (some? orig-port)
          (aset (.-env js/process) "NREPL_PORT" orig-port)
          (js-delete (.-env js/process) "NREPL_PORT"))))))

(deftest plugin-requires-permission
  (async done
    (let [ctx #js {}]
      (-> (entry/MyPlugin ctx)
          (.then (fn [plugin]
                   (let [tool (aget (aget plugin "tool") "nrepl/eval")]
                     (.execute tool #js {:code "(+ 1 2)" :port 7888} ctx))))
          (.then (fn [_]
                   (is false "expected permission gate to fail")))
          (.then (fn [_] nil)
                 (fn [err]
                   (is (not= -1 (.indexOf (.-message err) "Permission required")))))
          (.then (fn [_] (done)))))))


(deftest plugin-evals-over-nrepl
  (async done
    (let [ctx #js {}
          key (perm/key-for {:kind :nrepl
                             :tool "nrepl/eval"
                             :detail "Evaluate Clojure code via nREPL"})
          net-mock (install-net-mock! :ok)]
      (-> (entry/MyPlugin ctx)
          (.then (fn [plugin]
                   (let [reply (aget plugin "permission.replied")
                         tool (aget (aget plugin "tool") "nrepl/eval")]
                     (reply #js {:key key :allow true})
                     (js/setTimeout (fn [] (trigger-connect! net-mock)) 0)
                     (.execute tool #js {:code "(+ 1 2)"
                                        :host "127.0.0.1"
                                        :port 7888
                                        :timeoutMs 1000}
                               ctx))))
          (.then (fn [result]
                   (let [r (normalize-result result)]
                     (is (= "3" (:value r)))
                     (is (= "hello " (:out r)))
                     (is (= "sess-1" (:session r)))
                     (is (some #(= "done" %) (:status r))))))
          (.then (fn [_] nil)
                 (fn [err]
                   (is false (str "nrepl eval failed: " err))))
          (.then (fn [_]
                   ((:restore! net-mock))
                   (done)))))))

(deftest plugin-surfaces-nrepl-errors
  (async done
    (let [ctx #js {}
          key (perm/key-for {:kind :nrepl
                             :tool "nrepl/eval"
                             :detail "Evaluate Clojure code via nREPL"})
          net-mock (install-net-mock! :error)]
      (-> (entry/MyPlugin ctx)
          (.then (fn [plugin]
                   (let [reply (aget plugin "permission.replied")
                         tool (aget (aget plugin "tool") "nrepl/eval")]
                     (reply #js {:key key :allow true})
                     (js/setTimeout (fn [] (trigger-connect! net-mock)) 0)
                     (.execute tool #js {:code "(+ 1 2)" :port 7888} ctx))))
          (.then (fn [_]
                   (is false "expected nrepl error")))
          (.then (fn [_] nil)
                 (fn [err]
                   (is (string? (.-message err)))))
          (.then (fn [_]
                   ((:restore! net-mock))
                   (done)))))))

(deftest eval-request-envelope-with-session-and-ns
  (async done
    (let [net-mock (install-net-mock! :ok-session)]
      (.then (nrepl/eval! #js {:code "(+ 40 2)"
                               :host "1.2.3.4"
                               :port 9100
                               :session "existing"
                               :ns "custom.ns"
                               :timeoutMs 1000}
                          #js {})
             (fn [result]
               (let [r (normalize-result result)
                     writes @(:writes net-mock)
                     opts @(:opts net-mock)]
                 (is (= 1 (count writes)))
                 (is (not= -1 (.indexOf (first writes) "2:op4:eval")))
                 (is (= -1 (.indexOf (first writes) "5:clone")))
                 (is (not= -1 (.indexOf (first writes) "7:session8:existing")))
                 (is (not= -1 (.indexOf (first writes) "2:ns9:custom.ns")))
                 (is (= "1.2.3.4" (aget opts "host")))
                 (is (= 9100 (aget opts "port")))
                 (is (= "42" (:value r))))
               ((:restore! net-mock))
               (done))
             (fn [err]
               (is false (str "expected session eval success: " err))
               ((:restore! net-mock))
               (done)))
      (js/setTimeout
       (fn []
         (trigger-connect! net-mock))
       0))))

(deftest eval-parses-chunked-responses
  (async done
    (let [net-mock (install-net-mock! :chunked)]
      (.then (nrepl/eval! #js {:code "(+ 4 5)"
                               :host "127.0.0.1"
                               :port 7888
                               :timeoutMs 1000}
                          #js {})
             (fn [result]
               (let [r (normalize-result result)
                     writes @(:writes net-mock)]
                 (is (= 2 (count writes)))
                 (is (not= -1 (.indexOf (first writes) "5:clone")))
                 (is (not= -1 (.indexOf (second writes) "2:op4:eval")))
                 (is (= "9" (:value r)))
                 (is (= "chunk-" (:out r)))
                 (is (some #(= "done" %) (:status r))))
               ((:restore! net-mock))
               (done))
             (fn [err]
               (is false (str "expected chunked decode success: " err))
               ((:restore! net-mock))
               (done)))
      (js/setTimeout (fn [] (trigger-connect! net-mock)) 0))))

(deftest eval-times-out-without-replies
  (async done
    (let [net-mock (install-net-mock! :timeout)]
      (.then (nrepl/eval! #js {:code "(+ 1 2)"
                               :session "existing"
                               :host "127.0.0.1"
                               :port 7888
                               :timeoutMs 5}
                          #js {})
             (fn [_]
               (is false "expected timeout")
               ((:restore! net-mock))
               (done))
             (fn [err]
               (is (not= -1 (.indexOf (.-message err) "timed out")))
               ((:restore! net-mock))
               (done)))
      (js/setTimeout (fn [] (trigger-connect! net-mock)) 0))))

(deftest eval-surfaces-socket-errors
  (async done
    (let [net-mock (install-net-mock! :socket-error)]
      (.then (nrepl/eval! #js {:code "(+ 1 2)"
                               :session "existing"
                               :host "127.0.0.1"
                               :port 7888
                               :timeoutMs 1000}
                          #js {})
             (fn [_]
               (is false "expected socket error")
               ((:restore! net-mock))
               (done))
             (fn [err]
               (is (= "socket failed" (.-message err)))
               ((:restore! net-mock))
               (done)))
      (js/setTimeout (fn [] (trigger-connect! net-mock)) 0))))

(deftest eval-surfaces-closed-connection
  (async done
    (let [net-mock (install-net-mock! :close)]
      (.then (nrepl/eval! #js {:code "(+ 1 2)"
                               :session "existing"
                               :host "127.0.0.1"
                               :port 7888
                               :timeoutMs 1000}
                          #js {})
             (fn [_]
               (is false "expected close error")
               ((:restore! net-mock))
               (done))
             (fn [err]
               (is (not= -1 (.indexOf (.-message err) "connection closed")))
               ((:restore! net-mock))
               (done)))
      (js/setTimeout (fn [] (trigger-connect! net-mock)) 0))))

(deftest eval-surfaces-decode-errors
  (async done
    (let [net-mock (install-net-mock! :decode-error)]
      (.then (nrepl/eval! #js {:code "(+ 1 2)"
                               :session "existing"
                               :host "127.0.0.1"
                               :port 7888
                               :timeoutMs 1000}
                          #js {})
             (fn [_]
               (is false "expected decode error")
               ((:restore! net-mock))
               (done))
             (fn [err]
               (is (not= -1 (.indexOf (.-message err) "invalid bencode prefix")))
               ((:restore! net-mock))
               (done)))
      (js/setTimeout (fn [] (trigger-connect! net-mock)) 0))))

(defn -main []
  (install-summary-exit-hook!)
  (run-tests 'my.opencode.entry-test))

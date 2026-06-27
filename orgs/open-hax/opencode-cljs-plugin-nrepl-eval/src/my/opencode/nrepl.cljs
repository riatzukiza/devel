(ns my.opencode.nrepl
  (:require ["net" :as net]))

(defn ^:private key->str [k]
  (cond
    (string? k) k
    (keyword? k) (name k)
    :else (str k)))

(defn ^:private stringify-keys [m]
  (reduce-kv
   (fn [acc k v]
     (if (nil? v)
       acc
       (assoc acc (key->str k) v)))
   {}
   (or m {})))

(defn ^:private encode-str [s]
  (let [text (cond
               (string? s) s
               (keyword? s) (name s)
               :else (str s))
        buf (js/Buffer.from text)]
    (str (.-length buf) ":" text)))

(defn ^:private encode-val [v]
  (cond
    (string? v) (encode-str v)
    (keyword? v) (encode-str (name v))
    (number? v) (str "i" v "e")
    (map? v) (let [entries (->> v
                                stringify-keys
                                (map (fn [[k vv]] [k vv]))
                                (sort-by first))]
               (str "d"
                    (apply str (map (fn [[k vv]]
                                      (str (encode-str k) (encode-val vv)))
                                    entries))
                    "e"))
    (sequential? v) (str "l" (apply str (map encode-val v)) "e")
    (nil? v) (encode-str "")
    :else (encode-str (str v))))

(defn ^:private encode-msg [m]
  (js/Buffer.from (encode-val (stringify-keys m))))

(defn ^:private byte-at [^js buf idx]
  (aget buf idx))

(defn ^:private digit-byte? [b]
  (and (<= 48 b) (<= b 57)))

(defn ^:private find-byte [^js buf start target]
  (let [len (.-length buf)]
    (loop [i start]
      (when (< i len)
        (if (= (byte-at buf i) target)
          i
          (recur (inc i)))))))

(defn ^:private decode-str
  [^js buf offset]
  (let [len (.-length buf)
        colon (find-byte buf offset 58)]
    (cond
      (nil? colon) {:incomplete true}
      (>= colon len) {:incomplete true}
      :else
      (let [len-str (.toString buf "utf8" offset colon)
            n (js/parseInt len-str 10)
            start (inc colon)
            end (+ start n)]
        (cond
          (or (js/isNaN n) (neg? n)) {:error "invalid string length"}
          (> end len) {:incomplete true}
          :else {:value (.toString buf "utf8" start end)
                 :offset end})))))

(defn ^:private decode-int
  [^js buf offset]
  (let [end (find-byte buf offset 101)]
    (if (nil? end)
      {:incomplete true}
      (let [s (.toString buf "utf8" offset end)
            n (js/parseInt s 10)]
        (if (js/isNaN n)
          {:error "invalid integer"}
          {:value n :offset (inc end)})))))

(declare decode-next)

(defn ^:private decode-list
  [^js buf offset]
  (let [len (.-length buf)]
    (loop [idx offset items []]
      (cond
        (>= idx len) {:incomplete true}
        (= (byte-at buf idx) 101) {:value items :offset (inc idx)}
        :else
        (let [res (decode-next buf idx)]
          (cond
            (:incomplete res) res
            (:error res) res
            :else (recur (:offset res) (conj items (:value res)))))))))

(defn ^:private decode-dict
  [^js buf offset]
  (let [len (.-length buf)]
    (loop [idx offset m {}]
      (cond
        (>= idx len) {:incomplete true}
        (= (byte-at buf idx) 101) {:value m :offset (inc idx)}
        :else
        (let [kres (decode-next buf idx)]
          (cond
            (:incomplete kres) kres
            (:error kres) kres
            :else
            (let [vstart (:offset kres)
                  vres (decode-next buf vstart)]
              (cond
                (:incomplete vres) vres
                (:error vres) vres
                :else (recur (:offset vres) (assoc m (str (:value kres)) (:value vres)))))))))))

(defn ^:private decode-next
  [^js buf offset]
  (let [len (.-length buf)]
    (when (< offset len)
      (let [b (byte-at buf offset)]
        (cond
          (= b 105) (decode-int buf (inc offset))
          (= b 108) (decode-list buf (inc offset))
          (= b 100) (decode-dict buf (inc offset))
          (digit-byte? b) (decode-str buf offset)
          :else {:error "invalid bencode prefix"})))))

(defn ^:private decode-messages
  [^js buf]
  (let [len (.-length buf)]
    (loop [offset 0 messages []]
      (if (>= offset len)
        {:messages messages :rest (js/Buffer.alloc 0)}
        (let [res (decode-next buf offset)]
          (cond
            (nil? res) {:messages messages :rest (.slice buf offset)}
            (:incomplete res) {:messages messages :rest (.slice buf offset)}
            (:error res) {:error (:error res) :messages messages :rest (.slice buf offset)}
            :else (recur (:offset res) (conj messages (:value res)))))))))

(defn ^:private env-val [k]
  (when-let [v (.. js/process -env (aget k))]
    (str v)))

(defn ^:private parse-int-safe [v]
  (when (some? v)
    (let [n (js/parseInt (str v) 10)]
      (when-not (js/isNaN n) n))))

(defn ^:private normalize-args [^js args]
  (let [host (or (.-host args) (env-val "NREPL_HOST") "127.0.0.1")
        port (or (.-port args) (parse-int-safe (env-val "NREPL_PORT")))
        code (.-code args)
        session (.-session args)
        ns (.-ns args)
        timeout-ms (or (.-timeoutMs args) 8000)]
    (when-not code
      (throw (js/Error. "code is required")))
    (when-not port
      (throw (js/Error. "port is required (or set NREPL_PORT)")))
    {:host host
     :port port
     :code (str code)
     :session session
     :ns ns
     :timeout-ms timeout-ms}))

(defn ^:private status-items [status]
  (cond
    (string? status) [status]
    (sequential? status) status
    :else []))

(defn ^:private status-done? [resp]
  (some #{"done"} (status-items (get resp "status"))))

(defn ^:private status-error? [resp]
  (some #{"error"} (status-items (get resp "status"))))

(defn ^:private merge-status [responses]
  (->> responses
       (map #(status-items (get % "status")))
       (apply concat)
       (distinct)
       (vec)))

(defn ^:private merge-output [responses k]
  (->> responses
       (map #(get % k))
       (remove nil?)
       (apply str)))

(defn ^:private merge-responses [responses]
  (let [values (->> responses (map #(get % "value")) (remove nil?))
        ns-val (->> responses (map #(get % "ns")) (remove nil?) (last))
        sess (->> responses (map #(get % "session")) (remove nil?) (last))]
    {:status (merge-status responses)
     :value (last values)
     :out (merge-output responses "out")
     :err (merge-output responses "err")
     :ns ns-val
     :session sess
     :responses responses}))

(defn ^:private error-message [responses]
  (or (->> responses (map #(get % "ex")) (remove nil?) (last))
      (->> responses (map #(get % "err")) (remove nil?) (last))
      "nREPL eval failed"))

(defn eval!
  [^js args _ctx]
  (let [{:keys [host port code session ns timeout-ms]} (normalize-args args)]
    (js/Promise.
     (fn [resolve reject]
       (let [socket (.createConnection net #js {:host host :port port})
             buffer (atom (js/Buffer.alloc 0))
             done? (atom false)
             session-id (atom session)
             eval-id (str (random-uuid))
             clone-id (str (random-uuid))
             responses (atom [])
             timer (atom nil)
             finish! (fn [err result]
                       (when-not @done?
                         (reset! done? true)
                         (when @timer (js/clearTimeout @timer))
                         (.end socket)
                         (if err
                           (reject err)
                           (resolve result))))
             send! (fn [msg]
                     (.write socket (encode-msg msg)))
             start-timeout! (fn []
                              (reset! timer
                                      (js/setTimeout
                                       (fn []
                                         (finish! (js/Error. "nREPL eval timed out") nil))
                                       timeout-ms)))
             send-eval! (fn []
                          (let [msg (cond-> {"id" eval-id
                                             "op" "eval"
                                             "code" code
                                             "session" @session-id}
                                      ns (assoc "ns" ns))]
                            (send! msg)))
             handle-msg (fn [msg]
                          (let [id (get msg "id")]
                            (cond
                              (= id clone-id)
                              (when (status-done? msg)
                                (when-let [new-sess (get msg "new-session")]
                                  (reset! session-id new-sess))
                                (send-eval!))

                              (= id eval-id)
                              (do
                                (swap! responses conj msg)
                                (when (status-error? msg)
                                  (finish! (js/Error. (error-message @responses)) nil))
                                (when (status-done? msg)
                                  (finish! nil (merge-responses @responses))))

                              :else nil)))
             on-data (fn [chunk]
                       (reset! buffer (js/Buffer.concat (clj->js [@buffer chunk])))
                       (let [decoded (decode-messages @buffer)]
                         (reset! buffer (:rest decoded))
                         (doseq [m (:messages decoded)]
                           (handle-msg m))
                         (when (:error decoded)
                           (finish! (js/Error. (:error decoded)) nil))))]
        (.on socket "data" on-data)
        (.on socket "error" (fn [err] (finish! err nil)))
        (.on socket "close" (fn []
                               (when-not @done?
                                 (finish! (js/Error. "nREPL connection closed") nil))))
        (.on socket "connect" (fn []
                                 (start-timeout!)
                                 (if @session-id
                                   (send-eval!)
                                   (send! {"id" clone-id "op" "clone"})))))))))

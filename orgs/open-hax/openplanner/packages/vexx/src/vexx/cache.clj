(ns vexx.cache
  (:import [java.nio ByteBuffer ByteOrder]
           [java.security MessageDigest]
           [java.util LinkedHashMap]))

(defonce ^:private pair-cache-state (atom {:max-entries nil
                                           :store nil}))

(defn- bytes->hex
  [^bytes input]
  (apply str (map #(format "%02x" (bit-and % 0xff)) input)))

(defn- sha256-hex
  [^bytes input]
  (let [digest (MessageDigest/getInstance "SHA-256")]
    (.update digest input)
    (bytes->hex (.digest digest))))

(defn vector-hash
  [values]
  (let [buffer (doto (ByteBuffer/allocate (* 4 (count values)))
                 (.order ByteOrder/LITTLE_ENDIAN))]
    (doseq [value values]
      (.putFloat buffer (float (double value))))
    (sha256-hex (.array buffer))))

(defn- pair-key
  [left right]
  (let [left-hash (vector-hash left)
        right-hash (vector-hash right)]
    (if (neg? (.compareTo ^String left-hash ^String right-hash))
      (str left-hash "||" right-hash)
      (str right-hash "||" left-hash))))

(defn- create-store
  [max-entries]
  (proxy [LinkedHashMap] [16 0.75 true]
    (removeEldestEntry [eldest]
      (> (.size ^LinkedHashMap this) (int max-entries)))))

(defn- ensure-store!
  [config]
  (let [max-entries (max 1024 (int (or (:pair-cache-max-entries config) 200000)))]
    (or (when (= max-entries (:max-entries @pair-cache-state))
          (:store @pair-cache-state))
        (let [store (create-store max-entries)]
          (reset! pair-cache-state {:max-entries max-entries
                                    :store store})
          store))))

(defn pair-cache-size
  [config]
  (let [^LinkedHashMap store (ensure-store! config)]
    (locking store
      (.size store))))

(defn get-pair
  [config left right]
  (let [^LinkedHashMap store (ensure-store! config)
        key (pair-key left right)]
    (locking store
      (when (.containsKey store key)
        (.get store key)))))

(defn put-pair!
  [config left right score]
  (let [^LinkedHashMap store (ensure-store! config)
        key (pair-key left right)
        safe-score (double score)]
    (locking store
      (.put store key safe-score))
    safe-score))

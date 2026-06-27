(ns vexx.config
  (:require [clojure.java.io :as io]
            [clojure.string :as str]))

(defn- env
  [name fallback]
  (let [value (some-> (System/getenv name) str/trim)]
    (if (seq value) value fallback)))

(defn- env-int
  [name fallback]
  (try
    (let [raw (env name nil)
          parsed (some-> raw Integer/parseInt)]
      (if (and (number? parsed) (pos? parsed)) parsed fallback))
    (catch Throwable _
      fallback)))

(defn- env-bool
  [name fallback]
  (let [raw (some-> (System/getenv name) str/trim str/lower-case)]
    (cond
      (nil? raw) fallback
      (#{"1" "true" "yes" "on"} raw) true
      (#{"0" "false" "no" "off"} raw) false
      :else fallback)))

(defn- normalize-device
  [value]
  (let [device (-> (str value) str/trim str/upper-case)]
    (if (#{"AUTO" "CPU" "GPU" "NPU"} device) device "AUTO")))

(defn- resolve-first-existing
  [candidates]
  (some (fn [path]
          (let [file (.getCanonicalFile (io/file path))]
            (when (.exists file)
              (.getPath file))))
        candidates))

(defn- default-cosine-model-path
  []
  (resolve-first-existing
   ["models/cosine_matrix_dynamic.onnx"
    "../models/cosine_matrix_dynamic.onnx"]))

(defn- default-native-lib-path
  []
  (resolve-first-existing
   ["native/lib/libvexx_cosine.so"
    "../native/lib/libvexx_cosine.so"]))

(defn config
  []
  {:host (env "VEXX_HOST" "127.0.0.1")
   :port (env-int "VEXX_PORT" 8788)
   :api-key (some-> (env "VEXX_API_KEY" "") not-empty)
   :default-device (normalize-device (env "VEXX_DEVICE" "AUTO"))
   :auto-order (->> (str/split (env "VEXX_AUTO_ORDER" "GPU,NPU,CPU") #",")
                    (map normalize-device)
                    (filter #(#{"CPU" "GPU" "NPU"} %))
                    distinct
                    vec)
   :require-accel (env-bool "VEXX_REQUIRE_ACCEL" false)
   :pair-cache-max-entries (env-int "VEXX_PAIR_CACHE_MAX_ENTRIES" 200000)
   :cuda-device-id (env-int "VEXX_CUDA_DEVICE_ID" 0)
   :native-lib-path (or (some-> (env "VEXX_NATIVE_LIB_PATH" "") not-empty)
                        (default-native-lib-path))
   :cosine-matrix-model-path (or (some-> (env "VEXX_COSINE_MATRIX_MODEL_PATH" "") not-empty)
                                  (default-cosine-model-path))})

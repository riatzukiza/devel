(ns vexx.native
  (:require [clojure.java.io :as io])
  (:import [com.sun.jna Function NativeLibrary Pointer]))

(defonce ^:private library-cache (atom {}))
(defonce ^:private runtime-cache (atom {}))

(defn- pointer-null?
  [^Pointer pointer]
  (or (nil? pointer)
      (zero? (Pointer/nativeValue pointer))))

(defn- load-library
  [lib-path]
  (or (get @library-cache lib-path)
      (let [file (.getCanonicalFile (io/file lib-path))
            _ (when-not (.exists file)
                (throw (ex-info "native_library_missing" {:path (.getPath file)})))
            lib (NativeLibrary/getInstance (.getPath file))]
        (swap! library-cache assoc lib-path lib)
        lib)))

(defn- function-of
  [^NativeLibrary lib name]
  (.getFunction lib name))

(defn- invoke-pointer
  [^NativeLibrary lib name args]
  (let [^Function function (function-of lib name)]
    (.invoke function Pointer (object-array args))))

(defn- invoke-int
  [^NativeLibrary lib name args]
  (let [^Function function (function-of lib name)]
    (.invokeInt function (object-array args))))

(defn- invoke-string
  [^NativeLibrary lib name args]
  (let [^Function function (function-of lib name)]
    (.invokeString function (object-array args) false)))

(defn- runtime-key
  [config device]
  [(:native-lib-path config) (:cosine-matrix-model-path config) device (:cuda-device-id config)])

(defn- create-runtime
  [config device]
  (let [lib-path (:native-lib-path config)
        model-path (:cosine-matrix-model-path config)
        lib (load-library lib-path)
        handle (invoke-pointer lib "vexx_runtime_create" [model-path device (int (:cuda-device-id config))])]
    (when (pointer-null? handle)
      (throw (ex-info "native_runtime_create_failed" {:device device :model-path model-path :lib-path lib-path})))
    {:lib lib
     :handle handle}))

(defn- runtime-entry
  [config device]
  (let [key (runtime-key config device)]
    (or (get @runtime-cache key)
        (let [entry (create-runtime config device)]
          (swap! runtime-cache assoc key entry)
          entry))))

(defn- rows->float-array
  [rows]
  (float-array (mapcat identity rows)))

(defn- runtime-string
  [lib handle function-name]
  (or (invoke-string lib function-name [handle]) ""))

(defn cosine-matrix
  [config {:keys [left right device]}]
  (let [{:keys [lib handle]} (runtime-entry config device)
        ready? (pos? (invoke-int lib "vexx_runtime_ready" [handle]))]
    (when-not ready?
      (throw (ex-info (or (runtime-string lib handle "vexx_runtime_last_error")
                          "native_runtime_unavailable")
                      {:device device
                       :provider (runtime-string lib handle "vexx_runtime_provider")
                       :model-path (runtime-string lib handle "vexx_runtime_model_path")})))
    (let [row-count (count left)
          col-count (count right)
          dim (count (first left))
          left-array (rows->float-array left)
          right-array (rows->float-array right)
          out-array (float-array (* row-count col-count))
          ok? (pos? (invoke-int lib "vexx_runtime_compute"
                                [handle
                                 left-array
                                 (int row-count)
                                 right-array
                                 (int col-count)
                                 (int dim)
                                 out-array]))]
      (when-not ok?
        (throw (ex-info (or (runtime-string lib handle "vexx_runtime_last_error")
                            "native_compute_failed")
                        {:device device
                         :provider (runtime-string lib handle "vexx_runtime_provider")
                         :model-path (runtime-string lib handle "vexx_runtime_model_path")})))
      {:device (runtime-string lib handle "vexx_runtime_device")
       :provider (runtime-string lib handle "vexx_runtime_provider")
       :model-path (runtime-string lib handle "vexx_runtime_model_path")
       :rows row-count
       :cols col-count
       :matrix (mapv double out-array)})))

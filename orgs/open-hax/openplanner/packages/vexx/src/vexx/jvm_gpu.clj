(ns vexx.jvm-gpu
  (:import [ai.onnxruntime OnnxTensor OrtEnvironment OrtSession OrtSession$SessionOptions]
           [java.util HashMap]))

(defonce ^:private ort-env
  (delay (OrtEnvironment/getEnvironment "vexx-gpu")))

(defonce ^:private session-cache (atom {}))

(defn- rows->float-matrix
  [rows]
  (let [row-count (count rows)
        col-count (count (first rows))
        matrix (make-array Float/TYPE row-count col-count)]
    (dotimes [row-index row-count]
      (let [^floats row-array (aget matrix row-index)
            row (nth rows row-index)]
        (dotimes [col-index col-count]
          (aset-float row-array col-index (float (double (nth row col-index)))))))
    matrix))

(defn- flatten-numbers
  [value]
  (cond
    (nil? value) []
    (.isArray (class value)) (mapcat flatten-numbers (seq value))
    (sequential? value) (mapcat flatten-numbers value)
    (number? value) [(double value)]
    :else []))

(defn- pick-input-name
  [names preferred fallback]
  (or (some #(when (= preferred %) %) names)
      (first names)
      fallback))

(defn- create-session-entry
  [config]
  (let [model-path (:cosine-matrix-model-path config)]
    (when-not model-path
      (throw (ex-info "cosine_model_missing" {:device "GPU"})))
    (let [^OrtSession$SessionOptions session-options (OrtSession$SessionOptions.)]
      (try
        (.addCUDA session-options (int (:cuda-device-id config)))
        (let [session (.createSession ^OrtEnvironment @ort-env model-path session-options)
              input-names (vec (map str (.getInputNames session)))
              output-names (vec (map str (.getOutputNames session)))]
          {:session session
           :input-left (pick-input-name input-names "left" "left")
           :input-right (pick-input-name input-names "right" "right")
           :output (or (some #(when (= "scores" %) %) output-names)
                       (first output-names)
                       "scores")
           :model-path model-path})
        (finally
          (.close session-options))))))

(defn- session-entry
  [config]
  (let [cache-key [(:cuda-device-id config) (:cosine-matrix-model-path config)]]
    (or (get @session-cache cache-key)
        (let [entry (create-session-entry config)]
          (swap! session-cache assoc cache-key entry)
          entry))))

(defn cosine-matrix
  [config {:keys [left right]}]
  (let [{:keys [session input-left input-right output model-path]} (session-entry config)
        inputs (HashMap.)
        left-array (rows->float-matrix left)
        right-array (rows->float-matrix right)]
    (with-open [left-tensor (OnnxTensor/createTensor ^OrtEnvironment @ort-env left-array)
                right-tensor (OnnxTensor/createTensor ^OrtEnvironment @ort-env right-array)]
      (.put inputs input-left left-tensor)
      (.put inputs input-right right-tensor)
      (with-open [result (.run ^OrtSession session inputs)]
        (let [value (.getValue (.get result 0))
              flat (vec (flatten-numbers value))]
          {:device "GPU"
           :provider "CUDAExecutionProvider"
           :model-path model-path
           :rows (count left)
           :cols (count right)
           :matrix flat})))))

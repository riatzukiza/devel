(ns vexx.slab
  (:import [java.nio.channels FileChannel FileChannel$MapMode]
           [java.nio.file Files Paths StandardOpenOption LinkOption]
           [java.nio ByteOrder]
           [java.security MessageDigest])
  (:require [vexx.ort :as ort]))

(defonce ^:private registry (atom {}))

(defn- bytes->hex [^bytes input]
  (apply str (map #(format "%02x" (bit-and % 0xff)) input)))

(defn- sha256-hex [^bytes input]
  (let [digest (MessageDigest/getInstance "SHA-256")]
    (.update digest input)
    (bytes->hex (.digest digest))))

(defn- validate-slab-file
  [^java.nio.file.Path file dims]
  (when-not (Files/exists file (into-array LinkOption []))
    (throw (ex-info "slab_file_not_found" {:path (.toString file)})))
  (let [size (Files/size file)
        row-bytes (* dims 4)
        _ (when (zero? size)
            (throw (ex-info "slab_file_empty" {:path (.toString file)})))
        _ (when (neg? (mod size row-bytes))
            (throw (ex-info "slab_file_size_mismatch"
                            {:path (.toString file)
                             :size size
                             :dims dims
                             :expected-multiple row-bytes})))]
    size))

(defrecord Slab
  [^String id path ^ints dims ^long row-count ^long file-size
   ^java.nio.MappedByteBuffer buffer ^long created-at])

(defn register
  "Memory-map a float32 slab file and register it.
   path: absolute or relative path to the float32 binary slab
   dims: number of float32 dimensions per row
   Returns a map with :slab-id and :metadata."
  [path dims]
  (let [canonical-path (.toAbsolutePath (Paths/get path (make-array String 0)))
        canonical-str (.toString canonical-path)
        dims-int (int dims)
        file-size (validate-slab-file canonical-path dims-int)
        row-count (long (/ file-size (* dims-int 4)))
        id (sha256-hex (.getBytes (str canonical-str ":" dims-int ":" row-count)))]
    (when-not (nil? (get @registry id))
      {:slab-id id
       :already-registered true
       :path canonical-str
       :dims dims-int
       :row-count row-count})
    (let [channel (FileChannel/open canonical-path (into-array StandardOpenOption [StandardOpenOption/READ]))
          buffer (-> (.map channel FileChannel$MapMode/READ_ONLY 0 file-size)
                     (.order ByteOrder/LITTLE_ENDIAN))
          _ (.close channel)
          slab (->Slab id canonical-str (int-array [dims-int]) row-count file-size
                       buffer (System/nanoTime))]
      (swap! registry assoc id slab)
      {:slab-id id
       :already-registered false
       :path canonical-str
       :dims dims-int
       :row-count row-count
       :file-size file-size})))

(defn get-slab [^String slab-id]
  (get @registry slab-id))

(defn list-slabs []
  (->> @registry
       (mapv (fn [[id ^Slab slab]]
               {:slab-id id
                :path (:path slab)
                :dims (aget ^ints (:dims slab) 0)
                :row-count (:row-count slab)
                :file-size (:file-size slab)
                :created-at (:created-at slab)}))))

(defn unregister [^String slab-id]
  (when-let [^Slab slab (get @registry slab-id)]
    (.force (:buffer slab))
    (swap! registry dissoc slab-id)
    {:slab-id slab-id :unregistered true}))

(defn- read-row [^java.nio.MappedByteBuffer buffer dims-int ^long row-index]
  (let [offset (* row-index dims-int)
        out (float-array dims-int)]
    (loop [i 0]
      (when (< i dims-int)
        (.position buffer (* (+ offset i) 4))
        (aset out i (.getFloat buffer))
        (recur (inc i))))
    out))

(defn read-rows
  "Read multiple rows from a slab as float[][].
   offsets: sequence of row indices (0-based)."
  [^String slab-id offsets]
  (when-let [^Slab slab (get @registry slab-id)]
    (let [dims-int (aget ^ints (:dims slab) 0)
          buf (:buffer slab)]
      (mapv #(read-row buf dims-int %) (long-array offsets)))))

(defn cosine-topk-by-slab
  "Compute cosine similarity between a query row and candidate rows from a slab,
   return top-k results sorted by score descending."
  [config {:keys [slab-id query-offset candidate-offsets k device]}]
  (when-let [^Slab slab (get @registry slab-id)]
    (let [dims-int (aget ^ints (:dims slab) 0)
          _ (when (>= query-offset (:row-count slab))
              (throw (ex-info "slab_query_offset_oob"
                              {:slab-id slab-id
                               :query-offset query-offset
                               :row-count (:row-count slab)})))
          _ (when (some #(>= % (:row-count slab)) candidate-offsets)
              (throw (ex-info "slab_candidate_offset_oob"
                              {:slab-id slab-id
                               :candidate-offsets candidate-offsets
                               :row-count (:row-count slab)})))
          query-row (read-row (:buffer slab) dims-int (long query-offset))
          candidate-rows (read-rows slab-id candidate-offsets)
          k-val (long (or k 10))]
      (when (empty? candidate-rows)
        {:slab-id slab-id
         :query-offset query-offset
         :dims dims-int
         :matches []
         :provider "slab"})
      (let [result (ort/cosine-matrix config {:left [query-row]
                                              :right candidate-rows
                                              :device device})
            matrix (:matrix result)
            matches (->> candidate-offsets
                        (map-indexed (fn [idx offset]
                                       {:offset offset
                                        :score (double (nth matrix idx))}))
                        (filter #(Double/isFinite (double (:score %))))
                        (sort-by (fn [{:keys [score offset]}] [(- score) offset]))
                        (take k-val)
                        vec)]
        {:slab-id slab-id
         :query-offset query-offset
         :dims dims-int
         :matches matches
         :device (:device result)
         :provider (:provider result)}))))

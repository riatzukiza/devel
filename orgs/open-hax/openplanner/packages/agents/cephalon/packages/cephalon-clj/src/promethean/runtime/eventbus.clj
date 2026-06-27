(ns promethean.runtime.eventbus
  (:require [clojure.core.async :as a]
            [promethean.contracts.event-envelope :as env]
            [promethean.util.ids :as ids]
            [promethean.util.time :as t]))

(def ^:private +default-boundary-package+ "cephalon-clj")

(defn make-bus
  ([] (make-bus 4096))
  ([buffer-size]
   {:bus/id (ids/uuid)
    :bus/in (a/chan buffer-size)
    :bus/subs (atom {})
    :bus/running? (atom false)}))

(defn emit! [bus ev]
  (a/put! (:bus/in bus) (assoc ev :event/at (or (:event/at ev) (t/now-inst)))))

(defn emit-boundary!
  ([bus envelope]
   (emit-boundary! bus envelope {}))
  ([bus envelope opts]
   (let [normalized (env/normalize-boundary-envelope envelope
                                                     (merge {:package-name +default-boundary-package+}
                                                            opts))
         event (env/from-boundary-envelope normalized)]
     (emit! bus event)
     normalized)))

(defn subscribe!
  ([bus pred] (subscribe! bus pred 256))
  ([bus pred buffer-size]
   (let [sub-id (ids/uuid)
         ch (a/chan buffer-size)]
     (swap! (:bus/subs bus) assoc sub-id {:pred pred :ch ch})
     {:sub/id sub-id :ch ch})))

(defn subscribe-boundary!
  ([bus]
   (subscribe-boundary! bus (constantly true) 256 {}))
  ([bus pred]
   (subscribe-boundary! bus pred 256 {}))
  ([bus pred buffer-size]
   (subscribe-boundary! bus pred buffer-size {}))
  ([bus pred buffer-size opts]
   (let [{internal-ch :ch sub-id :sub/id :as internal-sub}
         (subscribe! bus (constantly true) buffer-size)
         out (a/chan buffer-size)
         normalize-opts (merge {:package-name +default-boundary-package+} opts)]
     (a/go-loop []
       (when-let [event (a/<! internal-ch)]
         (let [envelope (env/to-boundary-envelope event normalize-opts)]
           (when (try (pred envelope) (catch Throwable _ false))
             (a/>! out envelope))
           (recur))))
     {:sub/id sub-id
      :internal-sub internal-sub
      :ch out})))

(defn start-dispatcher! [bus]
  (when (compare-and-set! (:bus/running? bus) false true)
    (a/go-loop []
      (when-let [ev (a/<! (:bus/in bus))]
        (doseq [[_ {:keys [pred ch]}] @(:bus/subs bus)]
          (when (try (pred ev) (catch Throwable _ false))
            (a/put! ch ev)))
        (recur))))
  bus)

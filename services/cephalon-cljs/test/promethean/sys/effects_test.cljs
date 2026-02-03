(ns promethean.sys.effects-test
  (:require [cljs.test :refer-macros [deftest is async]]
            [promethean.sys.effects :as effects]))

(deftest sys-effects-flush-runs-fs-read
  (async done
    (let [world* (atom {:effects/pending {}
                        :effects/stats {}
                        :events-out []})
          fsp (clj->js {:readFile (fn [_path _encoding]
                                   (js/Promise.resolve "ok"))})
          w {:env {:runtime {:world* world*}
                   :config {:runtime {:effects {:max-inflight 1 :timeout-ms 1000 :retain-completed 10}}}
                   :adapters {:fs {:fsp fsp}}}
             :effects [{:effect/id "eff-1" :effect/type :fs/read :path "/tmp/file"}]}
          _ (effects/sys-effects-flush w)]
      (js/setTimeout
        (fn []
          (let [evt (first (:events-out @world*))]
            (is (= :fs.read.result (:event/type evt)))
            (is (= "eff-1" (get-in evt [:event/payload :effect-id]))))
          (done))
        0))))

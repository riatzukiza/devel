(ns my.opencode.entry-test
  (:require [cljs.test :refer [deftest is async run-tests]]
            [my.opencode.delims :as delims]
            [my.opencode.entry :as entry]
            [my.opencode.perm :as perm]))

(defn- normalize-result [value]
  (if (map? value)
    value
    (js->clj value :keywordize-keys true)))

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

(defn- execute-tool [ctx args]
  (-> (entry/MyPlugin ctx)
      (.then (fn [plugin]
               (let [tool (aget (aget plugin "tool") "delim/auto-fix")]
                 (.execute tool args ctx))))))

(defn- allow-tool! [plugin allow]
  (let [reply (aget plugin "permission.replied")
        key (perm/key-for {:kind :delim
                           :tool "delim/auto-fix"
                           :detail "Auto-fix delimiter issues"})]
    (reply #js {:key key :allow allow})))

(deftest auto-fix-handles-common-delimiter-cases
  (let [missing (delims/auto-fix "(defn foo []\n  (inc 1)" 5)
        mismatch (delims/auto-fix "(defn foo []\n  [1 2 3)" 5)
        clean (delims/auto-fix "(defn foo []\n  (inc 1))" 5)]
    (is (seq (:fixes missing)))
    (is (not= -1 (.indexOf (:fixedCode missing) ")")))
    (is (seq (:issues mismatch)))
    (is (= "No delimiter fixes needed" (:summary clean)))))

(deftest auto-fix-invalid-forms-no-op-and-partial-fix
  (let [invalid (delims/auto-fix ")\n(defn foo []\n  [1 2 3)" 5)
        no-op (delims/auto-fix "(defn ok []\n  (inc 1))" 3)
        partial (delims/auto-fix "(defn foo []\n  (let [x 1\n    (inc x)" 1)
        zero-limit (delims/auto-fix "(defn foo []\n  (let [x 1\n    (inc x)" 0)]
    (is (= :extra-close (:kind (first (:issues invalid)))))
    (is (not= -1 (.indexOf (:fixedCode invalid) "(defn foo")))
    (is (= [] (:fixes no-op)))
    (is (= "No delimiter fixes needed" (:summary no-op)))
    (is (= 1 (count (:fixes partial))))
    (is (= "Applied 1 delimiter fixes" (:summary partial)))
    (is (= [] (:fixes zero-limit)))
    (is (= "No delimiter fixes needed" (:summary zero-limit)))
    (is (pos? (count (:issues zero-limit))))))

(deftest diagnose-ignores-strings-comments-and-block-comment-bodies
  (let [code "(defn foo []\n  (println \")\") ; ]\n  #| } ] ) */\n  (inc 1))"
        issues (delims/diagnose code)]
    (is (= [] issues))))

(deftest plugin-requires-permission-before-executing
  (async done
    (let [ctx #js {}
          args #js {:code "(defn foo []\n  (inc 1)"}]
      (-> (execute-tool ctx args)
          (.then (fn [_]
                   (is false "expected permission gate to fail")))
          (.catch (fn [err]
                    (is (not= -1 (.indexOf (.-message err) "Permission required")))))
          (.then (fn [_] (done)))))))

(deftest plugin-executes-after-permission-allow
  (async done
    (let [ctx #js {}]
      (-> (entry/MyPlugin ctx)
          (.then (fn [plugin]
                   (let [tool (aget (aget plugin "tool") "delim/auto-fix")]
                     (allow-tool! plugin true)
                     (.execute tool #js {:code "(defn foo []\n  (inc 1)"
                                        :maxFixes 2
                                        :diagnostic "from-test"}
                               ctx))))
          (.then (fn [result]
                   (let [r (normalize-result result)]
                      (is (seq (:fixes r)))
                      (is (= "Applied 1 delimiter fixes; diagnostic: from-test" (:summary r)))
                      (is (= "(defn foo []\n  (inc 1))" (:fixedCode r))))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                     (is false (str "allowed execution failed: " err))
                     (done)))))))

(deftest plugin-respects-denied-permission-and-default-summary-branch
  (async done
    (let [ctx #js {}]
      (-> (entry/MyPlugin ctx)
          (.then (fn [plugin]
                   (allow-tool! plugin false)
                   (let [tool (aget (aget plugin "tool") "delim/auto-fix")]
                     (.execute tool #js {:code "(defn foo []\n  (inc 1)"} ctx))))
          (.then (fn [_]
                   (is false "expected denied permission to fail")))
          (.catch (fn [err]
                    (is (not= -1 (.indexOf (.-message err) "Permission denied")))))
          (.then (fn [_]
                   (entry/MyPlugin ctx)))
          (.then (fn [plugin]
                   (allow-tool! plugin true)
                   (let [tool (aget (aget plugin "tool") "delim/auto-fix")]
                     (.execute tool #js {:code "(defn foo []\n  (inc 1)"} ctx))))
          (.then (fn [result]
                   (let [r (normalize-result result)]
                     (is (= "Applied 1 delimiter fixes" (:summary r)))
                     (is (= "(defn foo []\n  (inc 1))" (:fixedCode r))))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "deny/default branch failed: " err))
                    (done)))))))

(defn -main []
  (install-summary-exit-hook!)
  (run-tests 'my.opencode.entry-test))

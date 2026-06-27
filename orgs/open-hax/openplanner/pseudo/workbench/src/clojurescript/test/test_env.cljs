(ns test-env
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.env :as env]))

(deftest test-environment-detection
  (testing "node environment detection"
    ;; We are running in Node for tests
    (is (env/node?))
    (is (not (env/electron?)))
    (is (not (env/web?)))
    (is (= :node (env/get-platform))))

  (testing "mocked electron environment"
    (let [orig-window (when (exists? js/window) js/window)
          mock-electron-api #js {:getAppVersion (fn [] "1.0.0")}]
      (set! js/window #js {:electronAPI mock-electron-api})
      
      (try
        (is (env/electron?))
        (is (= :electron (env/get-platform)))
        (is (some? (env/electron-api)))
        (is (= "1.0.0" (env/get-app-version)))
        (is (env/file-system-access?))
        (finally
          (set! js/window orig-window)))))

  (testing "mocked web environment"
    (let [orig-window (when (exists? js/window) js/window)]
      (set! js/window #js {}) ;; No electronAPI
      
      (with-redefs [env/electron? (constantly false)
                    env/node? (constantly false)]
        (try
          (is (env/web?))
          (is (= :web (env/get-platform)))
          (is (= "web-version" (env/get-app-version)))
          (finally
            (set! js/window orig-window)))))))

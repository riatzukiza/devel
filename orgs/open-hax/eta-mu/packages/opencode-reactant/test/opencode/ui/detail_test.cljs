(ns opencode.ui.detail-test
  (:require [cljs.test :refer [deftest is]]
            [opencode.ui.detail :as detail]
            [opencode.ui.router :as router]))

(deftest back-button-targets-route
  (let [called (atom nil)]
    (with-redefs [router/navigate! (fn [target & _] (reset! called target))]
      (let [[_ attrs] (detail/back-button ::router/prs)]
        ((:on-click attrs))
        (is (= ::router/prs @called))))))

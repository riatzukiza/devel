(ns test-layout
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.layout :as layout]
            [opencode-unified.state :as state]
            [opencode-unified.opencode :as opencode]
            [reagent.core :as r]))

;; --- Helper for pure component testing ---
(defn render-component [component-fn & args]
  (apply component-fn args))

(deftest test-testid-safe
  (testing "testid-safe sanitization"
    (is (= "hello-world" (#'layout/testid-safe "Hello World")))
    (is (= "my-key" (#'layout/testid-safe :my/key)))
    (is (= "123-test" (#'layout/testid-safe "123 Test!")))
    (is (= "a-b-c" (#'layout/testid-safe "a_b_c")))
    (is (= "test" (#'layout/testid-safe "---test---")))))

(deftest test-pagination
  (testing "paginate-items"
    (let [items (range 1 21)]
      (is (= '(1 2 3 4 5) (#'layout/paginate-items items 1 5)))
      (is (= '(6 7 8 9 10) (#'layout/paginate-items items 2 5)))
      (is (= '(16 17 18 19 20) (#'layout/paginate-items items 4 5)))
      (is (= '() (#'layout/paginate-items items 5 5)))
      
      ;; Edge cases
      (is (= '(1 2 3 4 5) (#'layout/paginate-items items 0 5))) ;; page < 1 -> 1
      (is (= '(1) (#'layout/paginate-items '(1) 1 5))))))

(deftest test-session-helpers
  (testing "session-id-of"
    (is (= "s1" (#'layout/session-id-of {:session-id "s1"})))
    (is (= "s2" (#'layout/session-id-of {:session "s2"})))
    (is (= "s1" (#'layout/session-id-of {:session-id "s1" :session "s2"})))
    (is (nil? (#'layout/session-id-of {}))))

  (testing "session-item?"
    (is (true? (#'layout/session-item? {:session-id "s1"})))
    (is (false? (#'layout/session-item? {:title "Just an event"}))))

  (testing "session-title-of"
    (is (= "Title" (#'layout/session-title-of {:session-title "Title"})))
    (is (= "Title" (#'layout/session-title-of {:title "Title"})))
    (is (= "OpenCode Session" (#'layout/session-title-of {})))))

(deftest test-open-session-in-chat
  (testing "valid session"
    (let [used-session (atom nil)]
      (with-redefs [opencode/use-session! (fn [id] 
                                            (reset! used-session id)
                                            (js/Promise.resolve {:success true}))
                    state/update-statusbar! (fn [& _] nil)]
        (#'layout/open-session-in-chat! {:session-id "sess-1"})
        (is (= "sess-1" @used-session)))))

  (testing "missing session"
    (let [status-update (atom nil)]
      (with-redefs [state/update-statusbar! (fn [_ _ msg] (reset! status-update msg))]
        (#'layout/open-session-in-chat! {:title "No ID"})
        (is (= "Selected item has no session ID" @status-update))))))

;; --- Component Tests (Pure Hiccup Verification) ---

(deftest test-workflow-nav
  (testing "renders correct items"
    (let [hiccup (layout/workflow-nav "#/")]
      (is (= :div.workflow-nav (first hiccup)))
      (let [children (nth hiccup 2)]
        ;; Should have 3 nav items
        (is (= 3 (count children)))
        ;; Check first item (Home)
        (let [home-btn (first children)]
          (is (= :button.nav-item (first home-btn)))
          ;; Active state check
          (let [style (-> home-btn second :style)]
            (is (= "var(--bg-selection)" (:background-color style))))))))

  (testing "inactive state"
    (let [hiccup (layout/workflow-nav "#/other")]
      (let [children (nth hiccup 2)
            home-btn (first children)
            style (-> home-btn second :style)]
        (is (= "transparent" (:background-color style)))))))

(deftest test-tab-bar
  (testing "renders open buffers"
    (reset! state/app-state {:buffers {"b1" {:id "b1" :name "file.txt" :modified? false}
                                       "b2" {:id "b2" :name "unsaved.clj" :modified? true}}
                             :current-buffer "b1"})
    (let [hiccup (layout/tab-bar)
          tabs (nth hiccup 2)]
      (is (= :div.tab-bar (first hiccup)))
      (is (= 2 (count tabs)))
      
      ;; First tab (Active)
      (let [tab1 (first tabs)
            props1 (second tab1)
            name1 (nth tab1 2)]
        (is (= "active" (:class props1)))
        (is (= "file.txt" (nth name1 2))))
      
      ;; Second tab (Inactive, Modified)
      (let [tab2 (second tabs)
            props2 (second tab2)
            indicator (nth tab2 3)]
        (is (nil? (:class props2)))
        (is (some? indicator)) ;; Modified indicator should be present
        (is (= "●" (nth indicator 2)))))))

(deftest test-status-bar
  (testing "renders status info"
    (reset! state/app-state {:evil-state {:mode :insert}
                             :statusbar {:center "All good"}})
    (let [hiccup (layout/status-bar)
          left (nth hiccup 2)
          center (nth hiccup 3)
          right (nth hiccup 4)]
      
      ;; Note: In real Reagent, r/track returns a deref-able. 
      ;; In our pure test, we might need to mock or ensure deref works.
      ;; The component uses @left-text, so if we just call the function, it returns the hiccup.
      ;; However, the `let` bindings in status-bar use r/track.
      ;; We need to make sure the mocked r/track behaves like an atom/deref-able in this test context
      ;; or verify the logic differently.
      ;; For now, let's verify structure.
      
      (is (= :div.status-bar (first hiccup)))
      (is (= :div.status-left (first left)))
      (is (= :div.status-center (first center)))
      ;; We can't easily check the *content* of the atoms inside the component closure 
      ;; without enzyme-like mounting, but we can verify the hiccup structure is correct.
      )))

(deftest test-header
  (testing "renders header elements"
    (let [hiccup (layout/header)]
      (is (= :div.header (first hiccup)))
      
      ;; Menu bar presence
      (let [left-section (nth hiccup 2)
            menu-bar (nth left-section 3)
            menu-items (nth menu-bar 2)]
        (is (= :nav.menu-bar (first menu-bar)))
        (is (seq menu-items))
        ;; Check for File menu
        (let [file-menu (first menu-items)]
          (is (= "File" (nth file-menu 2))))))))

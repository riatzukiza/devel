;; ============================================================================
;; Tests for promethean.bridge.cephalon-ts
;;
;; These tests verify the ClojureScript bridge that loads and controls
;; the TypeScript Cephalon runtime via js/require.
;; ============================================================================

(ns promethean.bridge.cephalon-ts-test
  "Tests for the TS→CLJS bridge module"
  (:require [cljs.test :refer-macros [deftest is testing use-fixtures async]]
            [promethean.bridge.cephalon-ts :as bridge]))

;; ============================================================================
;; Test Fixtures
;; ============================================================================

(defn stub-app
  []
  #js {:start (fn [] (js/Promise.resolve nil))
       :stop (fn [_] (js/Promise.resolve nil))})

(use-fixtures :each
  {:before (fn [] (reset! bridge/*app nil))
   :after (fn [] (reset! bridge/*app nil))})

;; ============================================================================
;; Tests: start! function
;; ============================================================================

(deftest start!-requires-discord-token
  "Test: start! should warn and not start when no token is available"

  (async done
    (testing "When DUCK_DISCORD_TOKEN is not set"
      (let [original-duck (.-DUCK_DISCORD_TOKEN js/process.env)
            original-discord (.-DISCORD_TOKEN js/process.env)
            create-count (atom 0)]
        (set! (.-DUCK_DISCORD_TOKEN js/process.env) "")
        (set! (.-DISCORD_TOKEN js/process.env) "")
        (with-redefs [bridge/create-cephalon-app!
                      (fn [_]
                        (swap! create-count inc)
                        (js/Promise.resolve (stub-app)))]
          (-> (bridge/start!)
              (.then (fn [_]
                       (is (nil? @bridge/*app)
                           "App should not be started without token")
                       (is (= 0 @create-count)
                           "create-cephalon-app! should not be called without token")))
              (.catch (fn [err]
                        (is false (str "Unexpected error: " err))))
              (.finally (fn []
                          (if original-duck
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) original-duck)
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) ""))
                          (if original-discord
                            (set! (.-DISCORD_TOKEN js/process.env) original-discord)
                            (set! (.-DISCORD_TOKEN js/process.env) ""))
                          (done)))))))))

(deftest start!-creates-app-with-valid-token
  "Test: start! should create and start app when token is available"

  (async done
    (testing "When valid token is provided via DUCK_DISCORD_TOKEN"
      (let [original-duck (.-DUCK_DISCORD_TOKEN js/process.env)
            original-discord (.-DISCORD_TOKEN js/process.env)
            create-count (atom 0)]
        (set! (.-DUCK_DISCORD_TOKEN js/process.env) "test-token-123")
        (set! (.-DISCORD_TOKEN js/process.env) "")
        (with-redefs [bridge/create-cephalon-app!
                      (fn [_]
                        (swap! create-count inc)
                        (js/Promise.resolve (stub-app)))]
          (-> (bridge/start!)
              (.then (fn [_]
                       (is (= 1 @create-count)
                           "create-cephalon-app! should be called once")
                       (is (some? @bridge/*app)
                           "App should be set after successful start")))
              (.catch (fn [err]
                        (is false (str "Unexpected error: " err))))
              (.finally (fn []
                          (if original-duck
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) original-duck)
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) ""))
                          (if original-discord
                            (set! (.-DISCORD_TOKEN js/process.env) original-discord)
                            (set! (.-DISCORD_TOKEN js/process.env) ""))
                          (done)))))))))

(deftest start!-is-idempotent
  "Test: start! should not create multiple apps when called multiple times"

  (async done
    (testing "Calling start! multiple times should not cause issues"
      (let [original-duck (.-DUCK_DISCORD_TOKEN js/process.env)
            original-discord (.-DISCORD_TOKEN js/process.env)
            create-count (atom 0)]
        (set! (.-DUCK_DISCORD_TOKEN js/process.env) "test-token")
        (set! (.-DISCORD_TOKEN js/process.env) "")
        (with-redefs [bridge/create-cephalon-app!
                      (fn [_]
                        (swap! create-count inc)
                        (js/Promise.resolve (stub-app)))]
          (-> (bridge/start!)
              (.then (fn [] (bridge/start!)))
              (.then (fn [] (bridge/start!)))
              (.then (fn []
                       (is (= 1 @create-count)
                           "Multiple start! calls should not create multiple apps")))
              (.catch (fn [err]
                        (is false (str "Unexpected error: " err))))
              (.finally (fn []
                          (if original-duck
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) original-duck)
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) ""))
                          (if original-discord
                            (set! (.-DISCORD_TOKEN js/process.env) original-discord)
                            (set! (.-DISCORD_TOKEN js/process.env) ""))
                          (done)))))))))

;; ============================================================================
;; Tests: stop! function
;; ============================================================================

(deftest stop!-cleans-up-state
  "Test: stop! should reset the app state"

  (testing "After stopping, *app atom should be nil"
    ;; Stop without starting should be safe
    (bridge/stop!)

    (is (nil? @bridge/*app)
        "*app should be nil after stop!")))

(deftest stop!-handles-already-stopped
  "Test: stop! should be safe to call when already stopped"

  (testing "Calling stop! when already stopped should not throw"
    (bridge/stop!)
    (bridge/stop!)

    (is (true? true)
        "Multiple stop! calls should not throw")))

;; ============================================================================
;; Tests: Bridge State Management
;; ============================================================================

(deftest bridge-state-is-atom
  "Test: *app should be an atom for reactive state"

  (testing "*app is an atom"
    (is (satisfies? cljs.core/IAtom bridge/*app)
        "*app should be an atom")))

(deftest bridge-state-resets-on-stop
  "Test: stop! resets *app to nil"

  (testing "*app value before and after stop"
    ;; Initial state should be nil
    (is (nil? @bridge/*app)
        "*app should be nil initially")

    ;; After stop, should still be nil
    (bridge/stop!)
    (is (nil? @bridge/*app)
        "*app should remain nil after stop")))

;; ============================================================================
;; Tests: Token Environment Variables
;; ============================================================================

(deftest token-precedence-duck-first
  "Test: DUCK_DISCORD_TOKEN takes precedence over DISCORD_TOKEN"

  (async done
    (testing "When both tokens are set, DUCK_DISCORD_TOKEN is preferred"
      (let [original-duck (.-DUCK_DISCORD_TOKEN js/process.env)
            original-discord (.-DISCORD_TOKEN js/process.env)
            captured (atom nil)]
        (set! (.-DUCK_DISCORD_TOKEN js/process.env) "duck-token")
        (set! (.-DISCORD_TOKEN js/process.env) "discord-token")
        (with-redefs [bridge/create-cephalon-app!
                      (fn [opts]
                        (reset! captured opts)
                        (js/Promise.resolve (stub-app)))]
          (-> (bridge/start!)
              (.then (fn [_]
                       (is (= "duck-token" (.-discordToken @captured))
                           "DUCK_DISCORD_TOKEN should be used when both are set")))
              (.catch (fn [err]
                        (is false (str "Unexpected error: " err))))
              (.finally (fn []
                          (if original-duck
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) original-duck)
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) ""))
                          (if original-discord
                            (set! (.-DISCORD_TOKEN js/process.env) original-discord)
                            (set! (.-DISCORD_TOKEN js/process.env) ""))
                          (done)))))))))

(deftest token-fallback-to-discord
  "Test: Falls back to DISCORD_TOKEN when DUCK_DISCORD_TOKEN is not set"

  (async done
    (testing "When DUCK_DISCORD_TOKEN is nil, DISCORD_TOKEN should be used"
      (let [original-duck (.-DUCK_DISCORD_TOKEN js/process.env)
            original-discord (.-DISCORD_TOKEN js/process.env)
            captured (atom nil)]
        (set! (.-DUCK_DISCORD_TOKEN js/process.env) "")
        (set! (.-DISCORD_TOKEN js/process.env) "fallback-token")
        (with-redefs [bridge/create-cephalon-app!
                      (fn [opts]
                        (reset! captured opts)
                        (js/Promise.resolve (stub-app)))]
          (-> (bridge/start!)
              (.then (fn [_]
                       (is (= "fallback-token" (.-discordToken @captured))
                           "DISCORD_TOKEN should be used when DUCK_DISCORD_TOKEN is nil")))
              (.catch (fn [err]
                        (is false (str "Unexpected error: " err))))
              (.finally (fn []
                          (if original-duck
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) original-duck)
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) ""))
                          (if original-discord
                            (set! (.-DISCORD_TOKEN js/process.env) original-discord)
                            (set! (.-DISCORD_TOKEN js/process.env) ""))
                          (done)))))))))

;; ============================================================================
;; Tests: Module Interface
;; ============================================================================

(deftest bridge-exports-required-functions
  "Test: Bridge module exports start! and stop!"

  (testing "start! and stop! are exported and callable"
    (is (fn? bridge/start!)
        "start! should be a function")
    (is (fn? bridge/stop!)
        "stop! should be a function")))

(deftest bridge-exports-app-atom
  "Test: Bridge module exports *app atom"

  (testing "*app is accessible for inspection"
    (is (some? bridge/*app)
        "*app should be defined")
    (is (satisfies? cljs.core/IAtom bridge/*app)
        "*app should be an atom")))

;; ============================================================================
;; Tests: Integration Scenarios
;; ============================================================================

(deftest start-stop-lifecycle
  "Test: Complete start→stop lifecycle"

  (async done
    (testing "Full lifecycle: start, then stop"
      (let [original-duck (.-DUCK_DISCORD_TOKEN js/process.env)
            original-discord (.-DISCORD_TOKEN js/process.env)]
        (set! (.-DUCK_DISCORD_TOKEN js/process.env) "lifecycle-test-token")
        (set! (.-DISCORD_TOKEN js/process.env) "")
        (with-redefs [bridge/create-cephalon-app!
                      (fn [_]
                        (js/Promise.resolve (stub-app)))]
          (-> (bridge/start!)
              (.then (fn [_]
                       (-> (bridge/stop!)
                           (.then (fn []
                                    (is (nil? @bridge/*app)
                                        "*app should be nil after full lifecycle"))))))
              (.catch (fn [err]
                        (is false (str "Unexpected error: " err))))
              (.finally (fn []
                          (if original-duck
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) original-duck)
                            (set! (.-DUCK_DISCORD_TOKEN js/process.env) ""))
                          (if original-discord
                            (set! (.-DISCORD_TOKEN js/process.env) original-discord)
                            (set! (.-DISCORD_TOKEN js/process.env) ""))
                          (done)))))))))

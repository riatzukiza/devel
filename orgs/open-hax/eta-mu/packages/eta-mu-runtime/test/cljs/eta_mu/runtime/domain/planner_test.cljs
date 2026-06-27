(ns eta-mu.runtime.domain.planner-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.runtime.domain.breath :as breath]
            [eta-mu.runtime.domain.envelope :as envelope]
            [eta-mu.runtime.domain.planner :as planner]
            [eta-mu.runtime.domain.state :as state]))

(defn- context
  [overrides]
  (merge {:repo "open-hax/proxx"
          :trigger "scheduler.tick"
          :target "open-hax/proxx"
          :summary "cheap reconcile loop"
          :belief (state/create-belief)
          :unresolved-review-threads 0
          :failing-checks []
          :has-pending-human-attention false
          :quiet-window-detected false
          :pending-commit false}
         overrides))

(deftest select-panels-pressure-test
  (testing "select-panels surfaces truth, trajectory, memory, and breath under pressure"
    (let [panels (planner/select-panels
                  (context {:trigger "check.completed"
                            :target "staging"
                            :summary "staging gate changed"
                            :belief (state/create-belief {:urgency 0.8
                                                          :review-debt 0.7
                                                          :drift 0.6})
                            :unresolved-review-threads 2
                            :quiet-window-detected true}))]
      (is (= [:field :movement :truth :trajectory :memory :breath] panels)))))

(deftest rank-cheap-candidates-ambiguity-test
  (testing "rank-cheap-candidates asks for evidence before stronger movement when ambiguity is high"
    (let [candidates (planner/rank-cheap-candidates
                      (context {:trigger "pull_request_review_comment"
                                :target "pr#42"
                                :summary "state needs reconciliation"
                                :belief (state/create-belief {:ambiguity 0.9
                                                              :social-friction 0.8})
                                :has-pending-human-attention true}))
          kinds (set (map :kind candidates))]
      (is (contains? kinds :request-evidence))
      (is (contains? kinds :request-human-attention)))))

(deftest create-action-batch-noop-test
  (testing "create-action-batch emits a noop batch when no cheap movement is justified"
    (let [batch (envelope/create-action-batch (context {:summary "cheap reconcile loop found no action"}))]
      (is (= "eta-mu-action-batch.v1" (:kind batch)))
      (is (= 1 (count (:actions batch))))
      (is (= :noop (-> batch :actions first :kind)))
      (is (false? (get-in batch [:breath :should-commit]))))))

(deftest recommend-breath-pending-commit-test
  (testing "recommend commits immediately when an episode is already pending commit"
    (let [recommendation (breath/recommend (context {:pending-commit true}))]
      (is (true? (:should-commit recommendation)))
      (is (= "Episode is already marked pending commit." (:reason recommendation))))))

(deftest recommend-breath-quiet-window-test
  (testing "recommend commits during a quiet window after meaningful movement"
    (let [ctx (context {:quiet-window-detected true
                        :failing-checks ["unit-tests"]
                        :belief (state/create-belief {:deploy-risk 0.8})})
          actions (planner/rank-cheap-candidates ctx)
          recommendation (breath/recommend ctx actions)]
      (is (some #(not= :noop (:kind %)) actions))
      (is (true? (:should-commit recommendation)))
      (is (= "Quiet window detected after meaningful movement planning." (:reason recommendation))))))

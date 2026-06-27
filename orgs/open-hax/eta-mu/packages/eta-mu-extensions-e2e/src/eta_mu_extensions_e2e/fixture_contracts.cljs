(ns eta-mu-extensions-e2e.fixture-contracts)

(def block-contract
  {:contract/kind  :policy
   :contract/id    "deny-shell"
   :policy/match   {:tool/name "shell"}
   :policy/action  :block
   :policy/reason  "No shell."})

(def notify-contract
  {:contract/kind       :fulfillment
   :contract/id         "notify-write"
   :fulfillment/on      :after-tool-call
   :fulfillment/match   {:tool/name "write_file"}
   :fulfillment/mode    :notify
   :fulfillment/message "tool={tool/name} dry={dry-run} error={tool/error}"
   :fulfillment/level   :info})

(def error-contract
  {:contract/kind       :fulfillment
   :contract/id         "notify-error"
   :fulfillment/on      :after-tool-call
   :fulfillment/match   {:tool/error? true}
   :fulfillment/mode    :notify
   :fulfillment/message "error path for {tool/name}"
   :fulfillment/level   :error})

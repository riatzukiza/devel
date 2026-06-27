(ns my.opencode.perm)

(defn make-store []
  (atom {}))

(defn key-for [{:keys [kind tool detail]}]
  (str kind "::" tool "::" detail))

(defn allowed? [store k]
  (= true (get-in @store [k :allow])))

(defn denied? [store k]
  (= false (get-in @store [k :allow])))

(defn remember! [store k allow?]
  (swap! store assoc k {:allow allow? :ts (.now js/Date)}))

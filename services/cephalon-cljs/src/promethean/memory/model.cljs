(ns promethean.memory.model)

(defn now-ms [] (.now js/Date))

(defn base-memory [{:keys [kind role text meta ts]}]
  {:memory/id (str (random-uuid))
   :memory/ts (or ts (now-ms))
   :memory/kind (or kind :event)
   :memory/role (or role :user)
   :memory/text (or text "")
   :memory/meta (or meta {})
   :memory/tags []
   :memory/nexus-keys []
   :memory/dedupe-key nil
   :memory/lifecycle {:deleted false :pinned false :replaced-by nil}
   :memory/usage {:included-total 0 :included-decay 0}})

(ns opencode.ui.components
  (:require [reagent.core :as r]
            [clojure.string :as string]
            [opencode.ui.state :as S]
            [opencode.ui.github :as gh]
            [opencode.ui.files :as files]
            [opencode.ui.router :as router]))

(defn issue-item [issue]
  ;; Handle both JS objects and Clojure maps
  (let [number (if (map? issue)
                 (or (:number issue) (get issue "number"))
                 (.-number issue))
        title (if (map? issue)
                (or (:title issue) (get issue "title"))
                (.-title issue))
        state (if (map? issue)
                (or (:state issue) (get issue "state"))
                (.-state issue))
        id (if (map? issue)
             (or (:id issue) (get issue "id"))
             (.-id issue))]
    [:div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all.cursor-pointer
     {:key (str "issue-" id)
      :on-click #(router/navigate! ::router/issue (str number))}
      [:div.flex.items-center.justify-between.mb-2
       [:span.text-sm.font-medium.text-gray-500 (str "#" number)]
       [:span.px-2.py-1.text-xs.font-semibold.rounded-full
        {:class (if (= state "open") "bg-green-100.text-green-800" "bg-gray-100.text-gray-800")}
        state]]
      [:div.text-lg.font-semibold.text-gray-900.mb-3.hover:text-blue-600.transition-colors title]
      [:div.flex.gap-2
       [:button.bg-blue-500.hover:bg-blue-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-blue-500.focus:ring-offset-2
        {:on-click (fn [e] 
                     (.stopPropagation e)
                     (gh/create-worktree! number))} "Create worktree"]
       [:button.bg-gray-500.hover:bg-gray-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-gray-500.focus:ring-offset-2
        {:on-click (fn [e] 
                     (.stopPropagation e)
                     (gh/open-pr! number))} "Open PR"]]]))

(defn pr-item [pr]
  ;; Handle both JS objects and Clojure maps
  (let [number (if (map? pr)
                 (or (:number pr) (get pr "number"))
                 (.-number pr))
        title (if (map? pr)
                (or (:title pr) (get pr "title"))
                (.-title pr))
        state (if (map? pr)
                (or (:state pr) (get pr "state"))
                (.-state pr))
        id (if (map? pr)
             (or (:id pr) (get pr "id"))
             (.-id pr))]
    [:div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all.cursor-pointer
     {:key (str "pr-" id)
      :on-click #(router/navigate! ::router/pr (str number))}
      [:div.flex.items-center.justify-between.mb-2
       [:span.text-sm.font-medium.text-gray-500 (str "PR #" number)]
       [:span.px-2.py-1.text-xs.font-semibold.rounded-full
        {:class (cond
                  (= state "open") "bg-green-100.text-green-800"
                  (= state "merged") "bg-purple-100.text-purple-800"
                  :else "bg-gray-100.text-gray-800")}
         state]]
      [:div.text-lg.font-semibold.text-gray-900.hover:text-blue-600.transition-colors title]]))

(defn worktree-item [worktree]
  (let [issue (or (:issue worktree) (get worktree "issue"))
        branch (or (:branch worktree) (get worktree "branch"))
        path (or (:path worktree) (get worktree "path"))
        id (str "worktree-" issue)]
    [:div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all
     {:key id}
      [:div.flex.items-center.justify-between.mb-2
       [:span.text-sm.font-medium.text-gray-500 (str "Issue #" issue)]
       [:span.px-2.py-1.text-xs.font-semibold.rounded-full.bg-blue-100.text-blue-800
        "Worktree"]]
      [:div.text-lg.font-semibold.text-gray-900.mb-1 branch]
      [:div.text-sm.text-gray-600.mb-3 path]
      [:div.flex.gap-2
       [:button.bg-green-500.hover:bg-green-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-green-500.focus:ring-offset-2
        {:on-click #(js/alert (str "Open worktree: " path))} "Open"]
       [:button.bg-red-500.hover:bg-red-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-red-500.focus:ring-offset-2
        {:on-click #(js/alert (str "Remove worktree for issue #" issue))} "Remove"]]]))

(defn scrolling-container [title content & {:keys [max-height class extra-header-content]}]
  [:div.flex.flex-col.h-full.min-h-0
   [:div.flex.items-center.justify-between.mb-4.flex-shrink-0
    [:h2.text-xl.font-bold.text-gray-900 title]
    (when extra-header-content extra-header-content)]
   [:div.flex-1.overflow-y-auto.px-1.min-h-0
    {:class (or class "")
     :style (when max-height {:max-height max-height})}
    content]])

(defn events-log []
  (let [evts (reverse (:events @S/!state))]
    [scrolling-container "Events"
     [:div.bg-white.border.border-gray-200.rounded-lg.shadow-sm.overflow-hidden
      [:div.bg-gray-50.px-4.py-3.border-b.border-gray-200
       [:div.flex.items-center.justify-between
        [:span.text-sm.font-medium.text-gray-700 "Event Log"]
        [:span.text-xs.text-gray-500 (str (count evts) " events")]]]
      [:div
       (if (seq evts)
         (for [[i e] (map-indexed vector evts)]
           ^{:key i}
           [:div.px-4.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50
            [:pre.text-xs.font-mono.text-gray-700 (pr-str e)]])
         [:div.p-8.text-center
          [:div.text-3xl.mb-3 "📝"]
          [:p.text-gray-600.font-medium "No events yet."]
          [:p.text-sm.text-gray-400.mt-2 "Events will appear here as you interact with the application."]])]]
     :max-height "300px"]))

(defn issues-section [issues]
  [:div.flex.flex-col.h-full.min-h-0
   [scrolling-container "Issues"
    (if (seq issues)
      (for [i issues] ^{:key (:id i)} [issue-item i])
      [:div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm
       [:div.text-4xl.mb-3 "📋"]
       [:p.text-gray-600.font-medium "No issues loaded."]
       [:p.text-sm.text-gray-400.mt-2 "Issues will appear here once connected to GitHub."]])]])

(defn prs-section [prs]
  [:div.flex.flex-col.h-full.min-h-0
   [scrolling-container "Pull Requests"
    (if (and prs (pos? (count prs)))
      (for [p prs] ^{:key (:id p)} [pr-item p])
      [:div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm
       [:div.text-4xl.mb-3 "🔄"]
       [:p.text-gray-600.font-medium "No PRs loaded."]
       [:p.text-sm.text-gray-400.mt-2 "Pull requests will appear here once connected to GitHub."]])]])

(defn worktrees-section [worktrees worktree-config]
  [:div.mt-8.flex.flex-col.min-h-0
   [scrolling-container "Worktrees"
    (if (and worktrees (pos? (count worktrees)))
      (for [w worktrees] ^{:key (:issue w)} [worktree-item w])
      [:div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm
       [:div.text-4xl.mb-3 "🌳"]
       [:p.text-gray-600.font-medium "No worktrees created."]
       [:p.text-sm.text-gray-400.mt-2 "Worktrees will appear here when you create them for them."]])
    :extra-header-content [:div.flex.items-center.gap-2
                           [:span.text-sm.text-gray-600 "Base folder:"]
                           [:span.px-2.py-1.bg-blue-100.text-blue-800.text-xs.font-medium.rounded-full
                            (:baseDir worktree-config)]]
    :max-height "12rem"]])

(defn repo-controls [repo]
  (let [repo-input (r/atom repo)
        show? (r/atom false)]
    (fn []
      (let [history (:repo-history @S/!state)
            slug (string/trim @repo-input)
            suggestions (->> history
                             (filter (fn [r]
                                       (string/starts-with?
                                        (string/lower-case r)
                                        (string/lower-case slug))))
                             (take 6))
            submit! (fn [slug]
                      (when (seq slug)
                        (S/set-repo! slug)
                        (gh/clear-detail-caches!)
                        (gh/fetch-issues!)
                        (gh/fetch-prs!)
                        (gh/fetch-worktrees!)
                        (gh/fetch-worktree-config!)
                        (files/fetch-files! ".")
                        (S/push-event! {:type :ui/repo-change
                                        :repo slug
                                        :ts (.now js/Date)})))]
        [:form.flex.items-center.gap-3.relative
         {:on-submit (fn [e]
                       (.preventDefault e)
                       (submit! slug))}
         [:label.text-sm.text-gray-600 "Repo:"]
         [:div.relative
          [:input.border.border-gray-300.rounded-md.px-3.py-2.text-sm.focus:outline-none.focus:ring-2.focus:ring-blue-500.w-56
           {:value @repo-input
            :placeholder "owner/repo"
            :on-focus #(reset! show? true)
            :on-blur #(js/setTimeout (fn [] (reset! show? false)) 100)
            :on-change #(do
                          (reset! repo-input (.. % -target -value))
                          (reset! show? true))}]
          (when (and @show? (seq suggestions) (seq slug))
            [:div.absolute.z-10.mt-1.w-56.bg-white.border.border-gray-200.rounded-md.shadow-lg.max-h-56.overflow-y-auto
             (for [s suggestions]
               ^{:key s}
               [:button.w-full.text-left.px-3.py-2.text-sm.hover:bg-gray-100
                {:type "button"
                 :on-mouse-down #(.preventDefault %)
                 :on-click (fn [e]
                             (.preventDefault e)
                             (reset! repo-input s)
                             (submit! s)
                             (reset! show? false))}
                s])])]
         [:button.bg-blue-600.hover:bg-blue-700.text-white.text-sm.font-medium.px-4.py-2.rounded-md.transition-colors
          {:type "submit"}
          "Update"]]))))


(defn file-entry [{:keys [type name path isSubmodule size mtime]} navigate]



  (let [is-dir (= type "dir")]
    [:button.w-full.text-left.flex.items-center.justify-between.px-3.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50.transition-colors
     {:type "button"
      :on-click #(when is-dir (navigate path))}
     [:div.flex.items-center.gap-2
      [:span.text-sm.font-mono.text-gray-700 (if is-dir "[dir]" "[file]")]
      [:span.text-sm.text-gray-900 name]
      (when isSubmodule
        [:span {:class "text-[11px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full"}
         "submodule"])]
     [:div.flex.items-center.gap-3.text-xs.text-gray-500
      (when size [:span (str size " bytes")])
      (when mtime [:span (js/Date. mtime)])]]))

(defn file-explorer []
  (let [{:keys [path entries loading? error]} (:fs @S/!state)
        path-input (r/atom path)]
    (fn []
      (let [navigate (fn [p]
                       (reset! path-input p)
                       (files/fetch-files! p))
            up-path (if (or (nil? path) (= path ".")) "." (string/join "/" (butlast (string/split path #"/"))))]
        [:div.bg-white.border.border-gray-200.rounded-lg.shadow-sm.flex.flex-col.min-h-0
         [:div.p-4.flex.items-center.justify-between.border-b.border-gray-100
          [:div
           [:h2.text-lg.font-semibold.text-gray-900 "Files"]
           [:p.text-xs.text-gray-500 "Git-aware explorer (submodules marked)"]]
          [:div.flex.items-center.gap-2
           [:input.border.border-gray-300.rounded-md.px-3.py-2.text-sm.focus:outline-none.focus:ring-2.focus:ring-blue-500.w-48
            {:value @path-input
             :on-change #(reset! path-input (.. % -target -value))
             :placeholder "path"}]
           [:button.bg-gray-100.text-gray-700.hover:bg-gray-200.px-3.py-2.text-sm.rounded-md
            {:type "button"
             :on-click #(navigate up-path)}
            "Up"]
           [:button.bg-blue-600.hover:bg-blue-700.text-white.text-sm.font-medium.px-4.py-2.rounded-md.transition-colors
            {:type "button"
             :on-click #(navigate @path-input)}
            "Go"]]]
         [:div.flex-1.overflow-y-auto
          (cond
            loading? [:div.p-4.text-sm.text-gray-500 "Loading..."]
            error [:div.p-4.text-sm.text-red-600 error]
            (empty? entries) [:div.p-6.text-sm.text-gray-500 "No entries"]
            :else [:div.divide-y.divide-gray-100
                   (when (not= path ".")
                     [file-entry {:type "dir" :name ".." :path up-path :isSubmodule false :size nil :mtime nil} navigate])
                   (for [e entries]
                     ^{:key (:path e)} [file-entry e navigate])])]]))))

(defn nav-link [label target current]
  (let [active? (= target current)]
    [:button.text-sm.font-medium.px-3.py-2.rounded-md.transition-colors
     {:type "button"
      :class (if active?
               "bg-blue-100 text-blue-800"
               "text-gray-700 hover:bg-gray-100")
      :on-click #(router/navigate! target)}
     label]))

(defn main-layout [issues prs worktrees worktree-config connected? repo]
  [:div.h-screen.bg-gray-50.flex.flex-col.overflow-hidden
   ;; header
   [:header.bg-white.shadow-sm.border-b.border-gray-200.flex-shrink-0
    [:div.max-w-7xl.mx-auto.px-4.py-4
     [:div.flex.items-center.justify-between
      [:div
       [:h1.text-3xl.font-bold.text-gray-900 "Opencode Reactant"]
       [:div.mt-1.flex.items-center.gap-4
        [repo-controls repo]
        [:div.flex.items-center.gap-2
         [:div.w-2.h-2.rounded-full {:class (if connected? "bg-green-500" "bg-red-500")}]
         [:span.text-sm.font-medium (if connected? "text-green-600" "text-red-600")]
         [:span (if connected? "Connected" "Disconnected")]]]]
      [:div.flex.items-center.gap-2
       [nav-link "Dashboard" ::router/home (:name @router/current-page)]
       [nav-link "Issues" ::router/issues (:name @router/current-page)]
       [nav-link "PRs" ::router/prs (:name @router/current-page)]
       [nav-link "Worktrees" ::router/worktrees (:name @router/current-page)]
       [nav-link "Files" ::router/files (:name @router/current-page)]
       [nav-link "Events" ::router/events (:name @router/current-page)]]]]]
   ;; main
   [:main.max-w-7xl.mx-auto.px-4.py-6.flex-1.overflow-hidden.flex.flex-col
    [:div.flex-1.grid.grid-cols-1.lg:grid-cols-2.gap-6.min-h-0.overflow-hidden
     [issues-section issues]
     [prs-section prs]]
    [:div.grid.grid-cols-1.md:grid-cols-2.xl:grid-cols-3.gap-6.mt-6.flex-1.min-h-0
     [file-explorer]
     [worktrees-section worktrees worktree-config]
     [events-log]]]])





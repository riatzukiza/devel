(ns opencode.ui.detail
  (:require [reagent.core :as r]
            [opencode.ui.state :as S]
            [opencode.ui.github :as gh]
            [opencode.ui.router :as router]))

;; ===== Helper Components =====

(defn loading-spinner []
  [:div.flex.items-center.justify-center.h-64
   [:div.animate-spin.rounded-full.h-12.w-12.border-4.border-gray-300.border-t-blue-600]])

(defn error-message [error]
  [:div.bg-red-50.border.border-red-200.text-red-700.px-4.py-3.rounded-md.m-4
   [:div.flex
    [:div.flex-shrink-0
     [:svg.h-5.w-5.text-red-400 {:viewBox "0 0 20 20" :fill "currentColor"}
      [:path {:fill-rule "evenodd" :d "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" :clip-rule "evenodd"}]]]
    [:div.ml-3
     [:h3.text-sm.font-medium "Error"]
     [:div.text-sm error]]]])

(defn back-button [target]
  [:button.flex.items-center.text-blue-600.hover:text-blue-800.mb-4.transition-colors
   {:on-click #(router/navigate! target)}
   [:svg.w-4.h-4.mr-2 {:viewBox "0 0 20 20" :fill "currentColor"}
    [:path {:fill-rule "evenodd" :d "M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" :clip-rule "evenodd"}]]
   "Back"])

(defn issue-content [data]
  [:div.flex-1.overflow-y-auto.p-6
   [:div.max-w-4xl.mx-auto
    ;; Issue header
    [:div.bg-white.rounded-lg.shadow-sm.p-6.mb-6
     [:div.flex.items-center.justify-between.mb-4
      [:h1.text-2xl.font-bold.text-gray-900 (:title data)]
      [:span.px-3.py-1.text-sm.font-semibold.rounded-full
       {:class (if (= (:state data) "open")
                 "bg-green-100.text-green-800"
                 "bg-gray-100.text-gray-800")}
       (:state data)]]
     [:div.text-sm.text-gray-500.mb-4
      [:span "Issue #" (:number data)]
      [:span.mx-2 "•"]
      [:span (str "Created by " (:user data))]]
     [:div.text-gray-700.whitespace-pre-wrap (:body data)]]

    ;; Comments section
    [:div.space-y-4
     (doall
       (for [comment (:comments data)]
         ^{:key (:id comment)}
         [:div.bg-white.rounded-lg.shadow-sm.p-4
          [:div.flex.items-center.mb-3
           [:div.w-8.h-8.bg-gray-300.rounded-full.mr-3]
           [:div
            [:div.text-sm.font-medium.text-gray-900 (:user comment)]
            [:div.text-xs.text-gray-500 (:created_at comment)]]]
          [:div.text-gray-700.whitespace-pre-wrap (:body comment)]]))]]])

(defn pr-content [data]
  [:div.flex-1.overflow-y-auto.p-6
   [:div.max-w-4xl.mx-auto
    ;; PR header
    [:div.bg-white.rounded-lg.shadow-sm.p-6.mb-6
     [:div.flex.items-center.justify-between.mb-4
      [:h1.text-2xl.font-bold.text-gray-900 (:title data)]
      [:span.px-3.py-1.text-sm.font-semibold.rounded-full
       {:class (if (= (:state data) "open")
                 "bg-green-100.text-green-800"
                 "bg-red-100.text-red-800")}
       (:state data)]]
     [:div.text-sm.text-gray-500.mb-4
      [:span "PR #" (:number data)]
      [:span.mx-2 "•"]
      [:span (str "Created by " (:user data))]]
     [:div.text-gray-700.whitespace-pre-wrap (:body data)]]

    ;; Files changed section
    [:div.bg-white.rounded-lg.shadow-sm.p-6.mb-6
     [:h2.text-lg.font-semibold.text-gray-900.mb-4 "Files Changed"]
     (for [file (:files data)]
       ^{:key (:filename file)}
       [:div.border-b.border-gray-200.py-3.last:border-b-0
        [:div.flex.items-center.justify-between
         [:div.flex-1
          [:div.text-sm.font-medium.text-gray-900 (:filename file)]
          [:div.text-xs.text-gray-500 (str "+" (:additions file) " -" (:deletions file))]]
         [:button.text-blue-600.hover:text-blue-800.text-sm "View"]]])]

    ;; Comments section
    [:div.space-y-4
     (doall
       (for [comment (:comments data)]
         ^{:key (:id comment)}
         [:div.bg-white.rounded-lg.shadow-sm.p-4
          [:div.flex.items-center.mb-3
           [:div.w-8.h-8.bg-gray-300.rounded-full.mr-3]
           [:div
            [:div.text-sm.font-medium.text-gray-900 (:user comment)]
            [:div.text-xs.text-gray-500 (:created_at comment)]]]
          [:div.text-gray-700.whitespace-pre-wrap (:body comment)]]))]]])

;; ===== Main Detail Components =====

(defn issue-detail []
  (let [issue-id (get-in @router/current-page [:params :id])
        data (r/atom nil)
        loading? (r/atom true)
        error (r/atom nil)
        stop-watch (atom nil)]
    (r/create-class
      {:component-did-mount
       (fn []
         (reset! loading? true)
         (reset! error nil)
         (reset! data nil)
         (let [repo (:repo @S/!state)
               cache-key (str repo "/" issue-id)
               cached-data (get @gh/issue-detail-cache cache-key)]
           (if cached-data
             (do
               (when (:error cached-data)
                 (reset! error (:error cached-data)))
               (reset! data (when-not (:error cached-data) cached-data))
               (reset! loading? false))
             (do
               (reset! stop-watch
                       (gh/watch-cache-once!
                         gh/issue-detail-cache cache-key
                         (fn [cached]
                           (if (:error cached)
                             (reset! error (:error cached))
                             (reset! data cached))
                           (reset! loading? false))))
               (gh/fetch-issue-detail! issue-id)))))
       :component-will-unmount
       (fn []
         (when-let [stop @stop-watch]
           (stop)))
       :reagent-render
       (fn []
         [:div.h-screen.bg-gray-50.flex.flex-col
          [back-button ::router/issues]
          (cond
            @loading? [loading-spinner]
            @error [error-message @error]
            @data [issue-content @data]
            :else nil)])})))

(defn pr-detail []
  (let [pr-id (get-in @router/current-page [:params :id])
        data (r/atom nil)
        loading? (r/atom true)
        error (r/atom nil)
        stop-watch (atom nil)]
    (r/create-class
      {:component-did-mount
       (fn []
         (reset! loading? true)
         (reset! error nil)
         (reset! data nil)
         (let [repo (:repo @S/!state)
               cache-key (str repo "/" pr-id)
               cached-data (get @gh/pr-detail-cache cache-key)]
           (if cached-data
             (do
               (when (:error cached-data)
                 (reset! error (:error cached-data)))
               (reset! data (when-not (:error cached-data) cached-data))
               (reset! loading? false))
             (do
               (reset! stop-watch
                       (gh/watch-cache-once!
                         gh/pr-detail-cache cache-key
                         (fn [cached]
                           (if (:error cached)
                             (reset! error (:error cached))
                             (reset! data cached))
                           (reset! loading? false))))
               (gh/fetch-pr-detail! pr-id)))))
       :component-will-unmount
       (fn []
         (when-let [stop @stop-watch]
           (stop)))
       :reagent-render
       (fn []
         [:div.h-screen.bg-gray-50.flex.flex-col
          [back-button ::router/prs]
          (cond
            @loading? [loading-spinner]
            @error [error-message @error]
            @data [pr-content @data]
            :else nil)])})))

(ns devel.ui.primitives.pagination
  "Pagination component implementing the pagination.edn contract.
   
   Page navigation controls with previous/next buttons and status display.
   
   Usage:
   ```clojure
   [pagination
    {:page @current-page
     :total-pages 10
     :on-page-change #(reset! current-page %)}]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

(defn- container-styles
  "Get container styles from tokens."
  []
  {:display "flex"
   :justify-content "center"
   :align-items "center"
   :gap (str (get tokens/spacing 3) "px")
   :padding (str (get tokens/spacing 3) "px")
   :border-top (str "1px solid " (get-in tokens/colors [:border :default]))
   :background-color (get-in tokens/colors [:background :surface])})

(defn- button-styles
  "Get button styles, optionally disabled."
  [disabled?]
  (merge
   {:padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
    :border-radius (str (get tokens/spacing 1) "px")
    :border (str "1px solid " (get-in tokens/colors [:border :default]))
    :background-color (get-in tokens/colors [:background :default])
    :color (get-in tokens/colors [:text :default])
    :font-family (:sans tokens/font-family)
    :font-size (get tokens/font-size :sm)
    :font-weight (:medium tokens/font-weight)
    :cursor "pointer"
    :transition "background-color 0.15s ease"}
   (when disabled?
     {:cursor "not-allowed"
      :color (get-in tokens/colors [:text :muted])
      :opacity 0.6})))

(defn- status-styles
  "Get status text styles."
  []
  {:font-size (get tokens/font-size :sm)
   :color (get-in tokens/colors [:text :secondary])
   :font-family (:sans tokens/font-family)})

(defn pagination
  "Pagination controls for navigating through paged content.
   
   Props:
   - :page - Current page number (1-indexed) (required)
   - :total-pages - Total number of pages (required)
   - :on-page-change - Callback (page) => void (required)
   - :disabled - Whether pagination is disabled (default: false)
   - :show-status - Whether to show 'Page X of Y' (default: true)
   - :previous-label - Label for previous button (default: 'Previous')
   - :next-label - Label for next button (default: 'Next')
   
   Returns nil if total-pages <= 1.
   
   Example:
   ```clojure
   (let [page (r/atom 1)]
     [pagination
      {:page @page
       :total-pages 10
       :on-page-change #(reset! page %)}])
   ```"
  [{:keys [page total-pages on-page-change disabled show-status
           previous-label next-label]
    :or {disabled false
         show-status true
         previous-label "Previous"
         next-label "Next"}
    :as props}]
  ;; Don't render if only one page
  (when (> total-pages 1)
    (let [can-go-previous? (and (> page 1) (not disabled))
          can-go-next? (and (< page total-pages) (not disabled))
          handle-previous #(when can-go-previous?
                            (on-page-change (dec page)))
          handle-next #(when can-go-next?
                        (on-page-change (inc page)))]
      [:div
       {:data-component "pagination"
        :data-page page
        :data-total-pages total-pages
        :style (container-styles)
        :role "navigation"
        :aria-label "Pagination"}
       
       ;; Previous button
       [:button
        {:data-testid "pagination-prev"
         :on-click handle-previous
         :disabled (or (not can-go-previous?) disabled)
         :style (button-styles (not can-go-previous?))
         :aria-label "Go to previous page"}
        previous-label]
       
       ;; Status
       (when show-status
         [:span
          {:data-testid "pagination-status"
           :style (status-styles)
           :aria-live "polite"}
          (str "Page " page " of " total-pages)])
       
       ;; Next button
       [:button
        {:data-testid "pagination-next"
         :on-click handle-next
         :disabled (or (not can-go-next?) disabled)
         :style (button-styles (not can-go-next?))
         :aria-label "Go to next page"}
        next-label]])))

;; --- Utility Functions ---

(defn paginate-items
  "Utility function to paginate items.
   Returns a slice of items for the given page.
   
   Parameters:
   - items - Collection of items to paginate
   - page - Current page (1-indexed)
   - page-size - Number of items per page
   
   Returns: Paginated slice of items
   
   Example:
   ```clojure
   (paginate-items (range 100) 2 10)
   ;; => (10 11 12 13 14 15 16 17 18 19)
   ```"
  [items page page-size]
  (let [safe-page (max 1 page)
        safe-page-size (max 1 page-size)
        offset (* (dec safe-page) safe-page-size)]
    (->> items
         (drop offset)
         (take safe-page-size))))

(defn calculate-total-pages
  "Utility function to calculate total pages.
   
   Parameters:
   - total-items - Total number of items
   - page-size - Number of items per page
   
   Returns: Total number of pages (minimum 1)
   
   Example:
   ```clojure
   (calculate-total-pages 95 10)
   ;; => 10
   ```"
  [total-items page-size]
  (if (<= page-size 0)
    1
    (max 1 (Math/ceil (/ total-items page-size)))))

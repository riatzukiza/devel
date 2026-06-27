(ns devel.ui.react-interop
  "React-backed parity layer for the Reagent package.

   These wrappers reuse the canonical React implementation from ../dist,
   while accepting idiomatic ClojureScript props and children.

   Performance notes:
   - callback wrappers are cached by function identity
   - converted CLJS maps/vectors are cached by object identity
   - already-created React elements pass straight through"
  (:require [clojure.string :as str]
            [goog.object :as gobj]
            [reagent.core :as r]
            ["react" :as react]
            ["@open-hax/uxx" :as uxx]
            ["@open-hax/uxx/primitives" :as primitives]))

(defonce ^:private callback-cache (js/WeakMap.))
(defonce ^:private map-cache (js/WeakMap.))
(defonce ^:private vector-cache (js/WeakMap.))
(defonce ^:private prop-key-cache (js/Map.))

(defn- react-element? [value]
  (boolean
   (and value
        (not (map? value))
        (let [t (goog/typeOf value)]
          (or (= t "object") (= t "function")))
        (some? (gobj/get value "$$typeof")))))

(defn- hiccup-form? [value]
  (and (vector? value)
       (let [tag (first value)]
         (or (keyword? tag)
             (string? tag)
             (symbol? tag)
             (fn? tag)
             (react-element? tag)))))

(defn- kebab->camel [s]
  (str/replace s #"-([a-zA-Z0-9])" #(str/upper-case (%1 1))))

(defn- normalize-prop-key [s]
  (cond
    (= s "class") "className"
    (= s "for") "htmlFor"
    (or (str/starts-with? s "data-")
        (str/starts-with? s "aria-")
        (str/starts-with? s "--")) s
    :else (kebab->camel s)))

(defn- prop-key [key]
  (let [s (cond
            (keyword? key) (name key)
            (string? key) key
            :else (str key))]
    (if (.has prop-key-cache s)
      (.get prop-key-cache s)
      (let [normalized (normalize-prop-key s)]
        (.set prop-key-cache s normalized)
        normalized))))

(declare js-value)

(defn- wrap-callback [f]
  (if (.has callback-cache f)
    (.get callback-cache f)
    (let [wrapped (fn [& args]
                    (js-value (apply f args)))]
      (.set callback-cache f wrapped)
      wrapped)))

(defn- vector->js-array [xs]
  (if (.has vector-cache xs)
    (.get vector-cache xs)
    (let [arr (->> xs
                   (remove nil?)
                   (map js-value)
                   into-array)]
      (.set vector-cache xs arr)
      arr)))

(defn- seq->js-array [xs]
  (if (vector? xs)
    (vector->js-array xs)
    (->> xs
         (remove nil?)
         (map js-value)
         into-array)))

(defn- map->js-props [m]
  (if (.has map-cache m)
    (.get map-cache m)
    (let [o #js {}]
      (doseq [[k v] m]
        (when-not (nil? v)
          (gobj/set o (prop-key k) (js-value v))))
      (.set map-cache m o)
      o)))

(defn- props->js [props]
  (cond
    (nil? props) nil
    (map? props) (map->js-props props)
    :else props))

(defn- js-value [value]
  (cond
    (nil? value) nil
    (react-element? value) value
    (fn? value) (wrap-callback value)
    (keyword? value) (name value)
    (hiccup-form? value) (r/as-element value)
    (map? value) (map->js-props value)
    (vector? value) (vector->js-array value)
    (sequential? value) (seq->js-array value)
    :else value))

(defn- children-prop [children]
  (let [xs (->> children (remove nil?) vec)]
    (case (count xs)
      0 nil
      1 (js-value (first xs))
      (vector->js-array xs))))

(defn wrap-react-component [component]
  (fn [& args]
    (let [[props children] (if (map? (first args))
                             [(first args) (rest args)]
                             [nil args])
          props (cond-> (or props {})
                  (seq children) (assoc :children (children-prop children)))]
      (react/createElement component (props->js props)))))

(def theme-provider (wrap-react-component uxx/ThemeProvider))
(def toast-provider (wrap-react-component primitives/ToastProvider))
(def entity-card (wrap-react-component uxx/EntityCard))

(def button (wrap-react-component primitives/Button))
(def badge (wrap-react-component primitives/Badge))
(def spinner (wrap-react-component primitives/Spinner))
(def card (wrap-react-component primitives/Card))
(def card-header (wrap-react-component primitives/CardHeader))
(def card-body (wrap-react-component primitives/CardBody))
(def card-footer (wrap-react-component primitives/CardFooter))
(def modal (wrap-react-component primitives/Modal))
(def modal-header (wrap-react-component primitives/ModalHeader))
(def modal-body (wrap-react-component primitives/ModalBody))
(def modal-footer (wrap-react-component primitives/ModalFooter))
(def tooltip (wrap-react-component primitives/Tooltip))
(def input (wrap-react-component primitives/Input))
(def select (wrap-react-component primitives/Select))
(def textarea (wrap-react-component primitives/Textarea))
(def progress (wrap-react-component primitives/Progress))
(def resizable-pane (wrap-react-component primitives/ResizablePane))
(def which-key-popup (wrap-react-component primitives/WhichKeyPopup))
(def inspector-pane (wrap-react-component primitives/InspectorPane))
(def context-section (wrap-react-component primitives/ContextSection))
(def pinned-tabs-bar (wrap-react-component primitives/PinnedTabsBar))
(def permission-card (wrap-react-component primitives/PermissionCard))
(def prompt-card (wrap-react-component primitives/PromptCard))
(def permission-prompts (wrap-react-component primitives/PermissionPrompts))
(def react-reagent-seam (wrap-react-component primitives/ReactReagentSeam))
(def command-palette (wrap-react-component primitives/CommandPalette))
(def chat (wrap-react-component primitives/Chat))
(def toast (wrap-react-component primitives/Toast))
(def file-tree (wrap-react-component primitives/FileTree))
(def tabs (wrap-react-component primitives/Tabs))
(def searchable-select (wrap-react-component primitives/SearchableSelect))
(def collapsible-panel (wrap-react-component primitives/CollapsiblePanel))
(def key-value-section (wrap-react-component primitives/KeyValueSection))
(def surface-hero (wrap-react-component primitives/SurfaceHero))
(def panel-header (wrap-react-component primitives/PanelHeader))
(def metric-tile (wrap-react-component primitives/MetricTile))
(def metric-tile-grid (wrap-react-component primitives/MetricTileGrid))
(def filter-toolbar (wrap-react-component primitives/FilterToolbar))
(def action-strip (wrap-react-component primitives/ActionStrip))
(def status-chip-stack (wrap-react-component primitives/StatusChipStack))
(def data-table-shell (wrap-react-component primitives/DataTableShell))
(def pagination (wrap-react-component primitives/Pagination))
(def feed (wrap-react-component primitives/Feed))
(def markdown (wrap-react-component primitives/Markdown))
(def code-block (wrap-react-component primitives/CodeBlock))
(def diff-viewer (wrap-react-component primitives/DiffViewer))
(def markdown-editor (wrap-react-component primitives/MarkdownEditor))
(def rich-text-editor (wrap-react-component primitives/RichTextEditor))

(def use-toast primitives/useToast)
(def use-adapter primitives/useAdapter)
(def paginate-items primitives/paginateItems)
(def calculate-total-pages primitives/calculateTotalPages)
(def use-uxx-theme uxx/useUxxTheme)
(def use-resolved-theme uxx/useResolvedTheme)
(def use-theme-name uxx/useThemeName)

(def components
  {:entity-card entity-card
   :button button
   :badge badge
   :spinner spinner
   :card card
   :card-header card-header
   :card-body card-body
   :card-footer card-footer
   :modal modal
   :modal-header modal-header
   :modal-body modal-body
   :modal-footer modal-footer
   :tooltip tooltip
   :input input
   :select select
   :textarea textarea
   :progress progress
   :resizable-pane resizable-pane
   :which-key-popup which-key-popup
   :inspector-pane inspector-pane
   :context-section context-section
   :pinned-tabs-bar pinned-tabs-bar
   :permission-card permission-card
   :prompt-card prompt-card
   :permission-prompts permission-prompts
   :react-reagent-seam react-reagent-seam
   :command-palette command-palette
   :chat chat
   :toast toast
   :file-tree file-tree
   :tabs tabs
   :searchable-select searchable-select
   :collapsible-panel collapsible-panel
   :key-value-section key-value-section
   :surface-hero surface-hero
   :panel-header panel-header
   :metric-tile metric-tile
   :metric-tile-grid metric-tile-grid
   :filter-toolbar filter-toolbar
   :action-strip action-strip
   :status-chip-stack status-chip-stack
   :data-table-shell data-table-shell
   :pagination pagination
   :feed feed
   :markdown markdown
   :code-block code-block
   :diff-viewer diff-viewer
   :markdown-editor markdown-editor
   :rich-text-editor rich-text-editor})

(def providers
  {:theme-provider theme-provider
   :toast-provider toast-provider})

(def hooks
  {:use-toast use-toast
   :use-adapter use-adapter
   :use-uxx-theme use-uxx-theme
   :use-resolved-theme use-resolved-theme
   :use-theme-name use-theme-name})

(def utilities
  {:paginate-items paginate-items
   :calculate-total-pages calculate-total-pages})

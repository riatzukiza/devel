# @open-hax/uxx-helix

Helix binding for the Open Hax UI kit.

## Status

This package now mirrors the public React component surface by wrapping the canonical React build in `../dist/`.

That gives Helix consumers the same component inventory, providers, and helper utilities as the React package, while keeping the authoring experience idiomatic for ClojureScript.

## Import

```clojure
(ns app.ui
  (:require [helix.core :refer [$]]
            [devel.ui.helix.core :as ui]))
```

## Props and children

The wrapper layer normalizes idiomatic CLJS input to React props:

- kebab-case prop keys become camelCase where React expects it
- `:class` becomes `className`
- `data-*` and `aria-*` props stay dashed
- keyword enum values become strings
- Helix children pass through as React children

## Example

```clojure
(ns app.core
  (:require [helix.core :refer [$]]
            [devel.ui.helix.core :as ui]))

(defn shell []
  ($ ui/theme-provider {:theme :night-owl}
     ($ ui/toast-provider {:position :top-right}
        ($ ui/card {:title "Agent console"}
           ($ ui/status-chip-stack
              {:items [{:label "ready" :tone :success}
                       {:label "synced" :tone :info}]})
           ($ ui/button {:variant :primary} "Launch")
           ($ ui/markdown {:content "# Hello from Helix"})))))
```

## Public surface

### Providers

- `theme-provider`
- `toast-provider`

### Hooks and helpers

Advanced consumers can also reach through to the React hooks and helpers:

- `use-toast`
- `use-adapter`
- `use-uxx-theme`
- `use-resolved-theme`
- `use-theme-name`
- `paginate-items`
- `calculate-total-pages`

Normal React hook rules still apply.

### Components

- `button`, `badge`, `spinner`, `card`, `card-header`, `card-body`, `card-footer`, `modal`, `modal-header`, `modal-body`, `modal-footer`, `tooltip`, `input`, `select`, `textarea`, `progress`
- `resizable-pane`, `which-key-popup`, `inspector-pane`, `context-section`, `pinned-tabs-bar`, `permission-card`, `prompt-card`, `permission-prompts`, `react-reagent-seam`, `command-palette`, `chat`, `toast`, `file-tree`, `tabs`
- `searchable-select`, `collapsible-panel`, `key-value-section`, `surface-hero`, `panel-header`, `metric-tile`, `metric-tile-grid`, `filter-toolbar`, `action-strip`, `status-chip-stack`, `data-table-shell`, `pagination`
- `feed`, `markdown`, `code-block`, `diff-viewer`, `markdown-editor`, `rich-text-editor`

## Build

```bash
cd orgs/open-hax/uxx
npm run build
cd helix
npm run build
```

### pnpm + shadow-cljs consumers

If your app uses `pnpm` and builds with `shadow-cljs`, add this to the app repo:

```ini
# .npmrc
node-linker=hoisted
```

## Watch

```bash
cd orgs/open-hax/uxx/helix
npm run watch
```

## Notes

- The React package remains the canonical implementation.
- This package intentionally prioritizes parity and documentation clarity over divergent custom rendering.
- React-only compositions like `EntityCard` are still not exposed here until explicit wrapper support is added.

See [`../docs/framework-parity.md`](../docs/framework-parity.md) for the detailed matrix.

## License

LGPL-3.0-or-later

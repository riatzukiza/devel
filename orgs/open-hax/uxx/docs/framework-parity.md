# Framework parity matrix

This document tracks the public API contract across the three framework bindings in this repo:

- React: `@open-hax/uxx`
- Reagent: `@open-hax/uxx-reagent`
- Helix: `@open-hax/uxx-helix`

## Scope

Parity here means **public exported surface**, not every source file in `react/`.

`react/src/compositions/EntityCard.tsx` is now public in the React root package, but it remains outside CLJS parity until explicit Reagent and Helix wrappers are added.

## Providers

| Export | React | Reagent | Helix | Notes |
| --- | --- | --- | --- | --- |
| `ThemeProvider` / `theme-provider` | ✅ | ✅ | ✅ | Shared theme boundary |
| `ToastProvider` / `toast-provider` | ✅ | ✅ | ✅ | Shared toast context |

## Hooks and helpers

| Export | React | Reagent | Helix | Notes |
| --- | --- | --- | --- | --- |
| `useUxxTheme` / `use-uxx-theme` | ✅ | ✅ | ✅ | React hook rules still apply |
| `useResolvedTheme` / `use-resolved-theme` | ✅ | ✅ | ✅ | React hook rules still apply |
| `useThemeName` / `use-theme-name` | ✅ | ✅ | ✅ | React hook rules still apply |
| `useToast` / `use-toast` | ✅ | ✅ | ✅ | React hook rules still apply |
| `useAdapter` / `use-adapter` | ✅ | ✅ | ✅ | React hook rules still apply |
| `paginateItems` / `paginate-items` | ✅ | ✅ | ✅ | Helper passthrough |
| `calculateTotalPages` / `calculate-total-pages` | ✅ | ✅ | ✅ | Helper passthrough |

## Components

### Foundations

| React export | Reagent var | Helix var | Status |
| --- | --- | --- | --- |
| `Button` | `button` | `button` | ✅ |
| `Badge` | `badge` | `badge` | ✅ |
| `Spinner` | `spinner` | `spinner` | ✅ |
| `Card` | `card` | `card` | ✅ |
| `CardHeader` | `card-header` | `card-header` | ✅ |
| `CardBody` | `card-body` | `card-body` | ✅ |
| `CardFooter` | `card-footer` | `card-footer` | ✅ |
| `Modal` | `modal` | `modal` | ✅ |
| `ModalHeader` | `modal-header` | `modal-header` | ✅ |
| `ModalBody` | `modal-body` | `modal-body` | ✅ |
| `ModalFooter` | `modal-footer` | `modal-footer` | ✅ |
| `Tooltip` | `tooltip` | `tooltip` | ✅ |
| `Input` | `input` | `input` | ✅ |
| `Select` | `select` | `select` | ✅ |
| `Textarea` | `textarea` | `textarea` | ✅ |
| `Progress` | `progress` | `progress` | ✅ |

### Workspace and interaction

| React export | Reagent var | Helix var | Status |
| --- | --- | --- | --- |
| `ResizablePane` | `resizable-pane` | `resizable-pane` | ✅ |
| `WhichKeyPopup` | `which-key-popup` | `which-key-popup` | ✅ |
| `InspectorPane` | `inspector-pane` | `inspector-pane` | ✅ |
| `ContextSection` | `context-section` | `context-section` | ✅ |
| `PinnedTabsBar` | `pinned-tabs-bar` | `pinned-tabs-bar` | ✅ |
| `PermissionCard` | `permission-card` | `permission-card` | ✅ |
| `PromptCard` | `prompt-card` | `prompt-card` | ✅ |
| `PermissionPrompts` | `permission-prompts` | `permission-prompts` | ✅ |
| `ReactReagentSeam` | `react-reagent-seam` | `react-reagent-seam` | ✅ |
| `CommandPalette` | `command-palette` | `command-palette` | ✅ |
| `Chat` | `chat` | `chat` | ✅ |
| `Toast` | `toast` | `toast` | ✅ |
| `FileTree` | `file-tree` | `file-tree` | ✅ |
| `Tabs` | `tabs` | `tabs` | ✅ |

### Data, dashboards, and chrome

| React export | Reagent var | Helix var | Status |
| --- | --- | --- | --- |
| `SearchableSelect` | `searchable-select` | `searchable-select` | ✅ |
| `CollapsiblePanel` | `collapsible-panel` | `collapsible-panel` | ✅ |
| `KeyValueSection` | `key-value-section` | `key-value-section` | ✅ |
| `SurfaceHero` | `surface-hero` | `surface-hero` | ✅ |
| `PanelHeader` | `panel-header` | `panel-header` | ✅ |
| `MetricTile` | `metric-tile` | `metric-tile` | ✅ |
| `MetricTileGrid` | `metric-tile-grid` | `metric-tile-grid` | ✅ |
| `FilterToolbar` | `filter-toolbar` | `filter-toolbar` | ✅ |
| `ActionStrip` | `action-strip` | `action-strip` | ✅ |
| `StatusChipStack` | `status-chip-stack` | `status-chip-stack` | ✅ |
| `DataTableShell` | `data-table-shell` | `data-table-shell` | ✅ |
| `Pagination` | `pagination` | `pagination` | ✅ |

### Content and editors

| React export | Reagent var | Helix var | Status |
| --- | --- | --- | --- |
| `Feed` | `feed` | `feed` | ✅ |
| `Markdown` | `markdown` | `markdown` | ✅ |
| `CodeBlock` | `code-block` | `code-block` | ✅ |
| `DiffViewer` | `diff-viewer` | `diff-viewer` | ✅ |
| `MarkdownEditor` | `markdown-editor` | `markdown-editor` | ✅ |
| `RichTextEditor` | `rich-text-editor` | `rich-text-editor` | ✅ |

### Compositions

| React export | Reagent var | Helix var | Status |
| --- | --- | --- | --- |
| `EntityCard` | — | — | React public; CLJS parity pending |

## Implementation strategy

Reagent and Helix now wrap the canonical built React exports from `dist/` instead of carrying a separate hand-maintained implementation per component.

Benefits:

- new public React components can be surfaced in CLJS bindings quickly
- behavior and visual fixes land once
- docs can describe one public surface instead of three drifting ones
- parity review becomes an exports problem, not a reimplementation problem

## Prop normalization rules in CLJS bindings

Both CLJS bindings normalize props before passing them to React:

- kebab-case keys become camelCase when appropriate
- `:class` becomes `className`
- `data-*` and `aria-*` keys stay dashed
- keyword enum values become strings
- callback return values are normalized back into React-friendly values
- Reagent additionally converts Hiccup nodes passed through props into React elements

## Maintenance checklist

When adding a new public React export:

1. add or confirm the export in the React package
2. rebuild `orgs/open-hax/uxx`
3. expose the wrapper in `reagent/src/devel/ui/react_interop.cljs`
4. expose the wrapper in `helix/src/devel/ui/helix/react_interop.cljs`
5. re-export from each package core namespace
6. update this parity matrix and package READMEs

## Validation commands

```bash
cd orgs/open-hax/uxx && npm run build
cd orgs/open-hax/uxx/reagent && npm run build
cd orgs/open-hax/uxx/helix && npm run build
```

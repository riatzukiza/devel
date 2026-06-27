# @open-hax/uxx

Open Hax UI kit with shared tokens plus framework bindings for React, Reagent, and Helix.


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Packages

| Package | Audience | Status | Docs |
| --- | --- | --- | --- |
| `@open-hax/uxx` | React apps | Canonical implementation | [`react/README.md`](./react/README.md) |
| `@open-hax/uxx-reagent` | Reagent apps | React-backed parity layer | [`reagent/README.md`](./reagent/README.md) |
| `@open-hax/uxx-helix` | Helix apps | React-backed parity layer | [`helix/README.md`](./helix/README.md) |
| `@open-hax/uxx/tokens` | Design token consumers | Shared source of truth | [`tokens/`](./tokens) |

## What changed

The Reagent and Helix packages now target the same public component surface as the React package by wrapping the canonical React build in `dist/`.

That gives the three bindings the same:

- public component inventory
- visual behavior
- token usage
- provider surface for theme + toast
- helper utilities for pagination

React-only hooks still exist as hooks, but they are re-exported for advanced ClojureScript consumers who know the normal React hook rules.

## Component coverage

Public parity now covers these exported components:

- Foundations: `Button`, `Badge`, `Spinner`, `Card`, `CardHeader`, `CardBody`, `CardFooter`, `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`, `Tooltip`, `Input`, `Select`, `Textarea`, `Progress`
- Workspace UI: `ResizablePane`, `WhichKeyPopup`, `InspectorPane`, `ContextSection`, `PinnedTabsBar`, `PermissionCard`, `PromptCard`, `PermissionPrompts`, `ReactReagentSeam`, `CommandPalette`, `Chat`, `Toast`, `FileTree`, `Tabs`
- Data + structure: `SearchableSelect`, `CollapsiblePanel`, `KeyValueSection`, `SurfaceHero`, `PanelHeader`, `MetricTile`, `MetricTileGrid`, `FilterToolbar`, `ActionStrip`, `StatusChipStack`, `DataTableShell`, `Pagination`
- Content + editors: `Feed`, `Markdown`, `CodeBlock`, `DiffViewer`, `MarkdownEditor`, `RichTextEditor`

React now also exports the first composition-level component:

- Compositions: `EntityCard` (React public now; Reagent/Helix parity pending)

The new section primitives are now public across all three bindings:

- `CardHeader`, `CardBody`, `CardFooter`
- `ModalHeader`, `ModalBody`, `ModalFooter`

See [`docs/framework-parity.md`](./docs/framework-parity.md) for the detailed matrix and framework notes.

## Quick start

### Themes and palettes

```ts
import {
  themePacks,
  createThemePack,
  getThemeCssVars,
  monokai,
  nightOwl,
  proxyConsole,
} from '@open-hax/uxx/tokens';

const theme = createThemePack(themePacks['proxy-console'], {
  colors: { accent: { cyan: '#16e0ff' } },
});

const cssVars = getThemeCssVars(theme);
```

For Eta Mu / Pi, `@open-hax/uxx` publishes generated terminal theme JSON files under `dist/eta-mu-themes` and declares them in the package `pi.themes` manifest. After installing the package as a Pi package, select one of:

- `uxx-monokai`
- `uxx-night-owl`
- `uxx-proxy-console`

Programmatic Eta Mu adapters are also available:

```ts
import { etaMuThemes, createEtaMuThemeJson } from '@open-hax/uxx/eta-mu';
```

### React

```bash
cd orgs/open-hax/uxx
npm install
npm run build
```

```tsx
import { ThemeProvider, Button, Card, EntityCard } from '@open-hax/uxx';

export function Example() {
  return (
    <ThemeProvider theme="night-owl">
      <Card title="Status">
        <Button variant="primary">Ship it</Button>
      </Card>
      <EntityCard
        id="agent-1"
        name="Compiler Agent"
        type="worker"
        status={{ value: 'ready', variant: 'success' }}
      />
    </ThemeProvider>
  );
}
```

Built-in themes now include `monokai`, `night-owl`, and `proxy-console`. The canonical provider is `ThemeProvider`; `UxxThemeProvider` is available as a backward-compatible alias for the collaborator-proposed theme-pack surface.

### Reagent

```bash
cd orgs/open-hax/uxx/reagent
npm install
npm run build
```

```clojure
(ns app.core
  (:require [devel.ui.core :as ui]))

(defn screen []
  [ui/theme-provider {:theme :night-owl}
   [ui/card {:title "Status"}
    [ui/button {:variant :primary} "Ship it"]]])
```

### Helix

```bash
cd orgs/open-hax/uxx/helix
npm install
npm run build
```

```clojure
(ns app.core
  (:require [helix.core :refer [$]]
            [devel.ui.helix.core :as ui]))

(defn screen []
  ($ ui/theme-provider {:theme :night-owl}
     ($ ui/card {:title "Status"}
        ($ ui/button {:variant :primary} "Ship it"))))
```

## Architecture

- `react/` contains the canonical TypeScript + React implementation.
- `dist/` is the generated build artifact consumed by the ClojureScript bindings.
- `reagent/` and `helix/` translate idiomatic CLJS props into the React prop surface.
- `tokens/` remains the shared design-token source.

This means parity work lands once in React and can be surfaced in Reagent and Helix without reimplementing every component three times.

## Docs

- [`react/README.md`](./react/README.md)
- [`reagent/README.md`](./reagent/README.md)
- [`helix/README.md`](./helix/README.md)
- [`docs/framework-parity.md`](./docs/framework-parity.md)

## Build matrix

```bash
# Canonical React + tokens build
cd orgs/open-hax/uxx && npm run build

# Reagent wrapper build
cd orgs/open-hax/uxx/reagent && npm run build

# Helix wrapper build
cd orgs/open-hax/uxx/helix && npm run build
```

## Using with shadow-cljs in pnpm projects

If you consume `@open-hax/uxx`, `@open-hax/uxx-reagent`, or `@open-hax/uxx-helix` from a
project that builds with `shadow-cljs` **and** uses `pnpm`, you will likely need a
hoisted `node_modules` layout.

Reason: `shadow-cljs` resolves npm deps by searching a small set of `node_modules`
folders, and it can fail to see pnpm's default symlinked dependency graph for
transitive dependencies (for example `react-markdown`'s internals).

Add this to your *consumer* repo (not this library):

```ini
# .npmrc
node-linker=hoisted
```

Then reinstall:

```bash
rm -rf node_modules
pnpm install
```

If you use Yarn, prefer `nodeLinker: node-modules` (not PnP) for `shadow-cljs` projects.

## Note on React-only compositions

`react/src/compositions/EntityCard.tsx` is now part of the published React API. It is still excluded from Reagent and Helix parity until explicit wrapper support is added and documented.

## License

`@open-hax/uxx` is licensed under **LGPL-3.0-or-later**.

### What this means for consumers

This component library **may be bundled directly with proprietary, closed-source projects**. Your application code does not need to be licensed under the LGPL or GPL.

**The one obligation:** any modifications you make **to this library itself** — whether to fix bugs, add features, or adapt it to your project's needs — must be published back under the LGPL-3.0-or-later.

In practical terms:

- ✅ Use `@open-hax/uxx` as a dependency in proprietary software
- ✅ Distribute your proprietary application alongside the unmodified library
- ✅ Build closed-source products that import and render these components
- 📢 If you modify any file within this library, publish those changes under LGPL-3.0-or-later

The boundary is the library itself. Your application code remains yours. Changes to the library remain the commons.

See the full [`LICENSE`](./LICENSE) text for the complete terms.

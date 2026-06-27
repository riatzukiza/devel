# @open-hax/uxx React binding

Canonical React implementation for the Open Hax UI kit.

## Public surface

This package is the source of truth for the framework-parity contract used by the Reagent and Helix bindings.

### Providers

- `ThemeProvider`
- `UxxThemeProvider` (backward-compatible alias)
- `ToastProvider`

### Hooks

- `useUxxTheme`
- `useResolvedTheme`
- `useThemeName`
- `useToast`
- `useAdapter`

### Helpers

- `paginateItems`
- `calculateTotalPages`

### Components

- `Button`, `Badge`, `Spinner`, `Card`, `CardHeader`, `CardBody`, `CardFooter`, `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`, `Tooltip`, `Input`, `Select`, `Textarea`, `Progress`
- `ResizablePane`, `WhichKeyPopup`, `InspectorPane`, `ContextSection`, `PinnedTabsBar`, `PermissionCard`, `PromptCard`, `PermissionPrompts`, `ReactReagentSeam`, `CommandPalette`, `Chat`, `Toast`, `FileTree`, `Tabs`
- `SearchableSelect`, `CollapsiblePanel`, `KeyValueSection`, `SurfaceHero`, `PanelHeader`, `MetricTile`, `MetricTileGrid`, `FilterToolbar`, `ActionStrip`, `StatusChipStack`, `DataTableShell`, `Pagination`
- `Feed`, `Markdown`, `CodeBlock`, `DiffViewer`, `MarkdownEditor`, `RichTextEditor`

### Compositions

- `EntityCard`

### Notes on section primitives

The React surface now also includes standalone section primitives for shell composition:

- `CardHeader`, `CardBody`, `CardFooter`
- `ModalHeader`, `ModalBody`, `ModalFooter`

## Usage

```tsx
import {
  ThemeProvider,
  ToastProvider,
  Button,
  Card,
  EntityCard,
  MarkdownEditor,
  useToast,
} from '@open-hax/uxx';

function Inner() {
  const { addToast } = useToast();

  return (
    <>
      <Card title="Draft">
        <MarkdownEditor value="# hello" onChange={() => {}} />
        <Button
          variant="primary"
          onClick={() => addToast({ type: 'success', message: 'Saved' })}
        >
          Save
        </Button>
      </Card>
      <EntityCard
        id="issue-42"
        name="Issue #42"
        type="task"
        status={{ value: 'open', variant: 'info' }}
      />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider theme="night-owl">
      <ToastProvider position="top-right">
        <Inner />
      </ToastProvider>
    </ThemeProvider>
  );
}
```

## Themes

Built-in themes currently include:

- `monokai`
- `night-owl`
- `proxy-console`

Use `ThemeProvider` for the canonical API, or `UxxThemeProvider` if you want the collaborator-proposed alias while keeping the same runtime behavior:

```tsx
<ThemeProvider theme="proxy-console">
  <App />
</ThemeProvider>

<UxxThemeProvider
  theme="proxy-console"
  overrides={{
    radius: { md: '4px' },
    colors: { button: { primary: { bg: '#16E0FF' } } },
  }}
>
  <App />
</UxxThemeProvider>
```

## Development

```bash
cd orgs/open-hax/uxx
npm install
npm run build
npm run storybook
npm test
```

## Storybook

```bash
cd orgs/open-hax/uxx
npm run storybook
```

## Relationship to Reagent and Helix

The Reagent and Helix packages wrap the built React output in `../dist/`.

When you add or change a public component here, parity work for the ClojureScript bindings is usually:

1. build the root package
2. expose the wrapper in `reagent/`
3. expose the wrapper in `helix/`
4. update the parity docs

See [`../docs/framework-parity.md`](../docs/framework-parity.md).

## React-only composition status

`src/compositions/EntityCard.tsx` is now exported from the published root React API. Reagent and Helix parity for it is still pending.

## License

LGPL-3.0-or-later

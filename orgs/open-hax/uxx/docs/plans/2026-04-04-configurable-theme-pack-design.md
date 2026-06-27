# Configurable Theme Pack Design

Date: 2026-04-04
Repo: `open-hax/uxx`
Topic: configurable theme packs with a proxy-console-inspired preset

## Goal

Add a theme-pack system to `@open-hax/uxx` so consumers can:

1. select a named preset theme pack
2. apply that pack through React via a provider
3. override selected visual tokens without forking the library
4. use a new `proxy-console` preset aligned with the styling language from the `proxx` proxy console

## Requirements

- Preserve existing Monokai-oriented defaults
- Add a `proxy-console` preset with:
  - deeper charcoal backgrounds
  - cyan primary accent
  - muted cool text scale
  - sharper panel borders and darker shadows
- Expose a public API for preset selection and token overrides
- Support Storybook theme switching for review
- Keep the PR upstream-friendly and avoid a full rewrite of every component

## Recommended approach

### Theme architecture

Introduce **theme packs as concrete token values** and keep the current token modules as the source of truth for defaults.

Add:

- `themePacks.monokai`
- `themePacks['proxy-console']`
- `createThemePack(base, overrides)`
- `getThemeCssVars(theme)`
- `UxxThemeProvider`

### Runtime behavior

Theme packs generate CSS custom properties for themeable values. The provider sets:

- `data-uxx-theme="<name>"`
- inline CSS variables for overrides

To minimize refactor risk, runtime theming will focus on token categories that are safe and high-impact in inline React styles:

- colors
- font families
- font sizes
- shadows
- radius values

Spacing, z-index, and numeric layout values stay static for now because some components perform arithmetic with them.

## Public API proposal

### Tokens package

```ts
import {
  themePacks,
  createThemePack,
  getThemeCssVars,
  type ThemePack,
  type ThemeOverride,
} from '@open-hax/uxx/tokens';
```

### React package

```tsx
import { UxxThemeProvider } from '@open-hax/uxx';

<UxxThemeProvider theme="proxy-console">
  <App />
</UxxThemeProvider>

<UxxThemeProvider
  theme="proxy-console"
  overrides={{
    colors: {
      accent: { cyan: '#16e0ff' },
    },
    radius: { md: '8px' },
  }}
>
  <App />
</UxxThemeProvider>
```

## Implementation details

### 1. Token/source changes

Add a theme module that:

- defines the default Monokai pack from existing tokens
- defines a new Proxy Console pack inspired by `proxx/web/src/styles.css`
- deep-merges pack overrides
- serializes theme packs into CSS variables

Add a new `radius` token module so border radius can be themed without overloading spacing tokens.

### 2. Runtime tokens

Provide a runtime-facing token object for themeable categories that returns CSS variable references with sane fallbacks.

Example:

```ts
colors.background.default -> var(--uxx-colors-background-default, #272822)
radius.md -> var(--uxx-radius-md, 8px)
```

Components that need arithmetic keep using raw numeric spacing tokens.

### 3. React provider

`UxxThemeProvider` will:

- wrap children in a div
- set `data-uxx-theme`
- apply override CSS vars via `style`
- optionally allow custom element selection via `as` if needed later

### 4. Component updates

Update core React primitives to use runtime-themeable tokens for:

- color values
- font family/size values where appropriate
- border radius values where practical
- shadows

Initial coverage should prioritize the surface components most likely to demonstrate theme changes clearly:

- Button
- Badge
- Card
- Input
- Select
- Textarea
- Modal
- Tooltip
- Progress
- Tabs
- Toast
- SearchableSelect
- SurfaceHero / PanelHeader / MetricTile family

## Testing plan

Follow TDD:

1. Add tests for token/theme helpers first
2. Add tests for `UxxThemeProvider`
3. Add or update component tests to confirm theme variables flow into rendered styles
4. Run full test suite
5. Run typecheck/build

## Storybook plan

Add a toolbar-driven theme switcher in Storybook so reviewers can toggle:

- Monokai
- Proxy Console

Wrap stories in `UxxThemeProvider` using the selected global.

## Documentation updates

Update README with:

- new theme-pack API
- provider usage
- override examples
- proxy-console preset example

## Risks

- Some components hardcode values or use raw token categories directly
- Full runtime theming of every token category would require a larger refactor
- Radius adoption may be partial on the first pass

## Mitigations

- Keep scope on themeable visual tokens first
- Preserve default Monokai behavior
- Add provider/tests/docs so the API is still clean and useful upstream

## Success criteria

- `uxx` exports named theme packs including `proxy-console`
- React consumers can switch packs with `UxxThemeProvider`
- Consumers can override selected tokens without editing library code
- Storybook can preview both packs
- tests, typecheck, and build pass

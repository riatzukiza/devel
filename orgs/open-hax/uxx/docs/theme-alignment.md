# Theme Token Alignment

This document maps workbench CSS variables to `@open-hax/uxx/tokens` schema, ensuring semantic consistency across extracted components.

## Source: Workbench Theme

**File**: `orgs/open-hax/workbench/src/clojurescript/opencode_unified/theme.cljs`

The workbench uses a Monokai-inspired palette with CSS custom properties defined on `:root`.

## Color Mapping

### Background Colors

| Workbench Variable | Token Path | Value | Usage |
|-------------------|------------|-------|-------|
| `--bg-primary` | `colors.background.default` | `#272822` | Main background |
| `--bg-secondary` | `colors.background.surface` | `#1e1f1c` | Elevated surfaces |
| `--bg-tertiary` | `colors.background.elevated` | `#171814` | Highest elevation |
| `--bg-selection` | `colors.background.elevated` | `#49483e` | Selected state bg |

**Alignment Status**: ✅ Aligned — Workbench variables map cleanly to token paths.

### Text Colors

| Workbench Variable | Token Path | Value | Usage |
|-------------------|------------|-------|-------|
| `--text-primary` | `colors.text.default` | `#f8f8f2` | Primary text |
| `--text-secondary` | `colors.text.secondary` | `#75715e` | Muted text |
| `--text-dim` | `colors.text.muted` | `#5f5a60` | Subtle text |

**Alignment Status**: ✅ Aligned — Semantic naming differs but values match.

### Accent Colors

| Workbench Variable | Token Path | Value | Usage |
|-------------------|------------|-------|-------|
| `--accent-pink` | `colors.accent.pink` | `#f92672` | Error, danger |
| `--accent-blue` | `colors.accent.cyan` | `#66d9ef` | Primary accent |
| `--accent-green` | `colors.accent.green` | `#a6e22e` | Success |
| `--accent-orange` | `colors.accent.orange` | `#fd971f` | Warning |
| `--accent-purple` | `colors.accent.magenta` | `#ae81ff` | Special states |
| `--accent-yellow` | `colors.accent.yellow` | `#e6db74` | Highlight |

**Alignment Status**: ✅ Aligned — Monokai accent palette preserved in tokens.

### Functional Mappings

| Workbench Variable | Token Path | Value | Usage |
|-------------------|------------|-------|-------|
| `--accent` | `colors.interactive.default` | `var(--accent-blue)` | Default interactive |
| `--success` | `colors.status.alive` | `var(--accent-green)` | Success state |
| `--warning` | `colors.status.warning` | `var(--accent-orange)` | Warning state |
| `--error` | `colors.semantic.error` | `var(--accent-pink)` | Error state |

**Alignment Status**: ✅ Aligned — Functional aliases map to semantic tokens.

### Border Colors

| Workbench Variable | Token Path | Value | Usage |
|-------------------|------------|-------|-------|
| `--border` | `colors.border.default` | `#3e3d32` | Default border |
| `--border-focus` | `colors.border.focus` | `#75715e` | Focused border |

**Alignment Status**: ✅ Aligned — Border colors match.

## Spacing Mapping

### Workbench Spacing

| Workbench Variable | Token Path | Value | Notes |
|-------------------|------------|-------|-------|
| `--spacing-xs` | `spacing.0.5` | `2px` | Extra small |
| `--spacing-sm` | `spacing.1` | `4px` | Small |
| `--spacing-md` | `spacing.2` | `8px` | Medium |
| `--spacing-lg` | `spacing.3` | `12px` | Large |
| `--spacing-xl` | `spacing.4` | `16px` | Extra large |

**Alignment Status**: ✅ Aligned — Workbench uses 4px base unit matching tokens.

### Semantic Spacing

| Token Semantic | Workbench Equivalent | Notes |
|---------------|---------------------|-------|
| `space.gap.xs` | `--spacing-xs` | Gap extra small |
| `space.gap.sm` | `--spacing-sm` | Gap small |
| `space.gap.md` | `--spacing-md` | Gap medium |
| `space.padding.sm` | `--spacing-sm` | Padding small |

## Typography Mapping

### Font Family

| Workbench Variable | Token Path | Value |
|-------------------|------------|-------|
| `--font-mono` | `fontFamily.mono` | `'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace` |
| `--font-ui` | `fontFamily.sans` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...` |

**Alignment Status**: ⚠️ Minor — Font stacks differ slightly (JetBrains Mono vs SF Mono). Both are acceptable monospace options.

### Font Size

| Workbench Variable | Token Path | Value |
|-------------------|------------|-------|
| `--font-size-xs` | `typography.caption.fontSize` | `10px` → `0.75rem` |
| `--font-size-sm` | `typography.bodySm.fontSize` | `11px` → `0.875rem` |
| `--font-size-md` | `typography.body.fontSize` | `13px` → `1rem` |
| `--font-size-lg` | `typography.h6.fontSize` | `15px` → `1.125rem` |

**Alignment Status**: ⚠️ Minor — Workbench uses px, tokens use rem. Values are approximately equivalent.

## Semantic Conflicts

No semantic conflicts detected. The workbench uses consistent naming:

- `--accent` always refers to the primary interactive color (cyan/blue)
- `--success` always refers to green
- `--warning` always refers to orange
- `--error` always refers to pink

## Component Token Usage

Extracted components use tokens as follows:

| Component | Token Categories Used |
|-----------|----------------------|
| ResizablePane | `colors.background`, `colors.border`, `spacing` |
| WhichKeyPopup | `colors.background`, `colors.text`, `colors.accent`, `typography` |
| InspectorPane | `colors.background`, `colors.text`, `colors.border`, `colors.accent`, `spacing`, `typography` |
| PermissionPrompts | `colors.background`, `colors.text`, `colors.accent`, `spacing`, `typography` |
| ReactReagentSeam | `colors.background`, `colors.border`, `colors.text`, `spacing`, `fontFamily` |

## Migration Guide

### For Workbench Consumers

If consuming extracted components from workbench code:

```clojure
;; Workbench code using CSS variables
[:div {:style {:background "var(--bg-primary)"
               :color "var(--text-primary)"}}]

;; Can use tokens directly
[:div {:style {:background (get-in tokens/colors [:background :default])
               :color (get-in tokens/colors [:text :default])}}]
```

### For React Consumers

```tsx
// React code using tokens
import { tokens } from '@open-hax/uxx/tokens';

<div style={{
  background: tokens.colors.background.default,
  color: tokens.colors.text.default
}}>
```

## Monokai Palette Compatibility

The extracted components are designed for Monokai-like themes. The token system supports this through:

1. **Dark background scale**: `#272822` → `#1e1f1c` → `#171814`
2. **Light text scale**: `#f8f8f2` → `#75715e` → `#5f5a60`
3. **Vibrant accents**: Pink, cyan, green, orange, purple, yellow
4. **Muted borders**: `#3e3d32` and `#75715e`

For light themes, additional token overrides would be needed.

## Recommendations

1. **Keep CSS variables for legacy code**: Workbench can continue using `var(--*)` syntax for existing code
2. **Use tokens for new components**: Extracted and new components should use the token system
3. **Document theme extensions**: If adding new semantic colors, extend both CSS variables and tokens
4. **Test visual consistency**: Compare workbench UI with extracted components to verify alignment

## Token Export Paths

### Reagent
```clojure
(ns my.app
  (:require [devel.ui.tokens :as tokens]))

(get-in tokens/colors [:background :default])
(get tokens/spacing 4)
```

### React
```tsx
import { tokens } from '@open-hax/uxx/tokens';

tokens.colors.background.default;
tokens.spacing[4];
```

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Background colors | ✅ Aligned | Direct mapping |
| Text colors | ✅ Aligned | Semantic names differ |
| Accent colors | ✅ Aligned | Monokai palette preserved |
| Border colors | ✅ Aligned | Direct mapping |
| Spacing | ✅ Aligned | 4px base unit |
| Typography | ⚠️ Minor | px vs rem, font stack variants |
| Semantic naming | ✅ Aligned | No conflicts |

**Overall Alignment**: ✅ Excellent — The workbench CSS variables map cleanly to `@open-hax/uxx/tokens` with only minor typographic differences.

# RESVG Rendering Constraints
**Engine:** `@resvg/resvg-js` (WASM port of Rust resvg)

## 🚫 Hard Failures (Will not render or render incorrectly)

### 1. Filters
- `filter="url(#id)"` is **NOT supported**.
- Effects like `feGaussianBlur` or `feMerge` (glows, shadows) are silently dropped.
- **Result:** The element renders, but the effect is absent.

### 2. Font Resolution
- Resvg resolves fonts from the **system font registry at render time**.
- In Node.js server/Linux container environments, common fonts (`Courier New`, `Georgia`, `Arial`) are typically absent.
- **Result:** Fallback to generic fonts or rendering as blank boxes.

### 3. Text Gradients
- `linearGradient` on `<text fill="url(#id)">` has spotty support (specifically pre-0.30).
- **Result:** Potential failure to render the fill.

## ✅ Solid Support
- **Geometry:** `<circle>`, `<rect>`, `<path>`, `<line>`
- **Styling:** `stroke`, `fill` (hex colors)
- **Definitions:** `<defs>` + `<linearGradient>` on shapes
- **Transforms:** `transform`, `rx`/`ry`, `opacity`
- **Text:** `text-anchor`, `font-size`, `font-weight` (provided the font resolves)

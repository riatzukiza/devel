# resvg Rendering Constraints

The workspace uses \`@resvg/resvg-js\` as its primary SVG renderer. It is a WASM port of the Rust resvg library and does NOT behave like a full browser engine.

## ❌ Forbidden (Hard Failures)
- **Filters**: No \`<filter>\` support. Glows, blurs, and merges (\`feGaussianBlur\`, \`feMerge\`) are silently dropped.
- **Fonts**: Resolved via system font registry. In the Node.js/Linux container, Windows/Mac fonts (e.g., \`Courier New\`, \`Georgia\`, \`Arial\`) are generally missing. Use generic fallbacks (\`serif\`, \`sans-serif\`, \`monospace\`).
- **Text Gradients**: \`linearGradient\` on \`<text>\` is unstable and potentially unsupported in older versions.

## ✅ Permitted (Stable)
- **Geometry**: \`<circle>\`, \`<rect>\`, \`<path>\>, \`<line>\` are fully supported.
- **Styling**: \`stroke\`, \`fill\` (hex), \`opacity\`.
- **Definitions**: \`<defs>\` with \`linearGradient\` on shapes.
- **Layout**: \`transform\`, \`rx\`, \`ry\`, \`text-anchor\`, \`font-size\`, \`font-weight\`.


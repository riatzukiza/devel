# Browser-style FileTree profiler notes

Date: 2026-04-04

## Goal

Run a browser-style benchmark for one heavier component tree, using React `Profiler` and a jsdom DOM, across:

- canonical React package
- Helix binding
- Reagent binding

## Harness

Script:

- `scripts/browser-profiler-benchmark.mjs`

Approach:

- jsdom-backed DOM container
- `ReactDOM.render` used for compatibility with the Shadow-compiled Helix/Reagent bundles
- React `Profiler` wraps the rendered tree and records `actualDuration` / `baseDuration`
- representative component: `FileTree`
- generated tree size: depth 3, breadth 5, 6 files per folder
- scenarios:
  - `stable-items`: reuse the same item tree and only change `selectedId`
  - `fresh-items`: clone the item tree every update

## Important caveats

- This is browser-*style* rather than a real browser profile; jsdom has no layout/paint cost.
- `ReactDOM.render` runs React 18 in legacy mode here because the Shadow bundles expose `react-dom`, not `react-dom/client`.
- The Reagent benchmark uses a tiny JS adapter component that passes a top-level CLJS map into the exported Reagent wrapper while leaving nested tree data as JS values. That keeps the test focused on the wrapper boundary rather than forcing full recursive JS→CLJS conversion of the whole tree.
- Treat small differences as directional, not absolute truth.

## Results (12 updates)

### stable-items

| Binding | wall ms/update | avg actualDuration | avg baseDuration |
| --- | ---: | ---: | ---: |
| React | 159.09 | 148.59 | 35.41 |
| Helix | 151.90 | 140.17 | 42.40 |
| Reagent | 141.46 | 131.62 | 41.63 |

### fresh-items

| Binding | wall ms/update | avg actualDuration | avg baseDuration |
| --- | ---: | ---: | ---: |
| React | 51.03 | 46.54 | 26.20 |
| Helix | 46.04 | 41.88 | 22.84 |
| Reagent | 67.31 | 62.66 | 35.49 |

## Interpretation

- There is no sign here of a catastrophic Helix interop penalty.
- Helix remains in the same rough performance band as canonical React.
- Reagent is also competitive in the `stable-items` case in this specific harness, but degrades more clearly in the `fresh-items` case.
- The earlier SSR microbenchmark and this browser-style profiler pass agree on the main safety claim: the current Helix bridge does not appear to add alarming overhead.

## Practical conclusion

The current parity architecture looks acceptable unless and until a real application trace shows a hot path where the wrapper boundary dominates.

If we want stronger confidence next, profile a real interactive surface in an actual browser using DevTools Profiler or Storybook with user-driven updates.

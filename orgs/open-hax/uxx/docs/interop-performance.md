# Interop performance notes

Date: 2026-04-04

## Goal

Check whether the React-backed Reagent and Helix bindings add meaningful avoidable overhead versus the canonical React package.

## Method

Benchmark script:

- `scripts/interop-benchmark.mjs`

Workload:

- compare canonical React (`dist/src/index.js`), Helix (`helix/dist/index.js`), and Reagent (`reagent/dist/index.js`)
- use the same `Button` component shape with a variant, callback, and text child
- measure server-side render throughput with `react-dom/server`
- server render is used here because it forces the wrapper component to execute, making it a reasonable proxy for wrapper overhead

Caveats:

- this is a microbenchmark, not a product trace
- SSR timings are directional; they do not fully model browser reconciliation, layout, or event work
- raw element-creation numbers are less apples-to-apples than render timings because React and CLJS wrapper invocation shapes differ

## Results

### `render-stable` (same props identity reused)

| Binding | us/op | ops/sec | Relative to React |
| --- | ---: | ---: | ---: |
| React | 16.88 | 59,242 | baseline |
| Helix | 18.54 | 53,946 | +9.8% |
| Reagent | 21.51 | 46,497 | +27.4% |

### `render-fresh` (fresh props each iteration)

| Binding | us/op | ops/sec | Relative to React |
| --- | ---: | ---: | ---: |
| React | 14.17 | 70,548 | baseline |
| Helix | 15.11 | 66,160 | +6.6% |
| Reagent | 17.98 | 55,631 | +26.8% |

## Interpretation

- Helix remains close to canonical React in this wrapper architecture.
- The current Helix bridge appears to preserve most of the practical runtime benefit of thin React interop.
- Reagent is still noticeably heavier than Helix for this path, which matches the extra Hiccup and argument-shape adaptation work.
- The current cached interop layer does not look alarmingly expensive for Helix; the measured overhead is modest rather than structural.

## Recommendation

Current direction is acceptable if the goal is:

- one canonical React implementation
- low maintenance drift
- acceptable Helix performance

If future profiling finds a hot path, optimize in this order:

1. benchmark the specific component tree in browser mode with React Profiler
2. stabilize caller-side prop identity for expensive trees
3. add per-component fast paths only where the profiler shows pressure
4. only then consider replacing the generic Helix runtime adapter with generated wrappers

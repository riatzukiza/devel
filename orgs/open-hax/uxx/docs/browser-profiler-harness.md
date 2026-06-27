# Browser profiler harness

The repo now includes a real browser-oriented profiling harness under:

- `docs/perf-browser/`

Pages:

- `docs/perf-browser/react.html`
- `docs/perf-browser/helix.html`
- `docs/perf-browser/reagent.html`

## Purpose

Profile the same representative component tree in an actual browser session with DevTools, without loading multiple incompatible framework runtimes on the same page.

Current target component:

- `FileTree`

## Run

```bash
cd orgs/open-hax/uxx
pnpm exec vite docs/perf-browser --host 127.0.0.1 --port 4173
```

Then open:

- `http://127.0.0.1:4173/react.html`
- `http://127.0.0.1:4173/helix.html`
- `http://127.0.0.1:4173/reagent.html`

## Why separate pages?

The Helix and Reagent bundles each carry Shadow CLJS runtime globals. Loading multiple Shadow-compiled framework bundles into the same page can create runtime collisions, so the harness isolates them per page.

## What the page gives you

Each page includes:

- a generated `FileTree` workload
- `stable-items` and `fresh-items` scenario buttons
- built-in React `Profiler` timing summaries
- a clean target for Chrome/Firefox React DevTools Profiler recording

## Recommendation

Use the built-in numbers only for quick direction. For high-confidence conclusions, use the browser's React DevTools Profiler flamegraph and commit views while triggering the scenario buttons.

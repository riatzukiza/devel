import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mode = process.argv[2] ?? 'root';

const stableFn = () => 1;
const textChild = 'Ship';

function bench(name, iterations, fn) {
  for (let i = 0; i < Math.min(2000, iterations); i += 1) fn(i);

  const start = process.hrtime.bigint();
  let checksum = 0;
  for (let i = 0; i < iterations; i += 1) {
    checksum += fn(i) || 0;
  }
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;

  return {
    name,
    iterations,
    durationMs,
    opsPerSec: (iterations / durationMs) * 1000,
    usPerOp: (durationMs * 1000) / iterations,
    checksum,
  };
}

function summarize(results) {
  return Object.fromEntries(results.map((result) => [result.name, result]));
}

function keyword(name) {
  const cljs = globalThis.cljs.core;
  return new cljs.Keyword(null, name, name, -1);
}

function cljsMap(entries) {
  const flat = [];
  for (const [k, v] of entries) flat.push(keyword(k), v);
  return globalThis.cljs.core.PersistentArrayMap.fromArray(flat, true);
}

async function loadHarness(selectedMode) {
  if (selectedMode === 'root') {
    const mod = await import('../dist/src/index.js');
    return {
      mode: selectedMode,
      createStable: (() => {
        const props = { variant: 'primary', onClick: stableFn, children: textChild };
        return () => React.createElement(mod.Button, props);
      })(),
      createFresh: () => React.createElement(mod.Button, { variant: 'primary', onClick: stableFn, children: textChild }),
    };
  }

  if (selectedMode === 'helix') {
    const mod = await import('../helix/dist/index.js');
    return {
      mode: selectedMode,
      createStable: (() => {
        const props = { variant: 'primary', onClick: stableFn, children: textChild };
        return () => React.createElement(mod.Button, props);
      })(),
      createFresh: () => React.createElement(mod.Button, { variant: 'primary', onClick: stableFn, children: textChild }),
    };
  }

  if (selectedMode === 'reagent') {
    const mod = await import('../reagent/dist/index.js');
    const stableProps = cljsMap([
      ['variant', keyword('primary')],
      ['on-click', stableFn],
    ]);

    return {
      mode: selectedMode,
      createStable: () => mod.Button(stableProps, textChild),
      createFresh: () => mod.Button(cljsMap([
        ['variant', keyword('primary')],
        ['on-click', stableFn],
      ]), textChild),
    };
  }

  throw new Error(`Unknown mode: ${selectedMode}`);
}

const harness = await loadHarness(mode);

const results = [
  bench('create-stable', 100000, () => {
    const el = harness.createStable();
    return el ? 1 : 0;
  }),
  bench('create-fresh', 100000, () => {
    const el = harness.createFresh();
    return el ? 1 : 0;
  }),
  bench('render-stable', 5000, () => renderToStaticMarkup(harness.createStable()).length),
  bench('render-fresh', 5000, () => renderToStaticMarkup(harness.createFresh()).length),
];

console.log(JSON.stringify({ mode: harness.mode, results: summarize(results) }, null, 2));

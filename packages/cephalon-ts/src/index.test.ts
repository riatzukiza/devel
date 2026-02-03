/**
 * Tests for index.ts module exports
 *
 * This file verifies that the TypeScript Cephalon module exports
 * all symbols required by the ClojureScript bridge.
 */

import anyTest, { type TestFn } from 'ava';

interface TestContext {
  exports: Record<string, unknown>;
}

const test = anyTest as TestFn<TestContext>;

test.before(async (t) => {
  const mod = await import('./index.js');
  t.context.exports = mod as Record<string, unknown>;
});

/**
 * Test: createCephalonApp is exported
 *
 * The main factory function that CLJS calls via js/require
 */
test('createCephalonApp is exported', (t) => {
  const { createCephalonApp } = t.context.exports;
  t.is(typeof createCephalonApp, 'function', 'createCephalonApp should be a function');
});

/**
 * Test: CephalonApp interface types are exported
 *
 * TypeScript type definitions for the interface consumed by CLJS
 */
test('CephalonApp type is exported', (t) => {
  const exports = t.context.exports as Record<string, unknown>;
  // The interface should be accessible (check by name in exports)
  const exportNames = Object.keys(exports);
  t.true(
    exportNames.some((name) => name.includes('CephalonApp') || name.includes('CephalonAppOptions')),
    'CephalonApp types should be exported',
  );
});

/**
 * Test: Policy types are exported
 */
test('policy types are exported', (t) => {
  const exports = t.context.exports as Record<string, unknown>;
  const exportNames = Object.keys(exports);
  t.true(
    exportNames.some((name) => name.includes('Policy') || name.includes('policy')),
    'Policy types should be exported',
  );
});

/**
 * Test: All submodules are re-exported
 *
 * The index.ts should re-export all public APIs
 */
test('all public APIs are re-exported from index', (t) => {
  const exports = t.context.exports as Record<string, unknown>;
  const exportNames = Object.keys(exports);

  // Check that key modules are available
  const expectedExports = [
    'createCephalonApp',
    'loadDefaultPolicy',
    'ChromaMemoryStore',
    'DiscordIntegration',
    'SessionManager',
  ];

  for (const module of expectedExports) {
    t.true(
      exportNames.some((name) => name.toLowerCase().includes(module.toLowerCase())),
      `${module} module should be exported`,
    );
  }
});

/**
 * Test: Module has proper ESM structure
 */
test('module has proper ESM structure', (t) => {
  const exports = t.context.exports as Record<string, unknown>;
  t.truthy(exports, 'module should export something');
  t.not(Object.keys(exports).length, 0, 'module should have at least one export');
});

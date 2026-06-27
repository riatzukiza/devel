// Workspace note:
// This package builds the canonical React implementation and tokens directly into
// ./dist/react/** and ./dist/tokens/** (see tsconfig.json include).
// Re-export via relative paths so consumers (and shadow-cljs) don't require
// additional companion npm packages at runtime.

export * from '../react/src/index.js';
export * from '../tokens/src/index.js';

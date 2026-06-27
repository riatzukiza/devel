// TypeScript-only shim for the internal React workspace package.
//
// The canonical tokens live in the tokens workspace package.
// The published package exposes them at the subpath "@open-hax/uxx/tokens".
//
// During workspace development we want `tsc` in this package to succeed even
// when @open-hax/uxx hasn't been built into ./dist yet.

declare module '@open-hax/uxx/tokens' {
  export * from '@open-hax/uxx-tokens-internal';
}

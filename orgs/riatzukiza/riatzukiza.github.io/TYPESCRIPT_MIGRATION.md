# TypeScript Migration Guide

## Overview

This project uses TypeScript for **type checking only**, not for compilation. The runtime code remains JavaScript compiled from Sibilant.

## Approach

We use **JSDoc type annotations** on compiled JavaScript files to provide type safety through TypeScript's type checker. This approach:
- Preserves the unique Sibilant workflow
- Provides type safety without changing the compilation pipeline
- Allows gradual adoption of type annotations
- Maintains runtime compatibility with existing Sibilant output

## Configuration

### `tsconfig.json`

- `allowJs: true` - Allow checking of JavaScript files
- `checkJs: false` - Don't type-check compiled JavaScript (JSDoc only)
- `noEmit: true` - Don't generate TypeScript/JavaScript output
- `strict: false` - Relaxed strictness for Sibilant-specific patterns

### Type Declaration Files

Located in `/types/`:

1. **prototype-extensions.d.ts** - Global type extensions for Sibilant runtime
   - `Array.prototype.each` - Custom iteration method
   - `Object.prototype.each` - Custom iteration method

2. **kit-modules.d.ts** - Type declarations for Kit ecosystem modules
   - `@kit-js/core/js/util`
   - `@kit-js/http/index.js`
   - `@kit-js/interface`
   - `kit-file-system`
   - `ramda`
   - `mime-types` (via @types/mime-types package)

3. **common.d.ts** - Common game engine type definitions
   - Entity, System, Component interfaces
   - ECS-related types
   - Vector, Rect, AABB types

## Type Annotation Patterns

### Adding JSDoc to Compiled JavaScript

```javascript
/**
 * Creates a static file server middleware
 * @param {any} sys - File system object
 * @returns {Function} Middleware function
 */
var serveStaticFiles = (function serveStaticFiles$(sys) {
  // implementation
});
```

### Annotating Kit Module Imports

```javascript
var { create, extend, mixin } = require("@kit-js/core/js/util");
// Types automatically resolved from types/kit-modules.d.ts
```

### Callback Function Types

```javascript
/**
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {Error} e - Error object
 * @returns {void}
 */
var handleRouterError = R.curry(((res, e) => {
  res.writeHead(500);
  return res.end(e.message);
}));
```

## Running Type Checks

```bash
# Check types without emitting files
npm run type-check

# Watch for type errors
npm run type:watch
```

## Current Status

- ✅ Server code type-checked with JSDoc annotations
- ✅ TypeScript configuration set up
- ✅ Type declarations for Kit modules created
- ⏳ Shared ECS engine type annotations (pending)
- ⏳ Client project type annotations (pending)

## Next Steps

1. Add JSDoc annotations to shared ECS engine files
2. Add JSDoc annotations to client game projects
3. Gradually enable stricter type checking options
4. Consider generating declaration files for external API consumers

## Notes

- Sibilant's compiled output uses some patterns TypeScript doesn't natively support (e.g., object method definitions)
- We use `checkJs: false` to avoid TypeScript trying to infer types from Sibilant's output
- All type information comes from JSDoc annotations in comments, not from TypeScript analysis
- This is a pragmatic approach that provides type safety while maintaining the existing Sibilant workflow

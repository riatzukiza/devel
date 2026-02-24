# Glob Pattern Fix Summary

## Bug Description
When calling `vfs.glob('*', { path: 'services' })`, the function returned 0 matches even though the `services` directory contains 14 subdirectories.

## Root Cause
The glob method in `virtualFs.ts` was matching patterns against the full path from root instead of the path relative to the search path.

### Example of the Bug:
- Call: `vfs.glob('*', { path: 'services' })`
- `searchPath = "services"`
- `searchDir("services")` lists entries in services directory
- Entry: `{ name: "cephalon-cljs", path: "cephalon-cljs", kind: "dir" }`
- `entryPath = "services" + "/" + "cephalon-cljs" = "services/cephalon-cljs"`
- Pattern matching: `matchesGlobPattern("services/cephalon-cljs", "*")` is checked
- Pattern `"*"` becomes regex `^[^/]*$` (anything except slashes, anchored at both ends)
- `"services/cephalon-cljs"` contains slashes, so it doesn't match the pattern ❌

## The Fix
Added logic to calculate the path relative to `searchPath` before pattern matching:

```typescript
// After building entryPath, calculate relative path for pattern matching
let patternCandidate = entryPath;
if (searchPath && entryPath.startsWith(searchPath)) {
  // Remove searchPath prefix and any leading slash
  patternCandidate = entryPath.slice(searchPath.length).replace(new RegExp('^/'), '');
}

// Match against patternCandidate instead of entryPath
if (this.matchesGlobPattern(patternCandidate, pattern) && ...) {
  matches.push({
    path: entryPath,  // Keep full path in result
    kind: entry.kind,
  });
}
```

### How It Works:
1. When `searchPath` is provided and `entryPath` starts with it, we remove the prefix
2. `entryPath.slice(searchPath.length)` removes the searchPath prefix
3. `.replace(new RegExp('^/'), '')` removes any leading slash
4. Pattern is now matched against the relative path (e.g., "cephalon-cljs" instead of "services/cephalon-cljs")
5. The full path is still stored in the result for correct output

## Test Results

### Before Fix:
```
Test 5: Glob pattern '*' from path 'services' ---
Pattern: *
Search path: services
Matches: 0  ❌
```

### After Fix:
```
Test 5: Glob pattern '*' from path 'services' ---
Pattern: *
Search path: services
Matches: 14  ✓
  - services/cephalon-cljs (dir)
  - services/janus (dir)
  - services/kronos (dir)
  ...
```

## Files Modified
- `/home/err/devel/services/mcp-fs-oauth/src/fs/virtualFs.ts` - Lines 664-671

## Key Changes
1. Added `patternCandidate` variable to hold the path relative to searchPath
2. Added condition to check if searchPath is provided and entryPath starts with it
3. Added logic to remove searchPath prefix and leading slash from entryPath
4. Changed pattern matching to use `patternCandidate` instead of `entryPath`
5. Preserved full `entryPath` in the result object for correct output

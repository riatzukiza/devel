## Signal
(己, p=0.9) Your runtime error is exactly what Vite/browser ESM throws when `ChatMainPane.tsx` does `import ChatComposer from '../ChatComposer'` but `ChatComposer.tsx` does **not** `export default ...`.

(己, p=0.95) In this workspace the immediate cause was: `frontend/src/components/ChatComposer.tsx` had been overwritten and contained only `EOFEOF` (7 bytes), i.e. **no exports at all** → so the module “doesn’t provide an export named: 'default'”.

(己, p=0.9) Fix: restore `frontend/src/components/ChatComposer.tsx` so it ends with `export default ChatComposer;` (or alternately change the import to a named import if you intentionally removed the default export).

## Evidence
(己, p=0.95) File size showed corruption: `wc -c frontend/src/components/ChatComposer.tsx` was `7` bytes, and reading it returned `EOFEOF`.
(己, p=0.9) Git history contains a valid `ChatComposer.tsx` with `export default ChatComposer;` at the end (`git show HEAD:frontend/src/components/ChatComposer.tsx`).

## Frames
(己, p=0.75) “File got clobbered” frame: a bad edit/heredoc wrote `EOFEOF` into the module → no default export.
(己, p=0.65) “Export style drift” frame: module was refactored from `export default` to `export function ChatComposer…` but import sites weren’t updated.
(世, p=0.55) “Deploy mismatch/cache” frame: prod is serving an older/broken artifact even though repo now has the right export.

## Countermoves
(己, p=0.85) Confirm the module really exports default in the environment you’re running: open `https://knoxx.promethean.rest/src/components/ChatComposer.tsx?...` and check it ends with `export default ChatComposer;`.
(己, p=0.8) If you *intended* named exports, switch the import in `ChatMainPane.tsx` to `import { ChatComposer } from '../ChatComposer'` and export it accordingly.
(世, p=0.7) If prod still errors after fix: hard-reload / clear cache, and redeploy the frontend (the error URL includes a `?t=...` cache-buster, but CDNs/service workers can still serve stale bundles).

## Next
(己, p=0.85) Check the deployed `ChatComposer.tsx` URL in the error message and verify whether it contains `export default ChatComposer;`—if not, redeploy from the commit that restores the file.
## Signal
(己, p=0.93) Yes: Pi’s `settings.json` `"extensions"` list can point at a **folder**, not just a specific `index.ts` file.  
(己, p=0.96) I added your local package folder `~/devel/orgs/shuv/pi-mcp-adapter` to `~/.pi/agent/settings.json` so Pi can load it via the package’s `package.json -> pi.extensions`.

## Evidence
(己, p=0.99) Updated file: `.pi/agent/settings.json` now contains:
- `~/devel/orgs/shuv/pi-mcp-adapter` inside the `"extensions"` array.  
(世, p=0.9) Pi docs show `pi` packages can declare `"pi": { "extensions": ["./extensions"] }` and Pi supports loading extensions from directories (README excerpt from installed `@mariozechner/pi-coding-agent`).  
(己, p=0.98) `devel/orgs/shuv/pi-mcp-adapter/package.json` declares:
- `"pi": { "extensions": ["./index.ts"] }`  
So pointing Pi at the folder is sufficient.

## Frames
(己, p=0.74) Frame 1: “Folder support” = Pi treats entries as **package roots** and reads `package.json` `pi.*` manifests.  
(己, p=0.62) Frame 2: “Folder support” = Pi does **conventional autodiscovery** (extensions/, skills/, etc.) when no manifest exists (not your case; you *do* have a manifest).  
(己, p=0.55) Frame 3: If something fails to load, it’s usually path expansion (`~`) or runtime/ts-node expectations—not the “folder vs file” concept.

## Countermoves
(己, p=0.8) If Pi doesn’t expand `~` in your environment, replace it with the absolute path `/home/err/devel/orgs/shuv/pi-mcp-adapter`.  
(己, p=0.78) If you want to bypass package-manifest loading entirely, you can instead point directly at the entry file: `~/devel/orgs/shuv/pi-mcp-adapter/index.ts`.

## Next
(己, p=0.85) Restart Pi (or start a fresh session) so it reloads extensions from the updated `~/.pi/agent/settings.json`.
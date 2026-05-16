## Signal
(己, p=0.98) Removed every installed Ollama model except `gemma4` (kept both `gemma4:latest` and `gemma4:e4b`).

(己, p=0.99) Current `ollama ls` now shows only:
- `gemma4:latest`
- `gemma4:e4b`

## Evidence
(己, p=0.95) I ran:
- `ollama ls | tail -n +2 | awk '{print $1}' | grep -v '^gemma4' | xargs -r -n1 ollama rm`
- then verified with `ollama ls` and only `gemma4:*` entries remain.

## Frames
(己, p=0.84) Frame 1: “Except gemma4” means keep any tag that starts with `gemma4` (what I did).  
(己, p=0.80) Frame 2: You might have meant “keep only `gemma4:latest`” (in that case you can delete the extra tag `gemma4:e4b`).  
(己, p=0.78) Frame 3: You primarily want disk space back; deleting tags is step 1, but pruning unreferenced blobs may reclaim more.

## Countermoves
(己, p=0.87) If you want *only one* gemma4 tag, run: `ollama rm gemma4:e4b` (or the other tag) — both point at the same ID right now.  
(己, p=0.82) If disk usage doesn’t drop as much as expected, run a prune to clear unreferenced layers.

## Next
(己, p=0.85) Run: `ollama prune`
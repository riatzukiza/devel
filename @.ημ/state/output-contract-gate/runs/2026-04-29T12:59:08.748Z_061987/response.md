## Signal
(己, p=0.99) Removed **all dangling Docker volumes** (including named ones) via `docker volume prune -af`.

(己, p=0.99) Dangling volumes remaining: **0**.

## Evidence
(己, p=0.98) `docker volume prune -af` → **Total reclaimed space: 21.34GB**  
(己, p=0.99) `docker volume ls -qf dangling=true | wc -l` → **0**  
(己, p=0.96) `docker system df` now shows `Local Volumes ... RECLAIMABLE 0B (0%)`.

## Frames
(己, p=0.84) “Dangling volumes” = volumes not referenced by any container (running or stopped).  
(己, p=0.82) Without `-a`, Docker prunes only anonymous volumes; with `-a` it also prunes named-but-unused compose volumes.

## Countermoves
(己, p=0.86) If you later need data from an old compose stack, it will be gone now unless you had external backups.

## Next
(己, p=0.86) Run `docker ps` to confirm any stacks you still care about are up and healthy.
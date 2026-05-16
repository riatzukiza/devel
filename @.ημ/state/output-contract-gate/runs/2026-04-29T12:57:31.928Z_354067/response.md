## Signal
(己, p=0.97) Docker currently has **153 unused (dangling) volumes** (i.e., not referenced by any container).

(己, p=0.93) Biggest unused volumes by size (LINKS=0):
- (己, p=0.95) `registry_registry-data` — **14.37GB**
- (己, p=0.95) `futuresight-kms_qdrant-storage` — **1.041GB**
- (己, p=0.95) `open-hax-openai-proxy_open-hax-openai-proxy-root-db-data` — **977MB**
- (己, p=0.95) `knoxx_shuvcrawl-output` — **541.4MB**
- (己, p=0.95) `cephalon-stack_cephalon-mongodb-data-snapshot2` — **431.9MB**
- (己, p=0.95) `cephalon-hive_cephalon-hive-mongodb-data` — **383.3MB**
- (己, p=0.95) `proxx-blongs_open-hax-openai-proxy-db-data` — **374.9MB**
- (己, p=0.95) `knoxx_graph-weaver-mongodb-data` — **350.4MB**
- (己, p=0.95) `knoxx_knoxx-knoxx-node-modules` — **330.9MB**
- (己, p=0.95) `cephalon-hive_cephalon-hive-mongodb-data-snapshot2` — **278.5MB**

## Evidence
(己, p=0.98) Counted dangling volumes via: `docker volume ls -qf dangling=true | wc -l` → **153**.  
(己, p=0.96) Size/links breakdown taken from a full `docker system df -v` snapshot (saved to `/tmp/docker-system-df-v.txt`) and filtered to `LINKS=0`.

## Frames
(己, p=0.83) “Unused volumes” = Docker’s `dangling=true` volumes (safe *in Docker terms*, but may contain data you still care about).  
(己, p=0.78) Some “unused” volumes are from old compose projects you might want to keep for rollback (DB snapshots, caches).  
(己, p=0.80) The big win is usually a few large `LINKS=0` volumes (not the many 0B ones).

## Countermoves
(己, p=0.90) Before deleting a large one, inspect what it is: `docker volume inspect <volume>` (shows mountpoint + labels).  
(己, p=0.88) Prefer deleting *specific* big volumes first (e.g. that 14.37GB registry volume) rather than blind pruning if you’re unsure.

## Next
(己, p=0.86) If you want me to remove **all** dangling volumes, say: “prune dangling volumes”, and I’ll run `docker volume prune` (destructive, but only for `dangling=true`).
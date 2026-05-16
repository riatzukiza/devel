## Signal
(己, p=0.95) `/var/lib/docker/overlay2` being ~132GB is consistent with your current Docker disk profile: it’s mostly **image layer data + container writable layers** (not volumes).

(己, p=0.98) Right now Docker reports:
- (己, p=0.98) **Images:** 110.7GB total, **53.77GB reclaimable** (i.e. lots of unused images sitting in overlay2)
- (己, p=0.98) **Containers:** 5.498GB total, 3.482GB reclaimable
- (己, p=0.98) **Volumes:** 117GB total, **0B reclaimable** (these are *not* in overlay2; they live under `/var/lib/docker/volumes`)

(己, p=0.96) For your “keep only what’s needed for `services/openplanner`, `services/llamacpp-stack`, `services/proxx`, `services/voxx`” goal:

### Images REQUIRED by those target services (currently running)
These should be kept if you want those services to keep working:

- (己, p=0.95) `ghcr.io/ggml-org/llama.cpp:server-cuda` (llamacpp-stack) — unique **3.619GB**
- (己, p=0.95) `knoxx-shibboleth-backend:latest` (openplanner) — unique **1.677GB**
- (己, p=0.95) `openplanner-openplanner:latest` (openplanner) — unique **488.1MB**
- (己, p=0.95) `chromadb/chroma:latest` (openplanner) — unique **568.6MB**
- (己, p=0.95) `openhax/voxx:compose` (voxx) — unique **476MB**
- (己, p=0.95) `openhax/kokoro-server:compose` (voxx) — unique **28.1MB**
- (己, p=0.95) `node:22-bookworm` (openplanner) — unique **201.9MB** (shared across many openplanner containers)
- (己, p=0.95) `postgres:16-bookworm` (openplanner + proxx stacks) — unique **435.2MB**
- (己, p=0.95) `redis:7-alpine` (openplanner) — unique **41.41MB**
- (己, p=0.95) `python:3.12-alpine` (openplanner) — unique **40.51MB**
- (己, p=0.95) plus a couple **untagged images** currently in use:
  - (己, p=0.92) `<none>:<none>` unique **611.5MB** (used by `proxx-local`)
  - (己, p=0.92) `<none>:<none>` unique **2.281MB** (used by `openplanner` shuvcrawl container image-id)

### Biggest disk users from NON-target projects (currently running)
If you stop/remove these projects, you can then remove their images too:
- (己, p=0.95) `ollama/ollama:latest` — unique **6.089GB** (project: `ollama-stack`)
- (己, p=0.95) `redislabs/redismod:latest` — unique **1.679GB** (project: `mcp-stack`)
- (己, p=0.95) `mongo:7` — unique **869.7MB** (project: `cephalon-stack`)
- (己, p=0.95) `opencode-stack-opencode:latest` — unique **703MB** (project: `opencode-stack`)
…plus smaller ones from `our-gpus`, `routussy-dev`, `depenoxx`, `promethean-portal`, etc.

### Safe win: prune unused images (does not touch running containers)
(己, p=0.98) You currently have **672 unused images** (containers=0) totalling **~53.77GB** unique data. This is exactly the “Images reclaimable 53.77GB” you saw. This should directly reduce `overlay2`.

## Evidence
(己, p=0.99) I enumerated compose files under `/home/err/devel/services/*` and inspected live containers via `docker ps -a` labels (`com.docker.compose.project=...`) to group stacks.  
(己, p=0.99) Disk usage comes from `docker system df` + `docker system df -v` (saved at `/tmp/docker-system-df-v.after.txt`) and then programmatically:
- (己, p=0.98) identified “target” projects: `openplanner`, `llamacpp-stack`, `proxx-*`, `voxx`
- (己, p=0.98) computed unused images (`CONTAINERS=0`) and top offenders by **UNIQUE SIZE**
- (己, p=0.98) attributed running image usage to projects from `docker ps` labels.

## Frames
(己, p=0.82) Frame 1: You want **max disk reclaimed** while ensuring those 4 services still start. Best path: prune unused images now; then optionally remove non-target stacks.  
(己, p=0.78) Frame 2: You want a **strict allowlist**: only keep images used by those 4 services, even if other stacks are running; that implies stopping/removing those other stacks first.  
(己, p=0.75) Frame 3: You also care about **volumes** (117GB). That’s separate from overlay2; reclaiming volume space will require intentionally removing DB volumes for stacks you don’t care about.

## Countermoves
(己, p=0.90) Don’t delete anything under `/var/lib/docker/overlay2` manually; it’s easy to corrupt Docker’s layer store.  
(己, p=0.86) Note: `postgres:16-bookworm` is shared across many stacks (including your targets). Keeping targets likely means keeping that image.

## Next
(己, p=0.88) If you want the immediate safe overlay2 reduction, run: `docker image prune -a -f`
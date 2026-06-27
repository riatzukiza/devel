# @open-hax/vexx

`vexx` is the local semantic fast lane.

Scope:
- `POST /v1/cosine/matrix` — raw embedding JSON
- `POST /v1/cosine/topk` — raw embedding JSON with top-k
- `POST /v2/slabs/register` — register a float32 binary slab (memory-mapped)
- `GET /v2/slabs/list` — list registered slabs
- `GET /v2/slabs/info/:slab-id` — get slab metadata
- `POST /v2/cosine/topk-by-slab` — top-k by slab offsets (no JSON embeddings)
- explicit CPU / GPU / NPU device selection
- no silent accelerator fallback


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## v2 — Slab protocol

Eliminates JSON embedding transport for batch workloads. Embeddings live in a
binary float32 slab on disk; vexx memory-maps and reads them in-process.

### Register a slab

```bash
curl -X POST http://localhost:8787/v2/slabs/register \
  -H 'Content-Type: application/json' \
  -d '{"path":"/path/to/embeddings.f32","dims":768}'
```

Returns `{slabId, dims, rowCount}`. The slab file must be row-major float32,
L2-normalized, with `dims * rowCount * 4` bytes.

### Query top-k by slab offsets

```bash
curl -X POST http://localhost:8787/v2/cosine/topk-by-slab \
  -H 'Content-Type: application/json' \
  -d '{
    "slabId": "<id from register>",
    "queryOffset": 0,
    "candidateOffsets": [1, 5, 12, 20],
    "k": 3
  }'
```

Returns `{matches: [{offset, score}]}` sorted descending. Uses NPU when
`VEXX_REQUIRE_ACCEL=true` and OpenVINO is available.

Current backend split:
- `GPU` -> ONNX Runtime CUDA path
- `NPU` -> native OpenVINO-backed path through `libvexx_cosine.so`
- `CPU` -> local fallback

## Run

```bash
./scripts/build-native.sh
VEXX_DEVICE=NPU VEXX_REQUIRE_ACCEL=true clojure -M:run
```

## Host PM2 sidecar

OpenPlanner containers reach the host-side Vexx fast lane through
`http://host.docker.internal:8791`. The PM2 config binds to the host interface
so Docker containers can reach it, and avoids the local service already
occupying port `8787`:

```bash
./scripts/build-native.sh
pm2 start ecosystem.config.cjs --update-env
curl -fsS http://127.0.0.1:8791/v1/health
```

## Docker

```bash
docker build -t open-hax-vexx .
docker run --rm \
  --device /dev/accel:/dev/accel \
  --device /dev/dri:/dev/dri \
  -e VEXX_DEVICE=NPU \
  -e VEXX_REQUIRE_ACCEL=true \
  -p 8787:8788 \
  open-hax-vexx
```

## Env

- `VEXX_HOST` default `127.0.0.1`
- `VEXX_PORT` default `8788`
- `VEXX_API_KEY` optional bearer token
- `VEXX_DEVICE` default `AUTO`
- `VEXX_AUTO_ORDER` default `GPU,NPU,CPU`
- `VEXX_REQUIRE_ACCEL` default `false`
- `VEXX_PAIR_CACHE_MAX_ENTRIES` default `200000`
- `VEXX_CUDA_DEVICE_ID` default `0`
- `VEXX_NATIVE_LIB_PATH` optional explicit path
- `VEXX_COSINE_MATRIX_MODEL_PATH` optional explicit path

`vexx` keeps an in-memory LRU cache of pairwise cosine scores so repeated
single-query top-k and one-to-many matrix calls can reuse prior comparisons.

If `VEXX_COSINE_MATRIX_MODEL_PATH` is unset, `vexx` uses its own extracted
`models/cosine_matrix_dynamic.onnx`.

## Native payload

`vexx` vendors the minimum native payload it needs:
- cosine ONNX models extracted from `fork_tales`
- ONNX Runtime headers extracted from `fork_tales`
- ONNX Runtime OpenVINO shared libraries extracted from the official
  `onnxruntime-openvino` wheel

That keeps runtime execution local to `vexx` instead of depending on the
experimental `fork_tales` repo at runtime.

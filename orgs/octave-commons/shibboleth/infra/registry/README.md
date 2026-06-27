# Local container registry (localhost:5000)

This repo includes a minimal local Docker registry you can run on your machine to cache/publish **baked base images** (e.g. CUDA-capable ML runtimes, torch, embedding models).

## Start

```bash
docker compose -f infra/registry/docker-compose.registry.yml up -d
```

If you prefer a **system-wide** location instead of a repo-local compose file, this workspace also writes:

- `~/.config/local-container-registry/docker-compose.yml`
- `~/.config/systemd/user/local-container-registry.service`

Start it with:

```bash
docker compose -f ~/.config/local-container-registry/docker-compose.yml up -d
```

Verify:

```bash
curl -sSf http://localhost:5000/v2/_catalog
```

## Docker daemon config (HTTP registry)

Depending on your Docker installation, you may need to allow an insecure registry:

`/etc/docker/daemon.json`:

```json
{
  "insecure-registries": ["localhost:5000"]
}
```

Then restart docker.

## Build + push the baked ML base image

Preferred image tag pattern:

- `localhost:5000/shibboleth/ml-base:cuda12.4-<date>`

The current `Dockerfile.ml-base` is intended to be a reusable toolbox image based on an official CUDA-capable PyTorch runtime image.

```bash
docker build -f Dockerfile.ml-base \
  -t localhost:5000/shibboleth/ml-base:cuda12.4-2026-03-18 \
  .

docker push localhost:5000/shibboleth/ml-base:cuda12.4-2026-03-18
```

Optional (preload embedding model weights during build):

```bash
docker build -f Dockerfile.ml-base \
  --build-arg PRELOAD_E5=1 \
  -t localhost:5000/shibboleth/ml-base:cuda12.4-2026-03-18 \
  .
```

This is the image to reuse whenever you encounter:
- missing CUDA runtime libs in containers
- repeated torch/sentence-transformers rebuild pain
- the need to stand up a local ML dev/service container fast

## Use in this repo

```bash
PROMPTBENCH_BASE_IMAGE=localhost:5000/shibboleth/ml-base:2026-03-16 \
  docker compose build
```

Recommended:

```bash
PROMPTBENCH_BASE_IMAGE=localhost:5000/shibboleth/ml-base:cuda12.4-2026-03-18 \
  docker compose build
```

## Cleanup

Stop registry:

```bash
docker compose -f infra/registry/docker-compose.registry.yml down
```

Remove stored layers (irreversible):

```bash
docker volume rm shibboleth_registry-data
```

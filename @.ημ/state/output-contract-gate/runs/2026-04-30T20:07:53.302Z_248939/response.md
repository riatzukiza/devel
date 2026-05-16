## Signal

(己, p=0.98) Done. Kokoro is now actually CUDA-capable, not merely GPU-device-visible.

(世, p=0.98) `kokoro-server` now reports:

```text
torch 2.11.0+cu128
torch_cuda 12.8
cuda_available True
device_count 1
device0 NVIDIA GeForce RTX 4070 Laptop GPU
```

(己, p=0.96) I updated:

- `services/voxx/Dockerfile.kokoro`
  - installs CUDA PyTorch from `https://download.pytorch.org/whl/cu128`
  - keeps `USER nobody:nogroup`
- `services/voxx/README.md`
  - documents CUDA-enabled PyTorch in the Kokoro image

(己, p=0.98) Rebuilt and restarted:

```text
kokoro-server   Up
openhax-voxx    Up (healthy)
```

(己, p=0.98) Commits:

- `f6411689 Enable CUDA PyTorch for Kokoro runtime`
- `b6ef5dbc Record Kokoro CUDA runtime receipt`

## Evidence

(世, p=0.98) GPU runtime probe inside `kokoro-server`:

```text
torch 2.11.0+cu128
torch_cuda 12.8
cuda_available True
device_count 1
device0 NVIDIA GeForce RTX 4070 Laptop GPU
```

(世, p=0.95) Live Voxx TTS still works through Kokoro:

```text
x-openhax-tts-queue-wait-ms: 0
x-openhax-tts-queue-max-concurrent: 1
x-openhax-tts-backend: kokoro
x-openhax-tts-postprocess-profile: crisp-radio-v1
x-openhax-tts-prompt-aware: 0
```

(世, p=0.9) NVIDIA compute apps after synthesis showed GPU memory allocated, including a Kokoro/Python process:

```text
..., 898 MiB
```

(己, p=0.95) `docker compose config` passed after the change.

## Frames

(己, p=0.9) The previous state was “GPU devices mounted, CPU Torch installed.” The new state is “GPU devices mounted, CUDA Torch installed, CUDA available to Python.”

(己, p=0.88) Kokoro’s `KPipeline` auto-selects CUDA when `torch.cuda.is_available()` is true, so no prompt or app change was needed.

(己, p=0.85) The image is larger now because CUDA PyTorch pulls CUDA runtime libraries into the derived Kokoro image.

## Countermoves

(己, p=0.96) Container root constraint is still respected: Dockerfile privileged install steps happen before final `USER nobody:nogroup`.

(己, p=0.9) Voxx queue + CPU pinning from the prior step remain active.

(己, p=0.85) The legacy untracked `services/voxx/docker-compose.yml` was not committed; active runtime is still `services/voxx/compose.yaml`.

## Next

(汝, p=0.8) Use Voxx normally; Kokoro should now use CUDA for synthesis when selected.
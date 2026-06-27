# Omni Top (`otop`)

Omni Top is a btop-inspired OpenTUI dashboard for CPU, NPU, and GPU telemetry.

## Features

- Unified panels for CPU, Intel NPU, and GPUs (NVIDIA + Intel).
- Per-core CPU bars alongside the aggregate CPU meter.
- Auto-switching compact layout for short terminal panes, with `--layout compact|full|auto` override.
- Top process table by CPU usage.
- Live history sparklines for CPU/NPU/GPU utilization.
- Uses `@promethean-os/npu-top` exported telemetry helpers for NPU stats.

## Requirements

- Linux
- Bun runtime
- Optional NVIDIA tooling for GPU metrics (`nvidia-smi`)

## Usage

```bash
pnpm --filter @promethean-os/omni-top build
pnpm --filter @promethean-os/omni-top start
```

### Options

- `--refresh, -r <ms>` refresh interval in milliseconds (default: `1000`)
- `--history, -n <rows>` history sample count (default: `90`)
- `--processes, -p <rows>` process rows shown (default: `8`)
- `--layout, -l <mode>` `auto`, `compact`, or `full` layout selection (default: `auto`)
- `--help, -h` print help

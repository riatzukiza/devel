# npu-top

Simple, btop-inspired NPU monitoring dashboard built with OpenTUI.

## Features

- Live refresh from Linux sysfs (`/sys/class/accel`).
- Smooth utilization history line and meter bars.
- Device details panel (driver, PCI slot, vendor and device IDs).
- Demo mode (`--demo`) when no live NPU is available.

## Requirements

- Linux with NPU telemetry exposed under `/sys/class/accel`.
- Bun runtime (OpenTUI currently depends on Bun APIs).

## Usage

```bash
pnpm --filter @promethean-os/npu-top build
pnpm --filter @promethean-os/npu-top start

# Preview UI with generated metrics
pnpm --filter @promethean-os/npu-top dev
```

### CLI Options

- `--refresh, -r <ms>` refresh interval in milliseconds (default `1000`)
- `--history, -n <rows>` history sample count (default `90`)
- `--demo` use generated telemetry when no live NPU is detected
- `--help, -h` print help

## Notes

- Utilization may show `0%` on the first sample while the busy-time counter baseline is established.
- Temperature and power are read from hwmon when available, otherwise reported as `n/a`.

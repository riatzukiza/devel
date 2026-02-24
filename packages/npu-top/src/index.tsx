#!/usr/bin/env bun
/* eslint-disable no-console */

import { render, type JSX } from "@opentui/solid";
import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";

import {
  createDemoSnapshot,
  createNpuCollector,
  type NpuCollector,
  type NpuDeviceStats,
  type NpuSnapshot,
} from "./collector.js";

const PALETTE = {
  background: "#0b1117",
  panel: "#111a24",
  panelAlt: "#132030",
  border: "#26384a",
  text: "#d6e5f2",
  muted: "#8ca5bc",
  accent: "#7dc7ff",
  good: "#72d0a2",
  warm: "#f0bf67",
  danger: "#ff8c7d",
} as const;

const SPARK_RAMP = " .:-=+*#%@";

type CliOptions = {
  refreshMs: number;
  historySize: number;
  demo: boolean;
};

type DashboardProps = {
  options: CliOptions;
  collect: NpuCollector;
};

type PanelProps = {
  title: string;
  children: JSX.Element;
  background: string;
  borderColor?: string;
  flexGrow?: number;
  minWidth?: number;
  minHeight?: number;
};

type MeterProps = {
  label: string;
  value: string;
  percent: number | null;
  width: number;
};

function Panel(props: PanelProps) {
  return (
    <box
      title={` ${props.title} `}
      titleAlignment="left"
      border={true}
      borderColor={props.borderColor ?? PALETTE.border}
      backgroundColor={props.background}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      gap={1}
      flexDirection="column"
      flexGrow={props.flexGrow}
      minWidth={props.minWidth}
      minHeight={props.minHeight}
    >
      {props.children}
    </box>
  );
}

function Meter(props: MeterProps) {
  const color = () => (props.percent === null ? PALETTE.muted : meterColor(props.percent));
  return (
    <box gap={0}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={PALETTE.muted}>{props.label}</text>
        <text fg={PALETTE.text}>{props.value}</text>
      </box>
      <text fg={color()} selectable={false}>
        {renderBar(props.percent, props.width)}
      </text>
    </box>
  );
}

function DeviceTable(props: { devices: NpuDeviceStats[] }) {
  return (
    <box gap={0}>
      <text fg={PALETTE.muted}>devices</text>
      <Show when={props.devices.length > 0} fallback={<text fg={PALETTE.muted}>No live NPU rows yet.</text>}>
        <text fg={PALETTE.muted}>name               util    temp     power          memory</text>
        <For each={props.devices}>
          {(device) => (
            <text fg={PALETTE.text} selectable={false}>
              {formatDeviceRow(device)}
            </text>
          )}
        </For>
      </Show>
    </box>
  );
}

function Dashboard(props: DashboardProps) {
  const [snapshot, setSnapshot] = createSignal<NpuSnapshot>({
    source: "sysfs:/sys/class/accel",
    capturedAt: Date.now(),
    devices: [],
    summary: {
      utilizationPct: null,
      temperatureC: null,
      powerW: null,
      memoryUsedMB: null,
      memoryTotalMB: null,
      frequencyMHz: null,
      maxFrequencyMHz: null,
    },
    message: "Sampling NPU telemetry...",
  });
  const [history, setHistory] = createSignal<number[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  const terminalWidth = createMemo(() => Math.max(80, process.stdout.columns ?? 120));
  const meterWidth = createMemo(() => Math.max(20, Math.min(44, Math.floor(terminalWidth() * 0.24))));
  const graphWidth = createMemo(() => Math.max(26, Math.min(90, terminalWidth() - 14)));

  const memoryPercent = createMemo(() => {
    const used = snapshot().summary.memoryUsedMB;
    const total = snapshot().summary.memoryTotalMB;
    if (used === null || total === null || total <= 0) {
      return null;
    }
    return (used / total) * 100;
  });

  const frequencyPercent = createMemo(() => {
    const value = snapshot().summary.frequencyMHz;
    const max = snapshot().summary.maxFrequencyMHz;
    if (value === null || max === null || max <= 0) {
      return null;
    }
    return (value / max) * 100;
  });

  const temperaturePercent = createMemo(() => {
    const value = snapshot().summary.temperatureC;
    if (value === null) {
      return null;
    }
    return value;
  });

  const powerPercent = createMemo(() => {
    const value = snapshot().summary.powerW;
    if (value === null) {
      return null;
    }
    return (value / 25) * 100;
  });

  let pending = false;

  const updateSnapshot = async (): Promise<void> => {
    if (pending) {
      return;
    }

    pending = true;
    try {
      const live = await props.collect();
      const next = props.options.demo && live.devices.length === 0
        ? {
            ...createDemoSnapshot(),
            message: "Demo mode is enabled because no live NPU telemetry was found.",
          }
        : live;

      setSnapshot(next);
      setHistory((previous) => appendHistory(previous, next.summary.utilizationPct ?? 0, props.options.historySize));
      setError(null);
    } catch (cause) {
      setError(asErrorMessage(cause));
    } finally {
      pending = false;
    }
  };

  onMount(() => {
    void updateSnapshot();
    const timer = setInterval(() => {
      void updateSnapshot();
    }, props.options.refreshMs);
    onCleanup(() => clearInterval(timer));
  });

  return (
    <box flexDirection="column" gap={1} backgroundColor={PALETTE.background} paddingLeft={1} paddingRight={1}>
      <Panel title="npu-top" background={PALETTE.panel}>
        <box flexDirection="row" justifyContent="space-between">
          <text fg={PALETTE.text}>
            <b>npu-top</b>
          </text>
          <text fg={PALETTE.muted}>
            {formatClock(snapshot().capturedAt)} source: {snapshot().source}
          </text>
        </box>
        <text fg={PALETTE.muted}>A btop-inspired NPU dashboard. Press Ctrl+C to quit.</text>
      </Panel>

      <box flexDirection="row" gap={1} flexGrow={1} minHeight={0}>
        <Panel title="load" background={PALETTE.panel} flexGrow={3} minWidth={56} minHeight={0}>
          <Meter
            label="utilization"
            value={formatPercent(snapshot().summary.utilizationPct)}
            percent={snapshot().summary.utilizationPct}
            width={meterWidth()}
          />
          <Meter
            label="memory"
            value={formatMemoryPair(snapshot().summary.memoryUsedMB, snapshot().summary.memoryTotalMB)}
            percent={memoryPercent()}
            width={meterWidth()}
          />
          <Meter
            label="frequency"
            value={formatFrequency(snapshot().summary.frequencyMHz, snapshot().summary.maxFrequencyMHz)}
            percent={frequencyPercent()}
            width={meterWidth()}
          />
          <text fg={PALETTE.muted}>history</text>
          <text fg={PALETTE.accent} selectable={false}>
            {renderSparkline(history(), graphWidth())}
          </text>
          <DeviceTable devices={snapshot().devices} />
        </Panel>

        <box flexDirection="column" gap={1} flexGrow={2} minWidth={40} minHeight={0}>
          <Panel title="thermals and power" background={PALETTE.panelAlt} minHeight={0}>
            <Meter
              label="temperature"
              value={formatTemperature(snapshot().summary.temperatureC)}
              percent={temperaturePercent()}
              width={meterWidth()}
            />
            <Meter
              label="power"
              value={formatPower(snapshot().summary.powerW)}
              percent={powerPercent()}
              width={meterWidth()}
            />
          </Panel>

          <Panel title="device details" background={PALETTE.panelAlt} flexGrow={1} minHeight={0}>
            <Show when={snapshot().devices.length > 0} fallback={<text fg={PALETTE.muted}>No device metadata available.</text>}>
              <For each={snapshot().devices}>
                {(device) => (
                  <box gap={0}>
                    <text fg={PALETTE.text}>
                      <b>{truncate(device.name, 46)}</b>
                    </text>
                    <text fg={PALETTE.muted}>id: {device.id} driver: {device.driver ?? "n/a"}</text>
                    <text fg={PALETTE.muted}>status: {device.status ?? "n/a"} pci: {device.pciSlot ?? "n/a"}</text>
                    <text fg={PALETTE.muted}>vendor: {device.vendorId ?? "n/a"} device: {device.productId ?? "n/a"}</text>
                  </box>
                )}
              </For>
            </Show>
          </Panel>
        </box>
      </box>

      <Panel title="status" background={PALETTE.panel}>
        <Show
          when={error()}
          fallback={
            <text fg={PALETTE.muted}>
              {snapshot().message ?? `Monitoring ${snapshot().devices.length} NPU device(s) every ${props.options.refreshMs}ms.`}
            </text>
          }
        >
          {(message) => <text fg={PALETTE.danger}>Error: {message()}</text>}
        </Show>
      </Panel>
    </box>
  );
}

function parseOptions(argv: readonly string[]): CliOptions | null {
  let refreshMs = 1000;
  let historySize = 90;
  let demo = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      printHelp();
      return null;
    }

    if (token === "--demo") {
      demo = true;
      continue;
    }

    if (token === "--refresh" || token === "-r") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(value) && value >= 100) {
        refreshMs = Math.min(value, 60_000);
        index += 1;
        continue;
      }
    }

    if (token === "--history" || token === "-n") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(value) && value >= 20) {
        historySize = Math.min(value, 720);
        index += 1;
        continue;
      }
    }
  }

  return { refreshMs, historySize, demo };
}

function printHelp(): void {
  console.log(`npu-top

Simple btop-inspired NPU dashboard powered by OpenTUI.

Usage:
  npu-top [options]

Options:
  --refresh, -r <ms>   Refresh interval in milliseconds (min 100, default 1000)
  --history, -n <rows> Number of history samples to keep (min 20, default 90)
  --demo               Use generated telemetry when no live NPU is detected
  --help, -h           Show this help
`);
}

function appendHistory(history: readonly number[], value: number, maxSize: number): number[] {
  const next = [...history, clamp(value, 0, 100)];
  if (next.length <= maxSize) {
    return next;
  }
  return next.slice(next.length - maxSize);
}

function renderBar(percent: number | null, width: number): string {
  const innerWidth = Math.max(8, width - 2);
  if (percent === null) {
    return `[${".".repeat(innerWidth)}]`;
  }

  const safePercent = clamp(percent, 0, 100);
  const filled = Math.round((safePercent / 100) * innerWidth);
  return `[${"#".repeat(filled)}${".".repeat(Math.max(0, innerWidth - filled))}]`;
}

function renderSparkline(values: readonly number[], width: number): string {
  if (width <= 0) {
    return "";
  }

  if (values.length === 0) {
    return ".".repeat(width);
  }

  const sampled = sample(values, width);
  return sampled
    .map((value) => {
      const index = Math.round((clamp(value, 0, 100) / 100) * (SPARK_RAMP.length - 1));
      return SPARK_RAMP[index] ?? ".";
    })
    .join("");
}

function sample(values: readonly number[], targetLength: number): number[] {
  if (values.length === targetLength) {
    return [...values];
  }

  if (values.length < targetLength) {
    return [...new Array(targetLength - values.length).fill(0), ...values];
  }

  const sampled: number[] = [];
  for (let index = 0; index < targetLength; index += 1) {
    const sourceIndex = Math.floor((index / (targetLength - 1)) * (values.length - 1));
    sampled.push(values[sourceIndex] ?? 0);
  }
  return sampled;
}

function meterColor(percent: number): string {
  const clamped = clamp(percent, 0, 100);
  if (clamped >= 80) {
    return PALETTE.danger;
  }
  if (clamped >= 55) {
    return PALETTE.warm;
  }
  return PALETTE.good;
}

function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value.toFixed(1)}%`;
}

function formatTemperature(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value.toFixed(1)} C`;
}

function formatPower(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value.toFixed(2)} W`;
}

function formatMemoryPair(used: number | null, total: number | null): string {
  if (used === null && total === null) {
    return "n/a";
  }

  if (used !== null && total !== null) {
    return `${used.toFixed(0)} / ${total.toFixed(0)} MB`;
  }

  if (used !== null) {
    return `${used.toFixed(0)} MB`;
  }

  return `0 / ${total?.toFixed(0) ?? "0"} MB`;
}

function formatFrequency(value: number | null, max: number | null): string {
  if (value === null && max === null) {
    return "n/a";
  }

  if (value !== null && max !== null) {
    return `${value.toFixed(0)} / ${max.toFixed(0)} MHz`;
  }

  if (value !== null) {
    return `${value.toFixed(0)} MHz`;
  }

  return `0 / ${max?.toFixed(0) ?? "0"} MHz`;
}

function formatDeviceRow(device: NpuDeviceStats): string {
  const name = pad(truncate(device.name, 18), 18, "end");
  const util = pad(formatPercent(device.utilizationPct), 7, "start");
  const temp = pad(formatTemperature(device.temperatureC), 8, "start");
  const power = pad(formatPower(device.powerW), 10, "start");
  const memory = pad(formatMemoryPair(device.memoryUsedMB, device.memoryTotalMB), 14, "start");
  return `${name} ${util} ${temp} ${power} ${memory}`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, Math.max(0, maxLength - 1)) + ".";
}

function pad(value: string, width: number, side: "start" | "end"): string {
  if (value.length >= width) {
    return value;
  }
  return side === "start" ? value.padStart(width, " ") : value.padEnd(width, " ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function asErrorMessage(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }
  return String(cause);
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (!options) {
    return;
  }

  const collect = createNpuCollector();
  await render(() => <Dashboard options={options} collect={collect} />, {
    targetFps: 30,
    gatherStats: false,
    exitOnCtrlC: true,
    autoFocus: true,
    openConsoleOnError: true,
  });
}

void main().catch((cause) => {
  console.error(`[npu-top] ${asErrorMessage(cause)}`);
  process.exit(1);
});

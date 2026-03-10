#!/usr/bin/env bun
/* eslint-disable no-console */

import { render, type JSX } from "@opentui/solid";
import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";

import {
  createOmniCollector,
  type CpuStats,
  type GpuStats,
  type OmniCollector,
  type OmniSnapshot,
  type ProcessStats,
} from "./collector.js";

const PALETTE = {
  background: "#090f16",
  panel: "#101a25",
  panelAlt: "#122132",
  border: "#284056",
  text: "#d8e7f4",
  muted: "#8da8c0",
  accent: "#78c6ff",
  good: "#75d7a6",
  warm: "#f0c675",
  danger: "#ff8a7d",
} as const;

const SPARK_RAMP = " .:-=+*#%@";

type CliOptions = {
  refreshMs: number;
  historySize: number;
  processLimit: number;
};

type HistoryState = {
  cpu: number[];
  npu: number[];
  gpu: number[];
};

type DashboardProps = {
  options: CliOptions;
  collect: OmniCollector;
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

function ProcessTable(props: { processes: ProcessStats[] }) {
  return (
    <box gap={0}>
      <Show when={props.processes.length > 0} fallback={<text fg={PALETTE.muted}>No process rows available.</text>}>
        <text fg={PALETTE.muted}>pid      cpu%    mem%  process</text>
        <For each={props.processes}>
          {(processStat) => (
            <text fg={PALETTE.text} selectable={false}>
              {formatProcessRow(processStat)}
            </text>
          )}
        </For>
      </Show>
    </box>
  );
}

function GpuTable(props: { gpus: GpuStats[] }) {
  return (
    <box gap={0}>
      <Show when={props.gpus.length > 0} fallback={<text fg={PALETTE.muted}>No GPU telemetry rows available.</text>}>
        <text fg={PALETTE.muted}>gpu               util    temp      power         memory</text>
        <For each={props.gpus}>
          {(gpu) => (
            <text fg={PALETTE.text} selectable={false}>
              {formatGpuRow(gpu)}
            </text>
          )}
        </For>
      </Show>
    </box>
  );
}

function Dashboard(props: DashboardProps) {
  const [snapshot, setSnapshot] = createSignal<OmniSnapshot>(createEmptySnapshot());
  const [history, setHistory] = createSignal<HistoryState>({ cpu: [], npu: [], gpu: [] });
  const [error, setError] = createSignal<string | null>(null);

  const terminalWidth = createMemo(() => Math.max(96, process.stdout.columns ?? 140));
  const meterWidth = createMemo(() => Math.max(16, Math.min(30, Math.floor(terminalWidth() * 0.15))));
  const graphWidth = createMemo(() => Math.max(24, Math.min(60, Math.floor(terminalWidth() * 0.22))));

  const cpuMemoryPercent = createMemo(() => ratioPct(snapshot().cpu.memoryUsedMB, snapshot().cpu.memoryTotalMB));
  const npuMemoryPercent = createMemo(() => ratioPct(snapshot().npu.summary.memoryUsedMB, snapshot().npu.summary.memoryTotalMB));
  const npuFrequencyPercent = createMemo(() => ratioPct(snapshot().npu.summary.frequencyMHz, snapshot().npu.summary.maxFrequencyMHz));

  const gpuUtilizationPercent = createMemo(() => mean(snapshot().gpus.map((gpu) => gpu.utilizationPct)));
  const gpuMemoryUsedMB = createMemo(() => sum(snapshot().gpus.map((gpu) => gpu.memoryUsedMB)));
  const gpuMemoryTotalMB = createMemo(() => sum(snapshot().gpus.map((gpu) => gpu.memoryTotalMB)));
  const gpuMemoryPercent = createMemo(() => ratioPct(gpuMemoryUsedMB(), gpuMemoryTotalMB()));
  const gpuMaxTempC = createMemo(() => maxValue(snapshot().gpus.map((gpu) => gpu.temperatureC)));
  const gpuPowerW = createMemo(() => sum(snapshot().gpus.map((gpu) => gpu.powerW)));

  let pending = false;

  const updateSnapshot = async (): Promise<void> => {
    if (pending) {
      return;
    }

    pending = true;
    try {
      const next = await props.collect();
      setSnapshot(next);

      const nextCpu = next.cpu.usagePct ?? 0;
      const nextNpu = next.npu.summary.utilizationPct ?? 0;
      const nextGpu = mean(next.gpus.map((gpu) => gpu.utilizationPct)) ?? 0;

      setHistory((previous) => ({
        cpu: appendHistory(previous.cpu, nextCpu, props.options.historySize),
        npu: appendHistory(previous.npu, nextNpu, props.options.historySize),
        gpu: appendHistory(previous.gpu, nextGpu, props.options.historySize),
      }));

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
      <Panel title="omni top" background={PALETTE.panel}>
        <box flexDirection="row" justifyContent="space-between">
          <text fg={PALETTE.text}>
            <b>otop</b>
          </text>
          <text fg={PALETTE.muted}>
            {formatClock(snapshot().capturedAt)} source: {snapshot().source}
          </text>
        </box>
        <text fg={PALETTE.muted}>Unified CPU, NPU, and GPU monitor inspired by btop. Press Ctrl+C to quit.</text>
      </Panel>

      <box flexDirection="row" gap={1} minHeight={0}>
        <Panel title="cpu" background={PALETTE.panel} flexGrow={1} minWidth={34} minHeight={0}>
          <Meter label="utilization" value={formatPercent(snapshot().cpu.usagePct)} percent={snapshot().cpu.usagePct} width={meterWidth()} />
          <Meter label="memory" value={formatMemoryPair(snapshot().cpu.memoryUsedMB, snapshot().cpu.memoryTotalMB)} percent={cpuMemoryPercent()} width={meterWidth()} />
          <Meter label="temperature" value={formatTemperature(snapshot().cpu.temperatureC)} percent={snapshot().cpu.temperatureC} width={meterWidth()} />
          <text fg={PALETTE.muted}>cores: {snapshot().cpu.coreCount} freq: {formatMHz(snapshot().cpu.frequencyMHz)}</text>
          <text fg={PALETTE.muted}>load: {formatLoad(snapshot().cpu)}</text>
          <text fg={PALETTE.muted}>history</text>
          <text fg={PALETTE.accent}>{renderSparkline(history().cpu, graphWidth())}</text>
        </Panel>

        <Panel title="npu" background={PALETTE.panelAlt} flexGrow={1} minWidth={34} minHeight={0}>
          <Meter
            label="utilization"
            value={formatPercent(snapshot().npu.summary.utilizationPct)}
            percent={snapshot().npu.summary.utilizationPct}
            width={meterWidth()}
          />
          <Meter
            label="memory"
            value={formatMemoryPair(snapshot().npu.summary.memoryUsedMB, snapshot().npu.summary.memoryTotalMB)}
            percent={npuMemoryPercent()}
            width={meterWidth()}
          />
          <Meter
            label="frequency"
            value={formatFrequency(snapshot().npu.summary.frequencyMHz, snapshot().npu.summary.maxFrequencyMHz)}
            percent={npuFrequencyPercent()}
            width={meterWidth()}
          />
          <text fg={PALETTE.muted}>devices: {snapshot().npu.devices.length}</text>
          <text fg={PALETTE.muted}>history</text>
          <text fg={PALETTE.accent}>{renderSparkline(history().npu, graphWidth())}</text>
          <Show when={snapshot().npu.devices[0]}>
            {(device) => <text fg={PALETTE.muted}>{truncate(device().name, 48)}</text>}
          </Show>
        </Panel>

        <Panel title="gpu" background={PALETTE.panel} flexGrow={1} minWidth={34} minHeight={0}>
          <Meter label="utilization" value={formatPercent(gpuUtilizationPercent())} percent={gpuUtilizationPercent()} width={meterWidth()} />
          <Meter label="memory" value={formatMemoryPair(gpuMemoryUsedMB(), gpuMemoryTotalMB())} percent={gpuMemoryPercent()} width={meterWidth()} />
          <Meter label="temperature" value={formatTemperature(gpuMaxTempC())} percent={gpuMaxTempC()} width={meterWidth()} />
          <text fg={PALETTE.muted}>power: {formatPower(gpuPowerW())}</text>
          <text fg={PALETTE.muted}>history</text>
          <text fg={PALETTE.accent}>{renderSparkline(history().gpu, graphWidth())}</text>
          <GpuTable gpus={snapshot().gpus} />
        </Panel>
      </box>

      <Panel title="processes" background={PALETTE.panel} minHeight={0}>
        <ProcessTable processes={snapshot().processes} />
      </Panel>

      <Panel title="status" background={PALETTE.panel}>
        <Show
          when={error()}
          fallback={
            <text fg={PALETTE.muted}>
              {snapshot().warnings.length > 0
                ? snapshot().warnings.join(" | ")
                : `Monitoring every ${props.options.refreshMs}ms with ${snapshot().processes.length} process rows.`}
            </text>
          }
        >
          {(message) => <text fg={PALETTE.danger}>Error: {message()}</text>}
        </Show>
      </Panel>
    </box>
  );
}

function createEmptySnapshot(): OmniSnapshot {
  return {
    source: "cpu+npu+gpu",
    capturedAt: Date.now(),
    cpu: {
      usagePct: null,
      coreCount: 0,
      frequencyMHz: null,
      load1: 0,
      load5: 0,
      load15: 0,
      memoryUsedMB: null,
      memoryTotalMB: null,
      temperatureC: null,
    },
    npu: {
      source: "npu:init",
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
    },
    gpus: [],
    processes: [],
    warnings: [],
  };
}

function parseOptions(argv: readonly string[]): CliOptions | null {
  let refreshMs = 1000;
  let historySize = 90;
  let processLimit = 8;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      printHelp();
      return null;
    }

    if (token === "--refresh" || token === "-r") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(value) && value >= 100) {
        refreshMs = Math.min(value, 60_000);
        index += 1;
      }
      continue;
    }

    if (token === "--history" || token === "-n") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(value) && value >= 20) {
        historySize = Math.min(value, 720);
        index += 1;
      }
      continue;
    }

    if (token === "--processes" || token === "-p") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(value) && value >= 3) {
        processLimit = Math.min(value, 24);
        index += 1;
      }
    }
  }

  return {
    refreshMs,
    historySize,
    processLimit,
  };
}

function printHelp(): void {
  console.log(`otop

Omni Top: unified CPU, NPU, and GPU terminal monitor powered by OpenTUI.

Usage:
  otop [options]

Options:
  --refresh, -r <ms>     Refresh interval in milliseconds (min 100, default 1000)
  --history, -n <rows>   Number of history samples to keep (min 20, default 90)
  --processes, -p <rows> Number of process rows to display (min 3, default 8)
  --help, -h             Show this help
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

function ratioPct(value: number | null, total: number | null): number | null {
  if (value === null || total === null || total <= 0) {
    return null;
  }

  return clamp((value / total) * 100, 0, 100);
}

function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatLoad(cpu: CpuStats): string {
  return `${cpu.load1.toFixed(2)} ${cpu.load5.toFixed(2)} ${cpu.load15.toFixed(2)}`;
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

function formatMHz(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value.toFixed(0)} MHz`;
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

function formatGpuRow(gpu: GpuStats): string {
  const label = pad(truncate(gpu.name, 16), 16, "end");
  const util = pad(formatPercent(gpu.utilizationPct), 7, "start");
  const temp = pad(formatTemperature(gpu.temperatureC), 8, "start");
  const power = pad(formatPower(gpu.powerW), 11, "start");
  const memory = pad(formatMemoryPair(gpu.memoryUsedMB, gpu.memoryTotalMB), 15, "start");
  return `${label} ${util} ${temp} ${power} ${memory}`;
}

function formatProcessRow(processStat: ProcessStats): string {
  const pid = pad(String(processStat.pid), 7, "start");
  const cpu = pad(processStat.cpuPct.toFixed(1), 7, "start");
  const mem = pad(processStat.memPct.toFixed(1), 7, "start");
  const command = truncate(processStat.command, 28);
  return `${pid} ${cpu} ${mem}  ${command}`;
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

function mean(values: readonly (number | null)[]): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function sum(values: readonly (number | null)[]): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((total, value) => total + value, 0);
}

function maxValue(values: readonly (number | null)[]): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((max, value) => (value > max ? value : max), filtered[0]);
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

  const collect = createOmniCollector({
    processLimit: options.processLimit,
  });

  await render(() => <Dashboard options={options} collect={collect} />, {
    targetFps: 30,
    gatherStats: false,
    exitOnCtrlC: true,
    autoFocus: true,
    openConsoleOnError: true,
  });
}

void main().catch((cause) => {
  console.error(`[otop] ${asErrorMessage(cause)}`);
  process.exit(1);
});

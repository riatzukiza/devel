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
const COMPACT_LAYOUT_MAX_HEIGHT = 18;
const COMPACT_LAYOUT_MAX_WIDTH = 132;

type LayoutMode = "auto" | "full" | "compact";

type CliOptions = {
  refreshMs: number;
  historySize: number;
  processLimit: number;
  layout: LayoutMode;
};

type HistoryState = {
  cpu: number[];
  npu: number[];
  gpu: number[];
};

type TerminalSize = {
  width: number;
  height: number;
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
  border?: boolean;
  flexGrow?: number;
  minWidth?: number;
  minHeight?: number;
  paddingX?: number;
  paddingY?: number;
  gap?: number;
};

type MeterProps = {
  label: string;
  value: string;
  percent: number | null;
  width: number;
};

type CompactStripProps = {
  title: string;
  summary: string;
  percent: number | null;
  history: number[];
  background: string;
  barWidth: number;
  sparkWidth: number;
};

type CoreMeterProps = {
  index: number;
  indexWidth: number;
  percent: number | null;
  barWidth: number;
  minWidth: number;
};

function Panel(props: PanelProps) {
  return (
    <box
      title={` ${props.title} `}
      titleAlignment="left"
      border={props.border ?? true}
      borderColor={props.borderColor ?? PALETTE.border}
      backgroundColor={props.background}
      paddingLeft={props.paddingX ?? 1}
      paddingRight={props.paddingX ?? 1}
      paddingTop={props.paddingY ?? 0}
      paddingBottom={props.paddingY ?? 0}
      gap={props.gap ?? 0}
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

function CompactStrip(props: CompactStripProps) {
  const color = () => (props.percent === null ? PALETTE.muted : meterColor(props.percent));

  return (
    <box backgroundColor={props.background} flexDirection="row" gap={1} paddingLeft={1} paddingRight={1} flexGrow={1} minWidth={38}>
      <text fg={PALETTE.muted}>{props.title}</text>
      <text fg={color()} selectable={false}>
        {renderMiniBar(props.percent, props.barWidth)}
      </text>
      <text fg={PALETTE.text} flexGrow={1} truncate={true} wrapMode="none">
        {props.summary}
      </text>
      <text fg={PALETTE.accent} selectable={false}>
        {renderSparkline(props.history, props.sparkWidth)}
      </text>
    </box>
  );
}

function CoreMeter(props: CoreMeterProps) {
  const color = () => (props.percent === null ? PALETTE.muted : meterColor(props.percent));

  return (
    <box flexDirection="row" gap={0} minWidth={props.minWidth}>
      <text fg={PALETTE.muted}>{pad(String(props.index), props.indexWidth, "start")}[</text>
      <text fg={color()} selectable={false}>
        {renderMiniBar(props.percent, props.barWidth)}
      </text>
      <text fg={PALETTE.muted}>]</text>
      <text fg={PALETTE.text}> {pad(formatPercentCompact(props.percent), 4, "start")}</text>
    </box>
  );
}

function CoreMeterGrid(props: {
  cores: readonly (number | null)[];
  barWidth: number;
  background?: string;
  paddingX?: number;
}) {
  const indexWidth = Math.max(1, String(Math.max(0, props.cores.length - 1)).length);
  const minWidth = indexWidth + props.barWidth + 7;

  return (
    <Show when={props.cores.length > 0}>
      <box
        backgroundColor={props.background}
        paddingLeft={props.paddingX ?? 0}
        paddingRight={props.paddingX ?? 0}
        flexDirection="row"
        flexWrap="wrap"
        columnGap={1}
        rowGap={0}
        minHeight={0}
      >
        <For each={props.cores}>
          {(percent, index) => <CoreMeter index={index()} indexWidth={indexWidth} percent={percent} barWidth={props.barWidth} minWidth={minWidth} />}
        </For>
      </box>
    </Show>
  );
}

function CompactDashboardLayout(props: {
  snapshot: OmniSnapshot;
  history: HistoryState;
  options: CliOptions;
  error: string | null;
  terminalWidth: number;
}) {
  const barWidth = Math.max(8, Math.min(12, Math.floor(props.terminalWidth * 0.05)));
  const sparkWidth = Math.max(10, Math.min(18, Math.floor(props.terminalWidth * 0.08)));
  const coreBarWidth = pickCoreBarWidth(props.terminalWidth, props.snapshot.cpu.coreUsagePct.length, true);
  const processCount = Math.max(1, Math.min(4, Math.floor(props.terminalWidth / 34)));
  const cpuSummary = `${formatPercent(props.snapshot.cpu.usagePct)} mem ${formatMemoryPairCompact(
    props.snapshot.cpu.memoryUsedMB,
    props.snapshot.cpu.memoryTotalMB,
  )} tmp ${formatTemperatureCompact(props.snapshot.cpu.temperatureC)} ld ${props.snapshot.cpu.load1.toFixed(1)}`;
  const npuSummary = `${formatPercent(props.snapshot.npu.summary.utilizationPct)} mem ${formatMemoryPairCompact(
    props.snapshot.npu.summary.memoryUsedMB,
    props.snapshot.npu.summary.memoryTotalMB,
  )} freq ${formatFrequencyCompact(props.snapshot.npu.summary.frequencyMHz, props.snapshot.npu.summary.maxFrequencyMHz)}`;
  const gpuSummary = `${formatPercent(mean(props.snapshot.gpus.map((gpu) => gpu.utilizationPct)))} mem ${formatMemoryPairCompact(
    sum(props.snapshot.gpus.map((gpu) => gpu.memoryUsedMB)),
    sum(props.snapshot.gpus.map((gpu) => gpu.memoryTotalMB)),
  )} tmp ${formatTemperatureCompact(maxValue(props.snapshot.gpus.map((gpu) => gpu.temperatureC)))} pwr ${formatPowerCompact(
    sum(props.snapshot.gpus.map((gpu) => gpu.powerW)),
  )}`;
  const statusMessage = props.error
    ? `error: ${props.error}`
    : props.snapshot.warnings.length > 0
      ? props.snapshot.warnings.join(" | ")
      : formatCompactFooter(props.snapshot, props.options.refreshMs);

  return (
    <>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={PALETTE.text}>
          <b>otop</b>
        </text>
        <text fg={PALETTE.muted}>
          {formatClock(props.snapshot.capturedAt)} {formatRefreshInterval(props.options.refreshMs)} {props.snapshot.source}
        </text>
      </box>

      <CoreMeterGrid cores={props.snapshot.cpu.coreUsagePct} barWidth={coreBarWidth} background={PALETTE.panel} paddingX={1} />

      <box flexDirection="row" gap={1} flexWrap="wrap" minHeight={0}>
        <CompactStrip
          title="cpu"
          percent={props.snapshot.cpu.usagePct}
          summary={cpuSummary}
          history={props.history.cpu}
          background={PALETTE.panel}
          barWidth={barWidth}
          sparkWidth={sparkWidth}
        />
        <CompactStrip
          title="npu"
          percent={props.snapshot.npu.summary.utilizationPct}
          summary={npuSummary}
          history={props.history.npu}
          background={PALETTE.panelAlt}
          barWidth={barWidth}
          sparkWidth={sparkWidth}
        />
        <CompactStrip
          title="gpu"
          percent={mean(props.snapshot.gpus.map((gpu) => gpu.utilizationPct))}
          summary={gpuSummary}
          history={props.history.gpu}
          background={PALETTE.panel}
          barWidth={barWidth}
          sparkWidth={sparkWidth}
        />
      </box>

      <box backgroundColor={PALETTE.panel} paddingLeft={1} paddingRight={1}>
        <text fg={PALETTE.text} truncate={true} wrapMode="none">
          {formatCompactProcessList(props.snapshot.processes, processCount)}
        </text>
      </box>

      <box backgroundColor={PALETTE.panelAlt} paddingLeft={1} paddingRight={1}>
        <text fg={props.error ? PALETTE.danger : props.snapshot.warnings.length > 0 ? PALETTE.warm : PALETTE.muted} truncate={true} wrapMode="none">
          {statusMessage}
        </text>
      </box>
    </>
  );
}

function FullDashboardLayout(props: {
  snapshot: OmniSnapshot;
  history: HistoryState;
  options: CliOptions;
  error: string | null;
  terminalWidth: number;
}) {
  const meterWidth = Math.max(12, Math.min(24, Math.floor(props.terminalWidth * 0.14)));
  const graphWidth = Math.max(18, Math.min(48, Math.floor(props.terminalWidth * 0.18)));
  const coreBarWidth = pickCoreBarWidth(Math.max(48, Math.floor(props.terminalWidth / 3)), props.snapshot.cpu.coreUsagePct.length, false);
  const cpuMemoryPercent = ratioPct(props.snapshot.cpu.memoryUsedMB, props.snapshot.cpu.memoryTotalMB);
  const npuMemoryPercent = ratioPct(props.snapshot.npu.summary.memoryUsedMB, props.snapshot.npu.summary.memoryTotalMB);
  const npuFrequencyPercent = ratioPct(props.snapshot.npu.summary.frequencyMHz, props.snapshot.npu.summary.maxFrequencyMHz);
  const gpuUtilizationPercent = mean(props.snapshot.gpus.map((gpu) => gpu.utilizationPct));
  const gpuMemoryUsedMB = sum(props.snapshot.gpus.map((gpu) => gpu.memoryUsedMB));
  const gpuMemoryTotalMB = sum(props.snapshot.gpus.map((gpu) => gpu.memoryTotalMB));
  const gpuMemoryPercent = ratioPct(gpuMemoryUsedMB, gpuMemoryTotalMB);
  const gpuMaxTempC = maxValue(props.snapshot.gpus.map((gpu) => gpu.temperatureC));
  const gpuPowerW = sum(props.snapshot.gpus.map((gpu) => gpu.powerW));
  const npuDeviceLabel = props.snapshot.npu.devices[0]
    ? `devices: ${props.snapshot.npu.devices.length} ${truncate(props.snapshot.npu.devices[0].name, 26)}`
    : "devices: 0";

  return (
    <>
      <Panel title="omni top" background={PALETTE.panel}>
        <box flexDirection="row" justifyContent="space-between">
          <text fg={PALETTE.text}>
            <b>otop</b> unified CPU / NPU / GPU monitor
          </text>
          <text fg={PALETTE.muted}>
            {formatClock(props.snapshot.capturedAt)} source: {props.snapshot.source}
          </text>
        </box>
      </Panel>

      <box flexDirection="row" gap={1} minHeight={0}>
        <Panel title="cpu" background={PALETTE.panel} flexGrow={1} minWidth={34} minHeight={0}>
          <Meter label="utilization" value={formatPercent(props.snapshot.cpu.usagePct)} percent={props.snapshot.cpu.usagePct} width={meterWidth} />
          <Meter
            label="memory"
            value={formatMemoryPair(props.snapshot.cpu.memoryUsedMB, props.snapshot.cpu.memoryTotalMB)}
            percent={cpuMemoryPercent}
            width={meterWidth}
          />
          <Meter label="temperature" value={formatTemperature(props.snapshot.cpu.temperatureC)} percent={props.snapshot.cpu.temperatureC} width={meterWidth} />
          <text fg={PALETTE.muted}>cores: {props.snapshot.cpu.coreCount}  freq: {formatMHz(props.snapshot.cpu.frequencyMHz)}  load: {formatLoad(props.snapshot.cpu)}</text>
          <CoreMeterGrid cores={props.snapshot.cpu.coreUsagePct} barWidth={coreBarWidth} />
          <text fg={PALETTE.accent}>hist {renderSparkline(props.history.cpu, graphWidth)}</text>
        </Panel>

        <Panel title="npu" background={PALETTE.panelAlt} flexGrow={1} minWidth={34} minHeight={0}>
          <Meter
            label="utilization"
            value={formatPercent(props.snapshot.npu.summary.utilizationPct)}
            percent={props.snapshot.npu.summary.utilizationPct}
            width={meterWidth}
          />
          <Meter
            label="memory"
            value={formatMemoryPair(props.snapshot.npu.summary.memoryUsedMB, props.snapshot.npu.summary.memoryTotalMB)}
            percent={npuMemoryPercent}
            width={meterWidth}
          />
          <Meter
            label="frequency"
            value={formatFrequency(props.snapshot.npu.summary.frequencyMHz, props.snapshot.npu.summary.maxFrequencyMHz)}
            percent={npuFrequencyPercent}
            width={meterWidth}
          />
          <text fg={PALETTE.muted}>{npuDeviceLabel}</text>
          <text fg={PALETTE.accent}>hist {renderSparkline(props.history.npu, graphWidth)}</text>
        </Panel>

        <Panel title="gpu" background={PALETTE.panel} flexGrow={1} minWidth={34} minHeight={0}>
          <Meter label="utilization" value={formatPercent(gpuUtilizationPercent)} percent={gpuUtilizationPercent} width={meterWidth} />
          <Meter label="memory" value={formatMemoryPair(gpuMemoryUsedMB, gpuMemoryTotalMB)} percent={gpuMemoryPercent} width={meterWidth} />
          <Meter label="temperature" value={formatTemperature(gpuMaxTempC)} percent={gpuMaxTempC} width={meterWidth} />
          <text fg={PALETTE.muted}>power: {formatPower(gpuPowerW)}  devices: {props.snapshot.gpus.length}</text>
          <text fg={PALETTE.accent}>hist {renderSparkline(props.history.gpu, graphWidth)}</text>
          <GpuTable gpus={props.snapshot.gpus} />
        </Panel>
      </box>

      <Panel title="processes" background={PALETTE.panel} minHeight={0}>
        <ProcessTable processes={props.snapshot.processes} />
      </Panel>

      <Panel title="status" background={PALETTE.panel}>
        <Show
          when={props.error}
          fallback={
            <text fg={PALETTE.muted}>
              {props.snapshot.warnings.length > 0
                ? props.snapshot.warnings.join(" | ")
                : `Monitoring every ${props.options.refreshMs}ms with ${props.snapshot.processes.length} process rows.`}
            </text>
          }
        >
          {(message) => <text fg={PALETTE.danger}>Error: {message()}</text>}
        </Show>
      </Panel>
    </>
  );
}

function Dashboard(props: DashboardProps) {
  const [snapshot, setSnapshot] = createSignal<OmniSnapshot>(createEmptySnapshot());
  const [history, setHistory] = createSignal<HistoryState>({ cpu: [], npu: [], gpu: [] });
  const [error, setError] = createSignal<string | null>(null);
  const [terminalSize, setTerminalSize] = createSignal<TerminalSize>(readTerminalSize());

  const terminalWidth = createMemo(() => terminalSize().width);
  const terminalHeight = createMemo(() => terminalSize().height);
  const compactLayout = createMemo(() => resolveCompactLayout(props.options.layout, terminalWidth(), terminalHeight()));

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
    const handleResize = () => setTerminalSize(readTerminalSize());
    const timer = setInterval(() => {
      void updateSnapshot();
    }, props.options.refreshMs);

    if (process.stdout.isTTY) {
      process.stdout.on("resize", handleResize);
      onCleanup(() => process.stdout.off("resize", handleResize));
    }

    onCleanup(() => clearInterval(timer));
  });

  return (
    <box flexDirection="column" gap={compactLayout() ? 0 : 1} backgroundColor={PALETTE.background} paddingLeft={1} paddingRight={1}>
      <Show
        when={compactLayout()}
        fallback={
          <FullDashboardLayout
            snapshot={snapshot()}
            history={history()}
            options={props.options}
            error={error()}
            terminalWidth={terminalWidth()}
          />
        }
      >
        <CompactDashboardLayout
          snapshot={snapshot()}
          history={history()}
          options={props.options}
          error={error()}
          terminalWidth={terminalWidth()}
        />
      </Show>
    </box>
  );
}

function readTerminalSize(): TerminalSize {
  return {
    width: Math.max(80, process.stdout.columns ?? 140),
    height: Math.max(8, process.stdout.rows ?? 32),
  };
}

function resolveCompactLayout(layout: LayoutMode, width: number, height: number): boolean {
  if (layout === "compact") {
    return true;
  }

  if (layout === "full") {
    return false;
  }

  return height <= COMPACT_LAYOUT_MAX_HEIGHT || width <= COMPACT_LAYOUT_MAX_WIDTH;
}

function createEmptySnapshot(): OmniSnapshot {
  return {
    source: "cpu+npu+gpu",
    capturedAt: Date.now(),
    cpu: {
      usagePct: null,
      coreCount: 0,
      coreUsagePct: [],
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
  let layout: LayoutMode = "auto";

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
      continue;
    }

    if (token === "--layout" || token === "-l") {
      const value = parseLayoutMode(argv[index + 1]);
      if (value) {
        layout = value;
        index += 1;
      }
    }
  }

  return {
    refreshMs,
    historySize,
    processLimit,
    layout,
  };
}

function parseLayoutMode(value: string | undefined): LayoutMode | null {
  if (value === "auto" || value === "full" || value === "compact") {
    return value;
  }

  return null;
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
  --layout, -l <mode>    Layout mode: auto, compact, or full (default auto)
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

function renderMiniBar(percent: number | null, width: number): string {
  const innerWidth = Math.max(4, width);
  if (percent === null) {
    return ".".repeat(innerWidth);
  }

  const safePercent = clamp(percent, 0, 100);
  const filled = Math.round((safePercent / 100) * innerWidth);
  return `${"#".repeat(filled)}${".".repeat(Math.max(0, innerWidth - filled))}`;
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

function formatPercentCompact(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${Math.round(value)}%`;
}

function formatTemperature(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value.toFixed(1)} C`;
}

function formatTemperatureCompact(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value.toFixed(0)}C`;
}

function formatPower(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value.toFixed(2)} W`;
}

function formatPowerCompact(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}kW`;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)}W`;
}

function formatMHz(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value.toFixed(0)} MHz`;
}

function formatMHzCompact(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}G`;
  }

  return `${value.toFixed(0)}M`;
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

function formatMemoryCompact(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  if (Math.abs(value) >= 1024) {
    return `${(value / 1024).toFixed(value >= 1024 * 100 ? 0 : 1)}G`;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)}M`;
}

function formatMemoryPairCompact(used: number | null, total: number | null): string {
  if (used === null && total === null) {
    return "n/a";
  }

  if (used !== null && total !== null) {
    return `${formatMemoryCompact(used)}/${formatMemoryCompact(total)}`;
  }

  if (used !== null) {
    return formatMemoryCompact(used);
  }

  return `0/${formatMemoryCompact(total)}`;
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

function formatFrequencyCompact(value: number | null, max: number | null): string {
  if (value === null && max === null) {
    return "n/a";
  }

  if (value !== null && max !== null) {
    return `${formatMHzCompact(value)}/${formatMHzCompact(max)}`;
  }

  if (value !== null) {
    return formatMHzCompact(value);
  }

  return `0/${formatMHzCompact(max)}`;
}

function formatRefreshInterval(refreshMs: number): string {
  if (refreshMs < 1000) {
    return `${refreshMs}ms`;
  }

  return `${(refreshMs / 1000).toFixed(refreshMs % 1000 === 0 ? 1 : 2)}s`;
}

function pickCoreBarWidth(width: number, coreCount: number, compact: boolean): number {
  if (coreCount <= 0) {
    return compact ? 4 : 6;
  }

  const indexWidth = Math.max(1, String(Math.max(0, coreCount - 1)).length);
  const targetColumns = compact ? Math.max(4, Math.floor(width / 16)) : Math.max(3, Math.floor(width / 18));
  const columns = Math.max(1, Math.min(coreCount, targetColumns));
  const reservedWidth = columns * (indexWidth + 7) + Math.max(0, columns - 1);
  const availableWidth = Math.floor((width - reservedWidth) / columns);

  return clamp(availableWidth, compact ? 4 : 5, compact ? 8 : 10);
}

function formatCompactProcessList(processes: readonly ProcessStats[], limit: number): string {
  if (processes.length === 0) {
    return "proc n/a";
  }

  return `proc ${processes.slice(0, limit).map((processStat) => formatCompactProcess(processStat)).join(" | ")}`;
}

function formatCompactProcess(processStat: ProcessStats): string {
  return `${truncate(processStat.command, 10)} ${processStat.cpuPct.toFixed(0)}/${processStat.memPct.toFixed(0)}`;
}

function formatCompactFooter(snapshot: OmniSnapshot, refreshMs: number): string {
  const npuLabel = snapshot.npu.devices[0] ? `npu ${truncate(snapshot.npu.devices[0].name, 16)}` : `npu ${snapshot.npu.devices.length} dev`;
  const gpuLabel = snapshot.gpus[0] ? `gpu ${truncate(snapshot.gpus[0].name, 16)}` : `gpu ${snapshot.gpus.length} dev`;
  return `refresh ${formatRefreshInterval(refreshMs)} | cpu ${snapshot.cpu.coreCount}c | ${npuLabel} | ${gpuLabel}`;
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

import { spawn } from "node:child_process";
import { readdir, readFile, readlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createNpuCollector, type NpuSnapshot } from "@promethean-os/npu-top/npu";

const COMMAND_TIMEOUT_MS = 900;

const NVIDIA_QUERY_ARGS = [
  "--query-gpu=index,name,utilization.gpu,temperature.gpu,power.draw,power.limit,memory.used,memory.total",
  "--format=csv,noheader,nounits",
] as const;

type CpuCounterSample = {
  total: number;
  idle: number;
};

type CommandResult = {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  errorCode: string | null;
  timedOut: boolean;
};

export type OmniCollectorOptions = {
  processLimit?: number;
};

export type OmniCollector = () => Promise<OmniSnapshot>;

export type CpuStats = {
  usagePct: number | null;
  coreCount: number;
  frequencyMHz: number | null;
  load1: number;
  load5: number;
  load15: number;
  memoryUsedMB: number | null;
  memoryTotalMB: number | null;
  temperatureC: number | null;
};

export type GpuStats = {
  id: string;
  vendor: "nvidia" | "intel";
  name: string;
  driver: string | null;
  utilizationPct: number | null;
  temperatureC: number | null;
  powerW: number | null;
  powerLimitW: number | null;
  memoryUsedMB: number | null;
  memoryTotalMB: number | null;
  frequencyMHz: number | null;
  maxFrequencyMHz: number | null;
};

export type ProcessStats = {
  pid: number;
  cpuPct: number;
  memPct: number;
  command: string;
};

export type OmniSnapshot = {
  source: string;
  capturedAt: number;
  cpu: CpuStats;
  npu: NpuSnapshot;
  gpus: GpuStats[];
  processes: ProcessStats[];
  warnings: string[];
};

export function createOmniCollector(options: OmniCollectorOptions = {}): OmniCollector {
  const collectNpu = createNpuCollector();
  const processLimit = clampInt(options.processLimit ?? 8, 3, 24);
  let previousCpuCounter: CpuCounterSample | null = null;

  return async () => {
    const capturedAt = Date.now();
    const warnings: string[] = [];

    const [cpuResult, npuResult, gpuResult, processResult] = await Promise.all([
      collectCpuStats(previousCpuCounter),
      collectNpuSafe(collectNpu),
      collectGpuStats(),
      collectTopProcesses(processLimit),
    ]);

    previousCpuCounter = cpuResult.counter;
    warnings.push(...npuResult.warnings, ...gpuResult.warnings, ...processResult.warnings);

    return {
      source: "cpu+npu+gpu",
      capturedAt,
      cpu: cpuResult.stats,
      npu: npuResult.snapshot,
      gpus: gpuResult.gpus,
      processes: processResult.processes,
      warnings,
    };
  };
}

async function collectNpuSafe(collectNpu: () => Promise<NpuSnapshot>): Promise<{ snapshot: NpuSnapshot; warnings: string[] }> {
  try {
    const snapshot = await collectNpu();
    return {
      snapshot,
      warnings: snapshot.message ? [snapshot.message] : [],
    };
  } catch (cause) {
    return {
      snapshot: emptyNpuSnapshot("NPU telemetry failed"),
      warnings: [`NPU collector error: ${asErrorMessage(cause)}`],
    };
  }
}

async function collectCpuStats(previous: CpuCounterSample | null): Promise<{ stats: CpuStats; counter: CpuCounterSample | null }> {
  const [counter, meminfo, frequencyMHz, temperatureC] = await Promise.all([
    readCpuCounter(),
    readMeminfo(),
    readAverageCpuFrequencyMHz(),
    readCpuTemperatureC(),
  ]);

  const usagePct = computeCpuUsagePct(previous, counter);
  const memoryTotalMB = meminfo?.totalKB ? meminfo.totalKB / 1024 : null;
  const memoryUsedMB = meminfo?.totalKB && meminfo.availableKB !== null
    ? (meminfo.totalKB - meminfo.availableKB) / 1024
    : null;
  const [load1, load5, load15] = os.loadavg();

  return {
    stats: {
      usagePct,
      coreCount: os.cpus().length,
      frequencyMHz,
      load1,
      load5,
      load15,
      memoryUsedMB,
      memoryTotalMB,
      temperatureC,
    },
    counter,
  };
}

async function collectGpuStats(): Promise<{ gpus: GpuStats[]; warnings: string[] }> {
  const [nvidiaResult, intelResult] = await Promise.all([collectNvidiaGpus(), collectIntelGpus()]);

  return {
    gpus: [...nvidiaResult.gpus, ...intelResult.gpus],
    warnings: [...nvidiaResult.warnings, ...intelResult.warnings],
  };
}

async function collectNvidiaGpus(): Promise<{ gpus: GpuStats[]; warnings: string[] }> {
  const command = await runCommand("nvidia-smi", [...NVIDIA_QUERY_ARGS], COMMAND_TIMEOUT_MS);
  if (!command.ok) {
    if (command.errorCode === "ENOENT") {
      return { gpus: [], warnings: [] };
    }

    if (command.timedOut) {
      return { gpus: [], warnings: ["nvidia-smi timed out"] };
    }

    return { gpus: [], warnings: command.stderr ? [`nvidia-smi: ${command.stderr}`] : [] };
  }

  const gpus = command.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [index, name, util, temp, power, powerLimit, memUsed, memTotal] = line.split(",").map((part) => part.trim());
      return {
        id: `nvidia:${index}`,
        vendor: "nvidia",
        name,
        driver: "nvidia",
        utilizationPct: normalizeUtilization(parseNumber(util)),
        temperatureC: normalizeTemperature(parseNumber(temp)),
        powerW: normalizePower(parseNumber(power)),
        powerLimitW: normalizePower(parseNumber(powerLimit)),
        memoryUsedMB: parseNumber(memUsed),
        memoryTotalMB: parseNumber(memTotal),
        frequencyMHz: null,
        maxFrequencyMHz: null,
      } satisfies GpuStats;
    });

  return { gpus, warnings: [] };
}

async function collectIntelGpus(): Promise<{ gpus: GpuStats[]; warnings: string[] }> {
  const drmRoot = "/sys/class/drm";
  const entries = await listDirectoryNames(drmRoot);
  const cards = entries.filter((name) => /^card\d+$/i.test(name));
  if (cards.length === 0) {
    return { gpus: [], warnings: [] };
  }

  const gpus = (
    await Promise.all(cards.map((card) => collectIntelGpu(drmRoot, card)))
  ).filter((gpu): gpu is GpuStats => gpu !== null);

  return { gpus, warnings: [] };
}

async function collectIntelGpu(drmRoot: string, card: string): Promise<GpuStats | null> {
  const cardRoot = path.join(drmRoot, card);
  const deviceRoot = path.join(cardRoot, "device");
  const vendorId = await readText(path.join(deviceRoot, "vendor"));

  if (!vendorId || vendorId.toLowerCase() !== "0x8086") {
    return null;
  }

  const [
    productId,
    driver,
    utilizationRaw,
    frequencyRaw,
    maxFrequencyRaw,
    memoryUsedRaw,
    memoryTotalRaw,
    temperatureRaw,
    powerRaw,
  ] = await Promise.all([
    readText(path.join(deviceRoot, "device")),
    readLinkName(path.join(deviceRoot, "driver")),
    readFirstNumber(deviceRoot, ["gpu_busy_percent"]),
    readFirstNumber(deviceRoot, ["gt_cur_freq_mhz", "rps_cur_freq_mhz", "tile0/gt0/freq0/cur_freq"]),
    readFirstNumber(deviceRoot, ["gt_max_freq_mhz", "rps_max_freq_mhz", "tile0/gt0/freq0/max_freq"]),
    readFirstNumber(deviceRoot, ["mem_info_vram_used", "mem_info_local_mem_used"]),
    readFirstNumber(deviceRoot, ["mem_info_vram_total", "mem_info_local_mem_total"]),
    readHwmonMetric(deviceRoot, ["temp1_input", "temp_input"]),
    readHwmonMetric(deviceRoot, ["power1_average", "power1_input"]),
  ]);

  return {
    id: `intel:${card}`,
    vendor: "intel",
    name: `Intel ${driver === "xe" ? "Arc" : "GPU"} ${card}${productId ? ` (${productId})` : ""}`,
    driver,
    utilizationPct: normalizeUtilization(utilizationRaw),
    temperatureC: normalizeTemperature(temperatureRaw),
    powerW: normalizePower(powerRaw),
    powerLimitW: null,
    memoryUsedMB: normalizeMemory(memoryUsedRaw),
    memoryTotalMB: normalizeMemory(memoryTotalRaw),
    frequencyMHz: normalizeFrequency(frequencyRaw),
    maxFrequencyMHz: normalizeFrequency(maxFrequencyRaw),
  };
}

async function collectTopProcesses(limit: number): Promise<{ processes: ProcessStats[]; warnings: string[] }> {
  const result = await runCommand(
    "ps",
    ["-eo", "pid,pcpu,pmem,comm", "--sort=-pcpu", "--no-headers"],
    COMMAND_TIMEOUT_MS,
  );

  if (!result.ok) {
    if (result.errorCode === "ENOENT") {
      return { processes: [], warnings: ["ps command not found"] };
    }
    return { processes: [], warnings: result.stderr ? [`ps: ${result.stderr}`] : [] };
  }

  const processes = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, limit)
    .map((line) => {
      const [pidRaw, cpuRaw, memRaw, command] = line.split(/\s+/, 4);
      return {
        pid: Number.parseInt(pidRaw ?? "0", 10),
        cpuPct: parseNumber(cpuRaw) ?? 0,
        memPct: parseNumber(memRaw) ?? 0,
        command: command ?? "unknown",
      } satisfies ProcessStats;
    })
    .filter((processStat) => Number.isFinite(processStat.pid) && processStat.pid > 0);

  return { processes, warnings: [] };
}

async function readCpuCounter(): Promise<CpuCounterSample | null> {
  const raw = await readText("/proc/stat");
  if (!raw) {
    return null;
  }

  const line = raw.split("\n").find((value) => value.startsWith("cpu "));
  if (!line) {
    return null;
  }

  const fields = line.trim().split(/\s+/).slice(1).map((value) => Number.parseFloat(value));
  if (fields.length < 4 || fields.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const idle = (fields[3] ?? 0) + (fields[4] ?? 0);
  const total = fields.reduce((sum, value) => sum + value, 0);

  return { total, idle };
}

function computeCpuUsagePct(previous: CpuCounterSample | null, current: CpuCounterSample | null): number | null {
  if (!previous || !current) {
    return null;
  }

  const totalDelta = current.total - previous.total;
  const idleDelta = current.idle - previous.idle;

  if (totalDelta <= 0) {
    return null;
  }

  return clamp((1 - idleDelta / totalDelta) * 100, 0, 100);
}

async function readMeminfo(): Promise<{ totalKB: number; availableKB: number | null } | null> {
  const raw = await readText("/proc/meminfo");
  if (!raw) {
    return null;
  }

  const totalKB = matchNumericMeminfo(raw, "MemTotal");
  const availableKB = matchNumericMeminfo(raw, "MemAvailable");

  if (totalKB === null) {
    return null;
  }

  return {
    totalKB,
    availableKB,
  };
}

function matchNumericMeminfo(raw: string, key: string): number | null {
  const regex = new RegExp(`^${key}:\\s+(\\d+)\\s+kB$`, "m");
  const match = raw.match(regex);
  if (!match?.[1]) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readAverageCpuFrequencyMHz(): Promise<number | null> {
  const cpuRoot = "/sys/devices/system/cpu";
  const entries = await listDirectoryNames(cpuRoot);
  const cpuDirs = entries.filter((entry) => /^cpu\d+$/i.test(entry));
  if (cpuDirs.length === 0) {
    return null;
  }

  const values = await Promise.all(
    cpuDirs.map(async (cpuDir) => {
      const cpufreqRoot = path.join(cpuRoot, cpuDir, "cpufreq");
      const rawKHz = await readFirstNumber(cpufreqRoot, ["scaling_cur_freq", "cpuinfo_cur_freq"]);
      if (rawKHz === null) {
        return null;
      }
      return rawKHz / 1000;
    }),
  );

  return mean(values);
}

async function readCpuTemperatureC(): Promise<number | null> {
  const thermalRoot = "/sys/class/thermal";
  const entries = await listDirectoryNames(thermalRoot);
  const zoneNames = entries.filter((entry) => /^thermal_zone\d+$/i.test(entry));

  const zoneTemps = await Promise.all(
    zoneNames.map(async (zoneName) => {
      const zoneRoot = path.join(thermalRoot, zoneName);
      const zoneType = (await readText(path.join(zoneRoot, "type")))?.toLowerCase() ?? "";
      const isCpuZone =
        zoneType.includes("cpu") || zoneType.includes("pkg") || zoneType.includes("x86") || zoneType.includes("soc");
      if (!isCpuZone) {
        return null;
      }

      return normalizeTemperature(await readNumber(path.join(zoneRoot, "temp")));
    }),
  );

  const direct = maxValue(zoneTemps);
  if (direct !== null) {
    return direct;
  }

  return readCoretempTemperatureC();
}

async function readCoretempTemperatureC(): Promise<number | null> {
  const hwmonRoot = "/sys/class/hwmon";
  const entries = await listDirectoryNames(hwmonRoot);
  const hwmons = entries.filter((entry) => /^hwmon\d+$/i.test(entry));

  const results = await Promise.all(
    hwmons.map(async (hwmon) => {
      const root = path.join(hwmonRoot, hwmon);
      const name = (await readText(path.join(root, "name")))?.toLowerCase();
      if (!name || (!name.includes("coretemp") && !name.includes("k10temp"))) {
        return null;
      }

      const values = await Promise.all(
        Array.from({ length: 10 }, async (_, index) => {
          const temp = await readNumber(path.join(root, `temp${index + 1}_input`));
          return normalizeTemperature(temp);
        }),
      );

      return maxValue(values);
    }),
  );

  return maxValue(results);
}

async function readHwmonMetric(deviceRoot: string, names: readonly string[]): Promise<number | null> {
  const hwmonRoot = path.join(deviceRoot, "hwmon");
  const hwmons = await listDirectoryNames(hwmonRoot);

  for (const hwmon of hwmons) {
    const value = await readFirstNumber(path.join(hwmonRoot, hwmon), names);
    if (value !== null) {
      return value;
    }
  }

  return readFirstNumber(deviceRoot, names);
}

async function readFirstNumber(root: string, names: readonly string[]): Promise<number | null> {
  for (const name of names) {
    const value = await readNumber(path.join(root, name));
    if (value !== null) {
      return value;
    }
  }

  return null;
}

async function readNumber(filePath: string): Promise<number | null> {
  const raw = await readText(filePath);
  return parseNumber(raw);
}

async function readText(filePath: string): Promise<string | null> {
  try {
    return (await readFile(filePath, "utf8")).trim();
  } catch {
    return null;
  }
}

async function readLinkName(filePath: string): Promise<string | null> {
  try {
    const linked = await readlink(filePath);
    return path.basename(linked);
  } catch {
    return null;
  }
}

async function listDirectoryNames(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

async function runCommand(command: string, args: readonly string[], timeoutMs: number): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, [...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let spawnErrorCode: string | null = null;

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.once("error", (error: NodeJS.ErrnoException) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      spawnErrorCode = error.code ?? null;
      resolve({
        ok: false,
        code: null,
        stdout: "",
        stderr: error.message,
        errorCode: spawnErrorCode,
        timedOut,
      });
    });

    child.once("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      resolve({
        ok: code === 0,
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        errorCode: spawnErrorCode,
        timedOut,
      });
    });
  });
}

function parseNumber(raw: string | null | undefined): number | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (/^0x[\da-f]+$/i.test(trimmed)) {
    const parsedHex = Number.parseInt(trimmed, 16);
    return Number.isFinite(parsedHex) ? parsedHex : null;
  }

  const numberMatch = trimmed.match(/-?\d+(\.\d+)?/);
  if (!numberMatch) {
    return null;
  }

  const parsed = Number.parseFloat(numberMatch[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUtilization(raw: number | null): number | null {
  if (raw === null) {
    return null;
  }

  if (raw >= 0 && raw <= 1) {
    return clamp(raw * 100, 0, 100);
  }

  if (raw > 100 && raw <= 10000) {
    return clamp(raw / 100, 0, 100);
  }

  return clamp(raw, 0, 100);
}

function normalizeTemperature(raw: number | null): number | null {
  if (raw === null) {
    return null;
  }

  if (raw >= 1000) {
    return raw / 1000;
  }

  if (raw > 200) {
    return raw / 10;
  }

  return raw;
}

function normalizePower(raw: number | null): number | null {
  if (raw === null) {
    return null;
  }

  if (raw >= 1_000_000) {
    return raw / 1_000_000;
  }

  if (raw >= 1_000) {
    return raw / 1_000;
  }

  return raw;
}

function normalizeMemory(raw: number | null): number | null {
  if (raw === null) {
    return null;
  }

  if (raw >= 1024 * 1024) {
    return raw / (1024 * 1024);
  }

  if (raw >= 1024) {
    return raw / 1024;
  }

  return raw;
}

function normalizeFrequency(raw: number | null): number | null {
  if (raw === null) {
    return null;
  }

  if (raw >= 1_000_000) {
    return raw / 1_000_000;
  }

  if (raw >= 10_000) {
    return raw / 1_000;
  }

  return raw;
}

function mean(values: readonly (number | null)[]): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
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

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function asErrorMessage(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return String(cause);
}

function emptyNpuSnapshot(message: string): NpuSnapshot {
  return {
    source: "npu:error",
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
    message,
  };
}

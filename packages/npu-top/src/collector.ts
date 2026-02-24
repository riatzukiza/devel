import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ACCEL_ROOT = "/sys/class/accel";

const DIRECT_UTILIZATION_FILES = [
  "npu_utilization",
  "npu_busy_percent",
  "utilization",
  "npu_usage",
];

const MEMORY_USED_FILES = [
  "npu_memory_utilization",
  "npu_memory_used",
  "memory_used",
  "mem_used",
];

const MEMORY_TOTAL_FILES = [
  "npu_memory_total",
  "memory_total",
  "mem_total",
  "total_memory",
];

const CURRENT_FREQUENCY_FILES = [
  "npu_current_frequency_mhz",
  "current_frequency_mhz",
  "npu_frequency_mhz",
  "frequency_mhz",
  "clock_mhz",
];

const MAX_FREQUENCY_FILES = [
  "npu_max_frequency_mhz",
  "max_frequency_mhz",
  "npu_frequency_max_mhz",
  "frequency_max_mhz",
  "max_clock_mhz",
];

const TEMPERATURE_FILES = [
  "temp1_input",
  "temp_input",
  "temperature",
  "device_temperature",
];

const POWER_FILES = [
  "power1_average",
  "power1_input",
  "power_input",
  "device_power",
];

const BURST_UTILIZATION_THRESHOLD = 2;
const BURST_PROBE_ATTEMPTS = 4;
const BURST_PROBE_INTERVAL_MS = 55;
const TELEMETRY_CACHE_TTL_MS = 15_000;

type BusySample = {
  busyUs: number;
  capturedAtMs: number;
};

type MetricSample = {
  value: number;
  capturedAtMs: number;
};

type TelemetryCacheEntry = {
  temperatureC?: MetricSample;
  powerW?: MetricSample;
};

export type NpuDeviceStats = {
  id: string;
  name: string;
  driver: string | null;
  vendorId: string | null;
  productId: string | null;
  pciSlot: string | null;
  status: string | null;
  utilizationPct: number | null;
  temperatureC: number | null;
  powerW: number | null;
  memoryUsedMB: number | null;
  memoryTotalMB: number | null;
  frequencyMHz: number | null;
  maxFrequencyMHz: number | null;
};

export type NpuSummaryStats = {
  utilizationPct: number | null;
  temperatureC: number | null;
  powerW: number | null;
  memoryUsedMB: number | null;
  memoryTotalMB: number | null;
  frequencyMHz: number | null;
  maxFrequencyMHz: number | null;
};

export type NpuSnapshot = {
  source: string;
  capturedAt: number;
  devices: NpuDeviceStats[];
  summary: NpuSummaryStats;
  message: string | null;
};

export type NpuCollector = () => Promise<NpuSnapshot>;

export function createNpuCollector(): NpuCollector {
  const busySamples = new Map<string, BusySample>();
  const telemetryCache = new Map<string, TelemetryCacheEntry>();

  return async () => {
    const capturedAt = Date.now();
    const deviceIds = await listAccelDeviceIds();
    const devices = (
      await Promise.all(deviceIds.map((deviceId) => readDeviceStats(deviceId, capturedAt, busySamples, telemetryCache)))
    ).filter((device): device is NpuDeviceStats => device !== null);

    if (devices.length === 0) {
      return {
        source: `sysfs:${ACCEL_ROOT}`,
        capturedAt,
        devices: [],
        summary: emptySummary(),
        message: `No NPU devices found under ${ACCEL_ROOT}.`,
      };
    }

    return {
      source: `sysfs:${ACCEL_ROOT}`,
      capturedAt,
      devices,
      summary: summarize(devices),
      message: null,
    };
  };
}

export function createDemoSnapshot(): NpuSnapshot {
  const capturedAt = Date.now();
  const t = capturedAt / 1000;
  const utilizationPct = clamp(48 + Math.sin(t * 0.85) * 28 + Math.sin(t * 0.21) * 9, 2, 98);
  const maxFrequencyMHz = 1400;
  const frequencyMHz = Math.round(maxFrequencyMHz * (0.3 + utilizationPct / 130));
  const memoryTotalMB = 8192;
  const memoryUsedMB = Math.round(memoryTotalMB * (0.18 + utilizationPct / 160));
  const temperatureC = Math.round((40 + utilizationPct * 0.39) * 10) / 10;
  const powerW = Math.round((2.4 + utilizationPct * 0.12) * 10) / 10;

  return {
    source: "demo",
    capturedAt,
    devices: [
      {
        id: "accel0",
        name: "Demo NPU",
        driver: "intel_vpu",
        vendorId: "0x8086",
        productId: "0x7d1d",
        pciSlot: "0000:00:0b.0",
        status: "active",
        utilizationPct,
        temperatureC,
        powerW,
        memoryUsedMB,
        memoryTotalMB,
        frequencyMHz,
        maxFrequencyMHz,
      },
    ],
    summary: {
      utilizationPct,
      temperatureC,
      powerW,
      memoryUsedMB,
      memoryTotalMB,
      frequencyMHz,
      maxFrequencyMHz,
    },
    message: "Demo mode is enabled; displaying generated telemetry.",
  };
}

async function readDeviceStats(
  deviceId: string,
  capturedAt: number,
  busySamples: Map<string, BusySample>,
  telemetryCache: Map<string, TelemetryCacheEntry>,
): Promise<NpuDeviceStats | null> {
  const accelRoot = path.join(ACCEL_ROOT, deviceId);
  const deviceRoot = path.join(accelRoot, "device");

  const [
    label,
    vendorId,
    productId,
    status,
    uevent,
    busyTimeUs,
    directUtilization,
    memoryUsedRaw,
    memoryTotalRaw,
    frequencyRaw,
    maxFrequencyRaw,
    temperatureRaw,
    powerRaw,
  ] = await Promise.all([
    readText(path.join(deviceRoot, "label")),
    readText(path.join(deviceRoot, "vendor")),
    readText(path.join(deviceRoot, "device")),
    readText(path.join(deviceRoot, "power", "runtime_status")),
    readText(path.join(deviceRoot, "uevent")),
    readNumber(path.join(deviceRoot, "npu_busy_time_us")),
    readFirstNumber(deviceRoot, DIRECT_UTILIZATION_FILES),
    readFirstNumber(deviceRoot, MEMORY_USED_FILES),
    readFirstNumber(deviceRoot, MEMORY_TOTAL_FILES),
    readFirstNumber(deviceRoot, CURRENT_FREQUENCY_FILES),
    readFirstNumber(deviceRoot, MAX_FREQUENCY_FILES),
    readHwmonMetric(deviceRoot, TEMPERATURE_FILES),
    readHwmonMetric(deviceRoot, POWER_FILES),
  ]);

  const metadata = parseUevent(uevent);
  const driver = metadata.DRIVER ?? null;
  const pciSlot = metadata.PCI_SLOT_NAME ?? null;

  const utilizationFromCounter = busyTimeToUtilization(deviceId, busyTimeUs, capturedAt, busySamples);
  const utilizationPct = normalizeUtilization(directUtilization ?? utilizationFromCounter);

  let temperatureC = normalizeTemperature(temperatureRaw);
  let powerW = normalizePower(powerRaw);

  const shouldBurstProbe = utilizationPct !== null && utilizationPct >= BURST_UTILIZATION_THRESHOLD;
  if (shouldBurstProbe && (temperatureC === null || powerW === null)) {
    const burstTelemetry = await probeThermalAndPower(deviceRoot, temperatureC === null, powerW === null);
    if (temperatureC === null) {
      temperatureC = normalizeTemperature(burstTelemetry.temperatureRaw);
    }
    if (powerW === null) {
      powerW = normalizePower(burstTelemetry.powerRaw);
    }
  }

  const cached = telemetryCache.get(deviceId) ?? {};
  if (temperatureC !== null) {
    cached.temperatureC = {
      value: temperatureC,
      capturedAtMs: capturedAt,
    };
  }
  if (powerW !== null) {
    cached.powerW = {
      value: powerW,
      capturedAtMs: capturedAt,
    };
  }

  if (temperatureC === null && cached.temperatureC && capturedAt - cached.temperatureC.capturedAtMs <= TELEMETRY_CACHE_TTL_MS) {
    temperatureC = cached.temperatureC.value;
  }
  if (powerW === null && cached.powerW && capturedAt - cached.powerW.capturedAtMs <= TELEMETRY_CACHE_TTL_MS) {
    powerW = cached.powerW.value;
  }

  telemetryCache.set(deviceId, cached);

  const titleParts = [label, driver].filter((value): value is string => typeof value === "string" && value.length > 0);
  const name = titleParts.length > 0 ? titleParts.join(" - ") : deviceId;

  return {
    id: deviceId,
    name,
    driver,
    vendorId,
    productId,
    pciSlot,
    status,
    utilizationPct,
    temperatureC,
    powerW,
    memoryUsedMB: normalizeMemory(memoryUsedRaw),
    memoryTotalMB: normalizeMemory(memoryTotalRaw),
    frequencyMHz: normalizeFrequency(frequencyRaw),
    maxFrequencyMHz: normalizeFrequency(maxFrequencyRaw),
  };
}

async function probeThermalAndPower(
  deviceRoot: string,
  needTemperature: boolean,
  needPower: boolean,
): Promise<{ temperatureRaw: number | null; powerRaw: number | null }> {
  let latestTemperature: number | null = null;
  let latestPower: number | null = null;

  for (let attempt = 0; attempt < BURST_PROBE_ATTEMPTS; attempt += 1) {
    const [temperatureRaw, powerRaw] = await Promise.all([
      needTemperature ? readHwmonMetric(deviceRoot, TEMPERATURE_FILES) : Promise.resolve<number | null>(null),
      needPower ? readHwmonMetric(deviceRoot, POWER_FILES) : Promise.resolve<number | null>(null),
    ]);

    if (temperatureRaw !== null) {
      latestTemperature = temperatureRaw;
    }
    if (powerRaw !== null) {
      latestPower = powerRaw;
    }

    const gotTemperature = !needTemperature || latestTemperature !== null;
    const gotPower = !needPower || latestPower !== null;

    if (gotTemperature && gotPower) {
      return { temperatureRaw: latestTemperature, powerRaw: latestPower };
    }

    if (attempt < BURST_PROBE_ATTEMPTS - 1) {
      await sleep(BURST_PROBE_INTERVAL_MS);
    }
  }

  return { temperatureRaw: latestTemperature, powerRaw: latestPower };
}

async function listAccelDeviceIds(): Promise<string[]> {
  try {
    const entries = await readdir(ACCEL_ROOT, { withFileTypes: true });
    return entries
      .filter((entry) => (entry.isDirectory() || entry.isSymbolicLink()) && /^accel\d+$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

function parseUevent(text: string | null): Record<string, string> {
  if (!text) {
    return {};
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.includes("="))
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split("=");
      const value = rest.join("=");
      if (key.length > 0 && value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {});
}

function busyTimeToUtilization(
  deviceId: string,
  busyTimeUs: number | null,
  capturedAt: number,
  busySamples: Map<string, BusySample>,
): number | null {
  if (busyTimeUs === null) {
    return null;
  }

  const previous = busySamples.get(deviceId);
  busySamples.set(deviceId, { busyUs: busyTimeUs, capturedAtMs: capturedAt });

  if (!previous) {
    return 0;
  }

  const busyDelta = busyTimeUs - previous.busyUs;
  const elapsedUs = (capturedAt - previous.capturedAtMs) * 1000;
  if (busyDelta < 0 || elapsedUs <= 0) {
    return null;
  }

  return clamp((busyDelta / elapsedUs) * 100, 0, 100);
}

async function readHwmonMetric(deviceRoot: string, names: readonly string[]): Promise<number | null> {
  const hwmonRoot = path.join(deviceRoot, "hwmon");
  const hwmonDirs = await listDirectoryNames(hwmonRoot);

  for (const hwmonDir of hwmonDirs) {
    const value = await readFirstNumber(path.join(hwmonRoot, hwmonDir), names);
    if (value !== null) {
      return value;
    }
  }

  return readFirstNumber(deviceRoot, names);
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

function parseNumber(raw: string | null): number | null {
  if (!raw || raw.length === 0) {
    return null;
  }

  if (/^0x[\da-f]+$/i.test(raw)) {
    const parsedHex = Number.parseInt(raw, 16);
    return Number.isFinite(parsedHex) ? parsedHex : null;
  }

  const match = raw.match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);
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

function summarize(devices: readonly NpuDeviceStats[]): NpuSummaryStats {
  return {
    utilizationPct: mean(devices.map((device) => device.utilizationPct)),
    temperatureC: maxValue(devices.map((device) => device.temperatureC)),
    powerW: sum(devices.map((device) => device.powerW)),
    memoryUsedMB: sum(devices.map((device) => device.memoryUsedMB)),
    memoryTotalMB: sum(devices.map((device) => device.memoryTotalMB)),
    frequencyMHz: mean(devices.map((device) => device.frequencyMHz)),
    maxFrequencyMHz: maxValue(devices.map((device) => device.maxFrequencyMHz)),
  };
}

function emptySummary(): NpuSummaryStats {
  return {
    utilizationPct: null,
    temperatureC: null,
    powerW: null,
    memoryUsedMB: null,
    memoryTotalMB: null,
    frequencyMHz: null,
    maxFrequencyMHz: null,
  };
}

function mean(values: readonly (number | null)[]): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }

  const total = filtered.reduce((acc, value) => acc + value, 0);
  return total / filtered.length;
}

function sum(values: readonly (number | null)[]): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((acc, value) => acc + value, 0);
}

function maxValue(values: readonly (number | null)[]): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((acc, value) => (value > acc ? value : acc), filtered[0]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

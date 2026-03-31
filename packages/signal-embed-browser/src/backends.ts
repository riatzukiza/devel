import * as ort from "onnxruntime-web";

export type DevicePreference = "webnn-npu" | "webnn-gpu" | "webgpu" | "wasm" | "auto";

export interface RuntimeDiagnostics {
  available_backends: string[];
  active_backend: string;
  webnn_supported: boolean;
  webgpu_supported: boolean;
  wasm_supported: boolean;
  device_preference: DevicePreference;
}

export async function resolveAvailableBackends(): Promise<RuntimeDiagnostics> {
  const available: string[] = [];
  let webnn = false;
  let webgpu = false;

  if (typeof navigator !== "undefined" && "ml" in navigator) {
    webnn = true;
    available.push("webnn-npu", "webnn-gpu");
  }

  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        webgpu = true;
        available.push("webgpu");
      }
    } catch {
      // WebGPU not available
    }
  }

  available.push("wasm");

  return {
    available_backends: available,
    active_backend: "pending",
    webnn_supported: webnn,
    webgpu_supported: webgpu,
    wasm_supported: true,
    device_preference: "auto",
  };
}

export function resolveExecutionProviders(preference: DevicePreference): string[] {
  switch (preference) {
    case "webnn-npu":
      return ["webnn"];
    case "webnn-gpu":
      return ["webnn"];
    case "webgpu":
      return ["webgpu"];
    case "wasm":
      return ["wasm"];
    case "auto":
    default:
      return ["webnn", "webgpu", "wasm"];
  }
}

export function resolveWebNNOptions(preference: DevicePreference): Record<string, unknown> | undefined {
  if (preference === "webnn-npu") {
    return { deviceType: "npu" };
  }
  if (preference === "webnn-gpu") {
    return { deviceType: "gpu" };
  }
  return undefined;
}

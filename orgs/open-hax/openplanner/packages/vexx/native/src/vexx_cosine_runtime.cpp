#include <algorithm>
#include <cstring>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include "onnxruntime_cxx_api.h"

namespace {

struct VexxCosineRuntime {
  std::unique_ptr<Ort::Session> session;
  std::string device{"CPU"};
  std::string provider{""};
  std::string model_path;
  std::string input_left{"left"};
  std::string input_right{"right"};
  std::string output{"scores"};
  std::string last_error;
  bool ready{false};
};

Ort::Env& shared_env() {
  static Ort::Env env{ORT_LOGGING_LEVEL_WARNING, "vexx"};
  return env;
}

std::string normalize_device(const char* raw) {
  if (raw == nullptr) {
    return "CPU";
  }
  std::string value(raw);
  std::transform(value.begin(), value.end(), value.begin(), [](unsigned char ch) {
    return static_cast<char>(std::toupper(ch));
  });
  if (value == "GPU" || value == "NPU" || value == "CPU") {
    return value;
  }
  return "CPU";
}

bool provider_exists(const std::vector<std::string>& providers, const std::string& name) {
  return std::find(providers.begin(), providers.end(), name) != providers.end();
}

void set_input_output_names(VexxCosineRuntime* runtime) {
  Ort::AllocatorWithDefaultOptions allocator;
  const size_t input_count = runtime->session->GetInputCount();
  const size_t output_count = runtime->session->GetOutputCount();
  if (input_count >= 1) {
    auto left_name = runtime->session->GetInputNameAllocated(0, allocator);
    runtime->input_left = left_name.get();
  }
  if (input_count >= 2) {
    auto right_name = runtime->session->GetInputNameAllocated(1, allocator);
    runtime->input_right = right_name.get();
  }
  if (output_count >= 1) {
    auto output_name = runtime->session->GetOutputNameAllocated(0, allocator);
    runtime->output = output_name.get();
  }
}

void configure_provider(Ort::SessionOptions& options,
                        VexxCosineRuntime* runtime,
                        const std::vector<std::string>& providers,
                        int32_t cuda_device_id) {
  if (runtime->device == "GPU") {
    if (!provider_exists(providers, "CUDAExecutionProvider")) {
      runtime->last_error = "CUDAExecutionProvider unavailable";
      return;
    }
    OrtCUDAProviderOptions cuda_opts{};
    cuda_opts.device_id = cuda_device_id;
    options.AppendExecutionProvider_CUDA(cuda_opts);
    runtime->provider = "CUDAExecutionProvider";
    return;
  }

  if (runtime->device == "NPU") {
    if (!provider_exists(providers, "OpenVINOExecutionProvider")) {
      runtime->last_error = "OpenVINOExecutionProvider unavailable";
      return;
    }
    std::unordered_map<std::string, std::string> ov_opts;
    ov_opts["device_type"] = "NPU";
    ov_opts["disable_dynamic_shapes"] = "True";
    ov_opts["enable_qdq_optimizer"] = "True";
    options.AppendExecutionProvider_OpenVINO_V2(ov_opts);
    runtime->provider = "OpenVINOExecutionProvider";
    return;
  }

  runtime->provider = "CPUExecutionProvider";
}

}  // namespace

extern "C" {

void* vexx_runtime_create(const char* model_path, const char* device, int32_t cuda_device_id) {
  auto* runtime = new VexxCosineRuntime();
  runtime->device = normalize_device(device);
  runtime->model_path = model_path == nullptr ? "" : std::string(model_path);

  if (runtime->model_path.empty()) {
    runtime->last_error = "cosine_model_missing";
    return runtime;
  }

  try {
    (void)shared_env();
    auto providers = Ort::GetAvailableProviders();
    Ort::SessionOptions options;
    options.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
    configure_provider(options, runtime, providers, cuda_device_id);
    if (!runtime->last_error.empty()) {
      return runtime;
    }

    runtime->session = std::make_unique<Ort::Session>(shared_env(), runtime->model_path.c_str(), options);
    set_input_output_names(runtime);
    runtime->ready = true;
    return runtime;
  } catch (const std::exception& ex) {
    runtime->last_error = ex.what();
    runtime->ready = false;
    return runtime;
  }
}

int32_t vexx_runtime_ready(void* handle) {
  auto* runtime = static_cast<VexxCosineRuntime*>(handle);
  if (runtime == nullptr) {
    return 0;
  }
  return runtime->ready ? 1 : 0;
}

void vexx_runtime_destroy(void* handle) {
  auto* runtime = static_cast<VexxCosineRuntime*>(handle);
  delete runtime;
}

const char* vexx_runtime_last_error(void* handle) {
  auto* runtime = static_cast<VexxCosineRuntime*>(handle);
  if (runtime == nullptr) {
    return "runtime_missing";
  }
  return runtime->last_error.c_str();
}

const char* vexx_runtime_device(void* handle) {
  auto* runtime = static_cast<VexxCosineRuntime*>(handle);
  if (runtime == nullptr) {
    return "";
  }
  return runtime->device.c_str();
}

const char* vexx_runtime_provider(void* handle) {
  auto* runtime = static_cast<VexxCosineRuntime*>(handle);
  if (runtime == nullptr) {
    return "";
  }
  return runtime->provider.c_str();
}

const char* vexx_runtime_model_path(void* handle) {
  auto* runtime = static_cast<VexxCosineRuntime*>(handle);
  if (runtime == nullptr) {
    return "";
  }
  return runtime->model_path.c_str();
}

int32_t vexx_runtime_compute(void* handle,
                             float* left,
                             int32_t left_rows,
                             float* right,
                             int32_t right_rows,
                             int32_t dim,
                             float* out_scores) {
  auto* runtime = static_cast<VexxCosineRuntime*>(handle);
  if (runtime == nullptr || !runtime->ready || runtime->session == nullptr) {
    return 0;
  }
  if (left == nullptr || right == nullptr || out_scores == nullptr || left_rows <= 0 || right_rows <= 0 || dim <= 0) {
    runtime->last_error = "invalid_compute_payload";
    return 0;
  }

  try {
    Ort::MemoryInfo memory_info = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
    const std::array<int64_t, 2> left_shape{left_rows, dim};
    const std::array<int64_t, 2> right_shape{right_rows, dim};

    std::array<Ort::Value, 2> input_tensors = {
        Ort::Value::CreateTensor<float>(memory_info, left, static_cast<size_t>(left_rows) * static_cast<size_t>(dim), left_shape.data(), left_shape.size()),
        Ort::Value::CreateTensor<float>(memory_info, right, static_cast<size_t>(right_rows) * static_cast<size_t>(dim), right_shape.data(), right_shape.size())};

    const std::array<const char*, 2> input_names{runtime->input_left.c_str(), runtime->input_right.c_str()};
    const std::array<const char*, 1> output_names{runtime->output.c_str()};

    auto outputs = runtime->session->Run(Ort::RunOptions{nullptr},
                                         input_names.data(),
                                         input_tensors.data(),
                                         input_tensors.size(),
                                         output_names.data(),
                                         output_names.size());

    if (outputs.empty() || !outputs.front().IsTensor()) {
      runtime->last_error = "cosine_output_missing";
      return 0;
    }

    float* values = outputs.front().GetTensorMutableData<float>();
    const size_t out_count = static_cast<size_t>(left_rows) * static_cast<size_t>(right_rows);
    std::memcpy(out_scores, values, out_count * sizeof(float));
    runtime->last_error.clear();
    return 1;
  } catch (const std::exception& ex) {
    runtime->last_error = ex.what();
    return 0;
  }
}

}  // extern "C"

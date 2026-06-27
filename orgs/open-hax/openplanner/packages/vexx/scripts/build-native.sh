#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/native/lib"
SRC_FILE="$ROOT_DIR/native/src/vexx_cosine_runtime.cpp"
INCLUDE_DIR="$ROOT_DIR/vendor/onnxruntime/include"
LIB_DIR="$ROOT_DIR/vendor/onnxruntime-openvino/capi"
OUT_FILE="$OUT_DIR/libvexx_cosine.so"

mkdir -p "$OUT_DIR"

g++ -std=c++17 -O3 -fPIC -shared \
  -I "$INCLUDE_DIR" \
  "$SRC_FILE" \
  -L "$LIB_DIR" \
  -l:libonnxruntime.so.1.22.0 \
  -Wl,-rpath,'$ORIGIN/../../vendor/onnxruntime-openvino/capi' \
  -o "$OUT_FILE"

echo "Built $OUT_FILE"

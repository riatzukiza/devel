#!/usr/bin/env sh
set -eu

args="--host 0.0.0.0 --port ${LLAMACPP_SERVER_PORT:-8080} \
  --n-gpu-layers ${LLAMACPP_N_GPU_LAYERS:-999} \
  --ctx-size ${LLAMACPP_CHAT_CTX_SIZE:-4096} \
  --parallel ${LLAMACPP_PARALLEL:-2} \
  --model /models/${LLAMACPP_CHAT_MODEL:-google_gemma-4-E4B-it-Q4_K_M.gguf} \
  --alias ${LLAMACPP_CHAT_ALIAS:-gemma4-e4b}"

if [ -n "${LLAMACPP_CHAT_MMPROJ:-}" ]; then
  args="$args --mmproj /models/${LLAMACPP_CHAT_MMPROJ}"
  if [ "${LLAMACPP_CHAT_MMPROJ_OFFLOAD:-true}" = "false" ]; then
    args="$args --no-mmproj-offload"
  fi
fi

if [ -n "${LLAMACPP_CHAT_BATCH_SIZE:-}" ]; then
  args="$args --batch-size ${LLAMACPP_CHAT_BATCH_SIZE}"
fi

if [ -n "${LLAMACPP_CHAT_UBATCH_SIZE:-}" ]; then
  args="$args --ubatch-size ${LLAMACPP_CHAT_UBATCH_SIZE}"
fi

if [ "${LLAMACPP_FLASH_ATTN:-false}" = "true" ]; then
  args="$args --flash-attn on"
fi

if [ -n "${LLAMACPP_CACHE_RAM:-}" ]; then
  args="$args --cache-ram ${LLAMACPP_CACHE_RAM}"
fi

# shellcheck disable=SC2086
exec /app/llama-server $args

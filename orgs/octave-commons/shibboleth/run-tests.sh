#!/bin/bash
# Run shibboleth tests with proper environment

set -e

# NVIDIA CUDA libraries for PyTorch (fixes libcusparseLt.so.0 not found)
NVIDIA_LIBS=$(find /home/err/.pyenv/versions/3.12.1/lib/python3.12/site-packages/nvidia -name "lib" -type d 2>/dev/null | tr '\n' ':')

export LD_LIBRARY_PATH="${NVIDIA_LIBS}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PROXY_AUTH_TOKEN="${PROXY_AUTH_TOKEN:-change-me-open-hax-proxy-token}"

cd "$(dirname "$0")"

exec clojure -M:test -e "(require '[cognitect.test-runner :as tr]) (tr/-main)" "$@"
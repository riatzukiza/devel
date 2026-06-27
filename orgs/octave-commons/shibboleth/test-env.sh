#!/bin/bash
# Set up environment for running tests

# NVIDIA CUDA libraries for PyTorch
NVIDIA_LIBS=$(find /home/err/.pyenv/versions/3.12.1/lib/python3.12/site-packages/nvidia -name "lib" -type d 2>/dev/null | tr '\n' ':')

export LD_LIBRARY_PATH="${NVIDIA_LIBS}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PROXY_AUTH_TOKEN="change-me-open-hax-proxy-token"

# Run the command passed as arguments
"$@"

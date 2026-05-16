#!/bin/bash
set -e

export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$PATH"

# Start Xvfb if not running
if ! pgrep -x "Xvfb" > /dev/null; then
    Xvfb :99 -screen 0 1280x720x24 +extension GLX +render -noreset &
    sleep 2
fi

export DISPLAY=:99

cd /tmp
./OpenUtau "$@"

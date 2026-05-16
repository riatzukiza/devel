#!/bin/bash
set -e

export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$PATH"

USTX_FILE="$1"
OUTPUT_WAV="${2:-output.wav}"

if [ -z "$USTX_FILE" ]; then
    echo "Usage: $0 <input.ustx> [output.wav]"
    exit 1
fi

# === CLEANUP: Ensure no stale OpenUTAU or Xvfb processes ===
echo "Cleaning up stale processes..."
killall -9 OpenUtau 2>/dev/null || true
sleep 1
# Kill any Xvfb on display :99
XVFB_PIDS=$(ps aux | grep "Xvfb :99" | grep -v grep | awk '{print $2}' || true)
if [ -n "$XVFB_PIDS" ]; then
    echo "Killing stale Xvfb processes: $XVFB_PIDS"
    echo "$XVFB_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi
rm -f /tmp/.X99-lock
rm -f /tmp/.X11-unix/X99

# Clear OpenUTAU recent files to prevent stale project loading issues
PREFS_FILE="$HOME/.local/share/OpenUtau/prefs.json"
if [ -f "$PREFS_FILE" ]; then
    # Use python to safely modify JSON (jq might not be available)
    python3 -c "
import json
with open('$PREFS_FILE', 'r', encoding='utf-8-sig') as f:
    prefs = json.load(f)
prefs['RecentFiles'] = []
with open('$PREFS_FILE', 'w', encoding='utf-8') as f:
    json.dump(prefs, f, indent=2, ensure_ascii=False)
" 2>/dev/null || echo "Warning: Could not clear recent files in prefs.json"
fi

echo "Cleanup complete."

# Clear OpenUTAU recent files to prevent it loading a stale project instead of our file
PREFS_FILE="$HOME/.local/share/OpenUtau/prefs.json"
if [ -f "$PREFS_FILE" ]; then
    python3 -c "
import json
with open('$PREFS_FILE', 'r', encoding='utf-8-sig') as f:
    prefs = json.load(f)
prefs['RecentFiles'] = []
with open('$PREFS_FILE', 'w', encoding='utf-8') as f:
    json.dump(prefs, f, indent=2, ensure_ascii=False)
" 2>/dev/null || true
    echo "Cleared OpenUTAU recent files."
fi

# Get today's log file
TODAY=$(date +%Y%m%d)
LOG_FILE="$HOME/.local/share/OpenUtau/Logs/log${TODAY}.txt"

# Clear old cache so we don't accidentally grab stale renders
rm -f ~/.cache/OpenUtau/*.wav

# Get initial line count of log file to track only NEW entries
INITIAL_LOG_LINES=0
if [ -f "$LOG_FILE" ]; then
    INITIAL_LOG_LINES=$(wc -l < "$LOG_FILE")
fi
echo "Initial log lines: $INITIAL_LOG_LINES"

# Start Xvfb
echo "Starting Xvfb on display :99..."
Xvfb :99 -screen 0 1280x720x24 +extension GLX +render -noreset &
XVFB_PID=$!
sleep 2

# Verify Xvfb started
if ! kill -0 $XVFB_PID 2>/dev/null; then
    echo "Error: Xvfb failed to start"
    exit 1
fi

export DISPLAY=:99

# Start OpenUTAU with the project and ask it to write a real mixdown export.
OPENUTAU_BIN="${OPENUTAU_BIN:-/home/err/devel/orgs/stakira/OpenUtau/.opencode/openutau-patched/OpenUtau}"
echo "Starting OpenUTAU export with: $USTX_FILE -> $OUTPUT_WAV"
"$OPENUTAU_BIN" --export-mixdown "$USTX_FILE" "$OUTPUT_WAV" &
OP_PID=$!

# Wait for export to complete
# OpenUTAU takes 3-5 minutes on cold start to render
# We look for the process to exit and then validate the requested output file.
echo "Waiting for export (timeout: 10 minutes)..."
for i in {1..600}; do
    if ! kill -0 $OP_PID 2>/dev/null; then
        set +e
        wait $OP_PID
        OP_STATUS=$?
        set -e
        break
    fi
    sleep 1
done

if kill -0 $OP_PID 2>/dev/null; then
    echo "Error: Timed out waiting for OpenUTAU export"
    kill $OP_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    exit 1
fi

if [ "${OP_STATUS:-1}" -eq 0 ] && [ -s "$OUTPUT_WAV" ]; then
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUTPUT_WAV" 2>/dev/null || true)
    if [ -z "$DURATION" ] || [ "$DURATION" = "N/A" ]; then
        echo "Error: OpenUTAU export produced no measurable audio duration"
        kill $XVFB_PID 2>/dev/null || true
        exit 1
    fi
    echo "Success! Exported: $OUTPUT_WAV"
    ls -lh "$OUTPUT_WAV"
    file "$OUTPUT_WAV"
else
    echo "Error: OpenUTAU export failed or did not create output WAV"
    echo "Exit status: ${OP_STATUS:-unknown}"
    echo "Log file: $LOG_FILE"
    if [ -f "$LOG_FILE" ]; then
        echo "Last 50 lines of log:"
        tail -50 "$LOG_FILE"
    fi
    # Cleanup before exit
    kill $OP_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    exit 1
fi

# Cleanup
kill $OP_PID 2>/dev/null || true
kill $XVFB_PID 2>/dev/null || true

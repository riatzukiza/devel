#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}"
RESULTS_DIR="${SCRIPT_DIR}/masscan-results"
IMPORT_DIR="${SCRIPT_DIR}/imports"

mkdir -p "${RESULTS_DIR}"

show_usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] [TARGET_RANGE]

Masscan wrapper for our-gpus Ollama discovery.
Requires root/sudo for raw socket access.

OPTIONS:
    -p, --port PORT      Target port (default: 11434)
    -r, --rate RATE      Packets per second (default: 100000)
    -o, --output FILE    Output JSON file (default: scan-results.json)
    -h, --help           Show this help

EXAMPLES:
    # Scan entire internet for Ollama (requires sudo)
    sudo $(basename "$0") 0.0.0.0/0

    # Scan specific range at lower rate
    sudo $(basename "$0") --rate 50000 192.168.0.0/16

    # Custom port
    sudo $(basename "$0") --port 8000 10.0.0.0/8

ENVIRONMENT:
    Requires: masscan
    Output:   ${RESULTS_DIR}/scan-results.json
    Import:   Drop JSON results to ${IMPORT_DIR}/ for ingest
EOF
}

PORT="11434"
RATE="100000"
OUTPUT="${RESULTS_DIR}/scan-results.json"
TARGET=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -r|--rate)
            RATE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            TARGET="$1"
            shift
            ;;
    esac
done

if [[ -z "${TARGET}" ]]; then
    echo "Error: TARGET_RANGE required"
    show_usage
    exit 1
fi

if [[ $EUID -ne 0 ]]; then
    echo "Error: This script must be run as root (sudo)"
    exit 1
fi

if ! command -v masscan &> /dev/null; then
    echo "Error: masscan not found"
    echo "Install: sudo apt install masscan or build from source"
    exit 1
fi

echo "=== our-gpus masscan scan ==="
echo "Target:  ${TARGET}"
echo "Port:    ${PORT}"
echo "Rate:    ${RATE} pps"
echo "Output:  ${OUTPUT}"
echo "Exclude: ${CONFIG_DIR}/excludes.conf"
echo ""

masscan "${TARGET}" \
    -p "${PORT}" \
    --rate "${RATE}" \
    --exclude-file "${CONFIG_DIR}/excludes.conf" \
    -oJ "${OUTPUT}" \
    --wait 15 \
    --retries 3

echo ""
echo "Scan complete: ${OUTPUT}"
echo ""
echo "To ingest into our-gpus:"
echo "  1. Copy to imports/: cp ${OUTPUT} ${IMPORT_DIR}/"
echo "  2. Run ingest via:"
echo "     docker compose exec api python /workspace/source/cli/ingest_json.py \\"
echo "       /workspace/imports/$(basename "${OUTPUT}") --auto-detect"
echo ""
echo "Or convert to ip:port format for manual inspection:"
echo "  jq -r '.ip + \":\" + (.ports[].port | tostring)' ${OUTPUT} > results.txt"

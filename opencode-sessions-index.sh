#!/bin/bash
# opencode-sessions-index.sh
# Shell script for indexing OpenCode sessions with ChromaDB
# This can be run manually or via cron

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/home/err/devel/logs"
LOG_FILE="${LOG_DIR}/opencode-indexer.log"
ERROR_LOG="${LOG_DIR}/opencode-indexer-error.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Starting OpenCode session indexing..."

# Change to project directory
cd /home/err/devel || exit 1

# Run the indexer with error handling
if pnpm -C packages/reconstituter opencode-sessions index >> "$LOG_FILE" 2>> "$ERROR_LOG"; then
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Indexing completed successfully"
    else
        echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Indexing failed with exit code: $EXIT_CODE"
    fi

    exit $EXIT_CODE
else
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Failed to run indexer"
    exit 1
fi

#!/bin/bash
# Stop FutureSight KMS Stack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Stopping FutureSight KMS Stack...${NC}"
docker compose -f "$COMPOSE_FILE" down

echo ""
echo -e "${GREEN}Stack stopped.${NC}"
echo ""
echo -e "${BLUE}To remove all volumes (WARNING: deletes all data):${NC}"
echo "  docker compose -f $COMPOSE_FILE down -v"
echo ""
echo -e "${BLUE}To restart:${NC}"
echo "  ./start.sh --build --detach"
#!/bin/bash
# FutureSight KMS Stack - Quick Start Script
#
# Usage: ./start.sh [options]
#
# Options:
#   --build     Build Docker images before starting
#   --detach     Run in detached mode (background)
#   --logs       Follow logs after starting
#   --dev        Run Knoxx frontend via Vite dev server behind nginx
#   --ssl        Enable HTTPS (requires config/ssl/ certs)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
DEV_COMPOSE_FILE="$SCRIPT_DIR/docker-compose.dev.yml"
DEVEL_ROOT_DEFAULT="$(cd "$SCRIPT_DIR/../.." && pwd)"

export DEVEL_ROOT_PATH="${DEVEL_ROOT_PATH:-$DEVEL_ROOT_DEFAULT}"
export KNOXX_BACKEND_PATH="${KNOXX_BACKEND_PATH:-$DEVEL_ROOT_PATH/orgs/open-hax/knoxx/backend}"
export KMS_INGESTION_PATH="${KMS_INGESTION_PATH:-$DEVEL_ROOT_PATH/orgs/open-hax/knoxx/ingestion}"
export WORKSPACE_PATH="${WORKSPACE_PATH:-$HOME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
BUILD=""
DETACH=""
LOGS=""
DEV=""
SSL=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --build|-b)
      BUILD="--build"
      shift
      ;;
    --detach|-d)
      DETACH="-d"
      shift
      ;;
    --logs|-l)
      LOGS="1"
      shift
      ;;
    --dev)
      DEV="1"
      shift
      ;;
    --ssl)
      SSL="1"
      shift
      ;;
    -h|--help)
      echo "FutureSight KMS Stack - Quick Start"
      echo ""
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --build, -b    Build Docker images before starting"
      echo "  --detach, -d   Run in detached mode (background)"
      echo "  --logs, -l     Follow logs after starting"
      echo "  --dev          Run Knoxx frontend + backend in live-reload dev mode behind nginx"
      echo "  --ssl          Enable HTTPS (requires config/ssl/ certs)"
      echo "  --help, -h     Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}FutureSight KMS Stack${NC}"
echo ""

# Create .env if missing
if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
  echo -e "${YELLOW}Creating .env from .env.example...${NC}"
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
fi

# Enable SSL if requested
if [[ -n "$SSL" ]]; then
  if [[ ! -f "$SCRIPT_DIR/config/ssl/fullchain.pem" || ! -f "$SCRIPT_DIR/config/ssl/privkey.pem" ]]; then
    echo -e "${RED}Error: SSL certificates not found.${NC}"
    echo "Please place certificates in:"
    echo "  $SCRIPT_DIR/config/ssl/fullchain.pem"
    echo "  $SCRIPT_DIR/config/ssl/privkey.pem"
    exit 1
  fi
  
  # Enable SSL config
  if [[ -f "$SCRIPT_DIR/config/conf.d/ssl.conf.example" ]]; then
    mv "$SCRIPT_DIR/config/conf.d/ssl.conf.example" "$SCRIPT_DIR/config/conf.d/ssl.conf"
  fi
  
  echo -e "${GREEN}SSL enabled.${NC}"
fi

# Development mode - use the Knoxx Vite dev server through nginx
if [[ -n "$DEV" ]]; then
  echo -e "${YELLOW}Development mode: enabling Knoxx Vite dev server behind nginx...${NC}"
  export COMPOSE_PROFILES="${COMPOSE_PROFILES:+$COMPOSE_PROFILES,}dev"
  export KNOXX_FRONTEND_UPSTREAM_HOST="${KNOXX_FRONTEND_UPSTREAM_HOST:-knoxx-frontend-dev}"
  export KNOXX_FRONTEND_UPSTREAM_PORT="${KNOXX_FRONTEND_UPSTREAM_PORT:-5173}"
  export KNOXX_BACKEND_DOCKERFILE="${KNOXX_BACKEND_DOCKERFILE:-Dockerfile.dev}"
  export KNOXX_BACKEND_WORKDIR="${KNOXX_BACKEND_WORKDIR:-/app/workspace/devel/orgs/open-hax/knoxx/backend}"
  export KNOXX_BACKEND_COMMAND="${KNOXX_BACKEND_COMMAND:-./scripts/dev-watch.sh}"
  export KNOXX_BACKEND_NODE_ENV="${KNOXX_BACKEND_NODE_ENV:-development}"
  export KNOXX_BACKEND_HEALTH_START_PERIOD="${KNOXX_BACKEND_HEALTH_START_PERIOD:-300s}"
  echo -e "${GREEN}Frontend dev server will be available at:${NC}"
  echo "  - Direct:  http://localhost:5173"
  echo "  - Via nginx: http://localhost/"
  echo -e "${GREEN}Backend dev mode:${NC}"
  echo "  - shadow-cljs release rebuilds when backend sources change"
  echo "  - the Knoxx backend process restarts automatically after each successful rebuild"
else
  export KNOXX_FRONTEND_UPSTREAM_HOST="${KNOXX_FRONTEND_UPSTREAM_HOST:-knoxx-frontend}"
  export KNOXX_FRONTEND_UPSTREAM_PORT="${KNOXX_FRONTEND_UPSTREAM_PORT:-80}"
fi

# Build command
COMPOSE_CMD="docker compose --env-file $SCRIPT_DIR/.env -f $COMPOSE_FILE"
if [[ -n "$DEV" && -f "$DEV_COMPOSE_FILE" ]]; then
  COMPOSE_CMD="$COMPOSE_CMD -f $DEV_COMPOSE_FILE"
fi

# Start services
echo -e "${BLUE}Starting services...${NC}"
$COMPOSE_CMD up $BUILD $DETACH

# Wait for services to be healthy
if [[ -n "$DETACH" ]]; then
  echo ""
  echo -e "${BLUE}Waiting for services to become healthy...${NC}"
  sleep 5
  
  # Check health
  HEALTH_CHECK_URL="http://localhost/health"
  MAX_RETRIES=30
  RETRY_COUNT=0
  
  while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
    if curl -sf "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
      echo -e "${GREEN}All services healthy!${NC}"
      break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}Waiting for services... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
  done
  
  if [[ $RETRY_COUNT -eq $MAX_RETRIES ]]; then
    echo -e "${RED}Warning: Services may not be fully healthy. Check logs.${NC}"
  fi
fi

# Show status
echo ""
echo -e "${GREEN}FutureSight KMS Stack Started${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  nginx (reverse proxy):  http://localhost"
echo "  Knoxx frontend mode:    ${KNOXX_FRONTEND_UPSTREAM_HOST}:${KNOXX_FRONTEND_UPSTREAM_PORT}"
echo "  Ragussy (RAG + chat):   /api/ragussy/*, /v1/*"
echo "  Shibboleth UI:          http://localhost:8097/"
echo "  Shibboleth API:         http://localhost:8097/api/*"
echo "  KM Labels (bridge):     /api/km-labels/*"
echo "  OpenPlanner API:        /api/openplanner/*"
echo ""
echo -e "${BLUE}Health Endpoints:${NC}"
echo "  curl http://localhost/health"
echo "  curl http://localhost/health/ragussy"
echo "  curl http://localhost/health/shibboleth"
echo "  curl http://localhost/health/km-labels"
echo "  curl http://localhost/health/openplanner"
echo "  curl -H 'Authorization: Bearer ${KNOXX_OPENPLANNER_API_KEY:-change-me-openplanner}' http://localhost/api/openplanner/v1/graph/stats"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Create a tenant:"
echo "     curl -X POST http://localhost/api/tenants -H 'Content-Type: application/json' -d '{\"tenant_id\":\"acme\",\"name\":\"Acme Corp\"}'"
echo ""
echo "  2. Open the frontend:"
echo "     http://localhost"
echo ""
echo -e "${BLUE}Management:${NC}"
echo "  Stop:    ./stop.sh"
echo "  Logs:    docker compose logs -f"
echo "  Status:  docker compose ps"
echo ""

# Follow logs if requested
if [[ -n "$LOGS" && -n "$DETACH" ]]; then
  echo -e "${BLUE}Following logs (Ctrl+C to stop)...${NC}"
  $COMPOSE_CMD logs -f
fi

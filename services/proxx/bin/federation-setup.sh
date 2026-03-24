#!/bin/bash
# federation-setup.sh - Configure local federation peers to know about each other
#
# Prerequisites:
#   - Both stacks running (main + federation)
#   - docker compose -f docker-compose.yml -f docker-compose.federation.yml up -d
#
# Usage:
#   ./bin/federation-setup.sh

set -euo pipefail

cd "$(dirname "$0")/.."

# Configuration
PRIMARY_URL="http://localhost:8789"
FEDERATION_URL="http://localhost:8792"
PRIMARY_TOKEN="${PROXY_AUTH_TOKEN:-e6UuPuoU7mLqakSE-9CYuHFazwDwT-iQqPlwMLGw1TE44bO3QuhSAVqpHgAJ8iPA}"
FEDERATION_TOKEN="${FEDERATION_PROXY_AUTH_TOKEN:-federation-peer-token}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

wait_for_health() {
    local url="$1"
    local name="$2"
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $name to be healthy..."
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url/health" > /dev/null 2>&1; then
            log_info "$name is healthy"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo ""
    log_error "$name did not become healthy in time"
    return 1
}

# Register federation peer on primary
register_peer_on_primary() {
    log_info "Registering federation peer on primary..."

    # The ownerCredential is used to establish ownership - admin key becomes ownerSubject
    # auth.token is used for peer-to-peer authentication
    curl -sf "${PRIMARY_URL}/api/ui/federation/peers" \
        -H "Authorization: Bearer ${PRIMARY_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "ownerCredential": "'"${PRIMARY_TOKEN}"'",
            "label": "Local Federation Peer",
            "baseUrl": "http://open-hax-federation-peer:8789",
            "authMode": "admin_key",
            "auth": {
                "token": "'"${FEDERATION_TOKEN}"'"
            }
        }' | jq . || {
        log_warn "Could not register federation peer on primary (may already exist)"
    }
}

# Register primary on federation peer
register_primary_on_federation() {
    log_info "Registering primary on federation peer..."

    curl -sf "${FEDERATION_URL}/api/ui/federation/peers" \
        -H "Authorization: Bearer ${FEDERATION_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "ownerCredential": "'"${FEDERATION_TOKEN}"'",
            "label": "Local Primary Proxy",
            "baseUrl": "http://open-hax-openai-proxy:8789",
            "authMode": "admin_key",
            "auth": {
                "token": "'"${PRIMARY_TOKEN}"'"
            }
        }' | jq . || {
        log_warn "Could not register primary on federation peer (may already exist)"
    }
}

# Verify federation
verify_federation() {
    log_info "Verifying federation setup..."

    echo ""
    log_info "Primary federation self:"
    curl -sf "${PRIMARY_URL}/api/ui/federation/self" \
        -H "Authorization: Bearer ${PRIMARY_TOKEN}" | jq .

    echo ""
    log_info "Primary federation peers:"
    curl -sf "${PRIMARY_URL}/api/ui/federation/peers" \
        -H "Authorization: Bearer ${PRIMARY_TOKEN}" | jq .

    echo ""
    log_info "Federation peer self:"
    curl -sf "${FEDERATION_URL}/api/ui/federation/self" \
        -H "Authorization: Bearer ${FEDERATION_TOKEN}" | jq .

    echo ""
    log_info "Federation peers on federation node:"
    curl -sf "${FEDERATION_URL}/api/ui/federation/peers" \
        -H "Authorization: Bearer ${FEDERATION_TOKEN}" | jq .
}

# Main
main() {
    log_info "Federation setup script"
    echo ""

    # Wait for both services
    wait_for_health "$PRIMARY_URL" "Primary proxy" || exit 1
    wait_for_health "$FEDERATION_URL" "Federation peer" || exit 1

    echo ""

    # Register peers
    register_peer_on_primary
    register_primary_on_federation

    echo ""

    # Verify
    verify_federation

    echo ""
    log_info "Federation setup complete!"
    log_info "Primary proxy:  ${PRIMARY_URL}"
    log_info "Federation peer: ${FEDERATION_URL}"
    log_info ""
    log_info "To test federation, make requests to either proxy and verify account sync."
}

main "$@"
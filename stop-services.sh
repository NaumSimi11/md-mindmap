#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║     MDReader - Service Stop Script                          ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
BACKEND_PORT=7001
FRONTEND_PORT=5173
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          MDReader - Stopping All Services                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Stop Backend
echo -e "${YELLOW}🛑 Stopping Backend...${NC}"
if [ -f /tmp/mdreader-backend.pid ]; then
    kill $(cat /tmp/mdreader-backend.pid) 2>/dev/null || true
    rm /tmp/mdreader-backend.pid
fi
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true

# Stop Frontend
echo -e "${YELLOW}🛑 Stopping Frontend...${NC}"
if [ -f /tmp/mdreader-frontend.pid ]; then
    kill $(cat /tmp/mdreader-frontend.pid) 2>/dev/null || true
    rm /tmp/mdreader-frontend.pid
fi
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true

# Stop Docker Services
echo -e "${YELLOW}🛑 Stopping Docker services...${NC}"
cd "$BACKEND_DIR"
docker-compose down

echo ""
echo -e "${GREEN}${BOLD}✅ All services stopped!${NC}"
echo ""
echo -e "${CYAN}To start again: ${BOLD}./start-services.sh${NC}"


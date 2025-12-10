#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║     MDReader - Service Status Check                         ║
# ╚══════════════════════════════════════════════════════════════╝

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
BACKEND_PORT=7001
FRONTEND_PORT=5173
POSTGRES_PORT=7432
REDIS_PORT=7379

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          MDReader - Service Status                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

check_service() {
    local port=$1
    local name=$2
    local url=$3
    
    if lsof -ti:$port >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} $name"
        if [ ! -z "$url" ]; then
            echo -e "     ${CYAN}→ $url${NC}"
        fi
    else
        echo -e "  ${RED}❌${NC} $name (not running)"
    fi
}

echo -e "${BOLD}📊 SERVICE STATUS:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_service $POSTGRES_PORT "PostgreSQL" "localhost:$POSTGRES_PORT"
check_service $REDIS_PORT "Redis" "localhost:$REDIS_PORT"
check_service $BACKEND_PORT "Backend" "http://localhost:$BACKEND_PORT"
check_service $FRONTEND_PORT "Frontend" "http://localhost:$FRONTEND_PORT"

echo ""
echo -e "${BOLD}📝 LOGS:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f /tmp/mdreader-backend.log ]; then
    echo -e "  Backend:  ${CYAN}tail -f /tmp/mdreader-backend.log${NC}"
fi

if [ -f /tmp/mdreader-frontend.log ]; then
    echo -e "  Frontend: ${CYAN}tail -f /tmp/mdreader-frontend.log${NC}"
fi

echo ""


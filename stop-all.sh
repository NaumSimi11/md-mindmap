#!/bin/bash

# ═══════════════════════════════════════════════════════════
# STOP ALL SERVICES - MDReader Production
# ═══════════════════════════════════════════════════════════

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           STOPPING MDREADER SERVICES                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 1: Stop Frontend
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[1/4]${NC} Stopping Frontend..."
if [ -f logs/frontend.pid ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null || true
    rm logs/frontend.pid
fi
pkill -f "vite.*517" || true
echo -e "${GREEN}✅ Frontend stopped${NC}"
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 2: Stop Hocuspocus
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[2/4]${NC} Stopping Hocuspocus..."
if [ -f logs/hocuspocus.pid ]; then
    kill $(cat logs/hocuspocus.pid) 2>/dev/null || true
    rm logs/hocuspocus.pid
fi
pkill -f "node.*hocuspocus" || true
echo -e "${GREEN}✅ Hocuspocus stopped${NC}"
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 3: Stop Backend
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[3/4]${NC} Stopping Backend..."
if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null || true
    rm logs/backend.pid
fi
pkill -f "uvicorn" || true
echo -e "${GREEN}✅ Backend stopped${NC}"
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 4: Stop PostgreSQL
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[4/4]${NC} Stopping PostgreSQL..."
docker-compose down postgres 2>/dev/null || true
echo -e "${GREEN}✅ PostgreSQL stopped${NC}"
echo ""

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           ALL SERVICES STOPPED!                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""


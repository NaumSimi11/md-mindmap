#!/bin/bash

# ============================================================================
# MDReader - Service Status Check
# ============================================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              MDReader - Service Status Check                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# PostgreSQL
echo -n "📊 PostgreSQL (5432):  "
if docker exec mdreader-v2-postgres pg_isready -U mdreader >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Redis
echo -n "📊 Redis (6379):       "
if docker exec mdreader-v2-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Backend
echo -n "📊 Backend (7001):     "
if curl -s http://localhost:7001/health >/dev/null 2>&1; then
    BACKEND_PID=$(cat /tmp/mdreader-backend.pid 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ Running${NC} (PID: $BACKEND_PID)"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Hocuspocus
echo -n "📊 Hocuspocus (1234):  "
if lsof -i:1234 | grep LISTEN >/dev/null 2>&1; then
    HOCUS_PID=$(lsof -ti:1234 | head -1)
    echo -e "${GREEN}✅ Running${NC} (PID: $HOCUS_PID)"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Frontend
echo -n "📊 Frontend (5173):    "
if lsof -i:5173 | grep LISTEN >/dev/null 2>&1; then
    FRONTEND_PID=$(cat /tmp/mdreader-frontend.pid 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ Running${NC} (PID: $FRONTEND_PID)"
else
    echo -e "${RED}❌ Not running${NC}"
fi

echo ""
echo -e "${BLUE}📝 View Logs:${NC}"
echo "  Backend:    tail -f /tmp/mdreader-backend.log"
echo "  Hocuspocus: tail -f /tmp/mdreader-hocuspocus.log"
echo "  Frontend:   tail -f /tmp/mdreader-frontend.log"
echo ""


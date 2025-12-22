#!/bin/bash

# ============================================================================
# MDReader - Complete Service Restart Script
# ============================================================================
# This script stops and restarts ALL services in the correct order:
# 1. Docker (PostgreSQL + Redis)
# 2. Backend (FastAPI)
# 3. Hocuspocus (WebSocket server)
# 4. Frontend (React + Vite)
# ============================================================================

set -e  # Exit on error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          MDReader - Complete Service Restart                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# Step 1: Stop All Services
# ============================================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 1: Stopping All Services${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Stop Backend
if [ -f /tmp/mdreader-backend.pid ]; then
    echo -e "${BLUE}⏹  Stopping Backend...${NC}"
    kill $(cat /tmp/mdreader-backend.pid) 2>/dev/null || true
    rm -f /tmp/mdreader-backend.pid
    sleep 1
fi

# Stop Hocuspocus
echo -e "${BLUE}⏹  Stopping Hocuspocus...${NC}"
pkill -f "node.*hocuspocus-server" || true
sleep 1

# Stop Frontend
if [ -f /tmp/mdreader-frontend.pid ]; then
    echo -e "${BLUE}⏹  Stopping Frontend...${NC}"
    kill $(cat /tmp/mdreader-frontend.pid) 2>/dev/null || true
    rm -f /tmp/mdreader-frontend.pid
    sleep 1
fi

# Kill any remaining processes on our ports
lsof -ti:7001 | xargs kill -9 2>/dev/null || true
lsof -ti:1234 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

# ============================================================================
# Step 2: Start Docker Services
# ============================================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 2: Starting Docker Services${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT"
docker compose up -d

echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Wait for PostgreSQL to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL...${NC}"
for i in {1..30}; do
    if docker exec mdreader-v2-postgres pg_isready -U mdreader >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    sleep 1
done

# ============================================================================
# Step 3: Run Database Migrations
# ============================================================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 3: Running Database Migrations${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/backendv2"

# Ensure venv exists
if [ ! -d "venv" ]; then
    echo -e "${BLUE}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Run migrations
echo -e "${BLUE}🔄 Running Alembic migrations...${NC}"
PYTHONPATH=$(pwd) venv/bin/python -m alembic upgrade head

echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# ============================================================================
# Step 4: Start Backend
# ============================================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 4: Starting Backend${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/backendv2"

# Start backend in background
nohup PYTHONPATH=$(pwd) venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 7001 --reload > /tmp/mdreader-backend.log 2>&1 &
echo $! > /tmp/mdreader-backend.pid

echo -e "${BLUE}⏳ Waiting for Backend API...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:7001/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready (PID: $(cat /tmp/mdreader-backend.pid))${NC}"
        break
    fi
    sleep 1
done

echo ""

# ============================================================================
# Step 5: Start Hocuspocus
# ============================================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 5: Starting Hocuspocus (WebSocket Server)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/hocuspocus-server"

# Ensure node_modules exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing Hocuspocus dependencies...${NC}"
    npm install
fi

# Start Hocuspocus in background
nohup node server.js > /tmp/mdreader-hocuspocus.log 2>&1 &
HOCUSPOCUS_PID=$!

echo -e "${BLUE}⏳ Waiting for Hocuspocus...${NC}"
sleep 3

if lsof -i:1234 | grep LISTEN >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Hocuspocus is ready (PID: $HOCUSPOCUS_PID)${NC}"
else
    echo -e "${RED}❌ Hocuspocus failed to start. Check /tmp/mdreader-hocuspocus.log${NC}"
fi

echo ""

# ============================================================================
# Step 6: Start Frontend
# ============================================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 6: Starting Frontend${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/frontend"

# Ensure node_modules exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing Frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
nohup npm run dev > /tmp/mdreader-frontend.log 2>&1 &
echo $! > /tmp/mdreader-frontend.pid

echo -e "${BLUE}⏳ Waiting for Frontend...${NC}"
for i in {1..30}; do
    if lsof -i:5173 | grep LISTEN >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready (PID: $(cat /tmp/mdreader-frontend.pid))${NC}"
        break
    fi
    sleep 1
done

echo ""

# ============================================================================
# Final Status
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            ✅ ALL SERVICES RESTARTED SUCCESSFULLY!           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📊 SERVICE STATUS:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}✅ PostgreSQL:${NC}  localhost:5432"
echo -e "  ${GREEN}✅ Redis:${NC}       localhost:6379"
echo -e "  ${GREEN}✅ Backend:${NC}     http://localhost:7001  (PID: $(cat /tmp/mdreader-backend.pid 2>/dev/null || echo 'N/A'))"
echo -e "  ${GREEN}✅ Hocuspocus:${NC}  ws://localhost:1234"
echo -e "  ${GREEN}✅ Frontend:${NC}    http://localhost:5173  (PID: $(cat /tmp/mdreader-frontend.pid 2>/dev/null || echo 'N/A'))"
echo ""
echo -e "${BLUE}🌐 OPEN YOUR BROWSER:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}📝 LOGS:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Backend:    tail -f /tmp/mdreader-backend.log"
echo -e "  Hocuspocus: tail -f /tmp/mdreader-hocuspocus.log"
echo -e "  Frontend:   tail -f /tmp/mdreader-frontend.log"
echo ""
echo -e "${BLUE}⚙️  MANAGEMENT:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Stop all:    ./stop-services.sh"
echo -e "  Restart all: ./restart-all.sh"
echo ""
echo -e "${GREEN}🚀 Ready to go!${NC}"
echo ""


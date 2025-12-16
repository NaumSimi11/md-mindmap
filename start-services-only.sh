#!/bin/bash

# ═══════════════════════════════════════════════════════════
# START SERVICES ONLY (PostgreSQL Already Running)
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
echo -e "${BLUE}║           STARTING MDREADER SERVICES                      ║${NC}"
echo -e "${BLUE}║           (Using existing PostgreSQL)                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p logs

# ═══════════════════════════════════════════════════════════
# STEP 1: Check PostgreSQL
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[1/3]${NC} Checking PostgreSQL..."
if docker ps | grep -q postgres; then
    echo -e "${GREEN}✅ PostgreSQL running (using existing instance)${NC}"
else
    echo -e "${RED}❌ PostgreSQL not running${NC}"
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    docker-compose up -d postgres
    sleep 3
    echo -e "${GREEN}✅ PostgreSQL started${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 2: Backend (FastAPI)
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[2/3]${NC} Starting Backend (FastAPI)..."
cd backendv2

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check if backend is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend already running (port 8000)${NC}"
else
    nohup uvicorn app.main:app --reload --port 8000 > ../logs/backend.log 2>&1 &
    echo $! > ../logs/backend.pid
    echo -e "${GREEN}✅ Backend started (PID: $(cat ../logs/backend.pid))${NC}"
    sleep 2
fi

cd ..
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 3: Hocuspocus Server
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[3/3]${NC} Starting Hocuspocus Server..."
cd hocuspocus-server

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if Hocuspocus is already running
if lsof -Pi :1234 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Hocuspocus already running (port 1234)${NC}"
else
    nohup npm start > ../logs/hocuspocus.log 2>&1 &
    echo $! > ../logs/hocuspocus.pid
    echo -e "${GREEN}✅ Hocuspocus started (PID: $(cat ../logs/hocuspocus.pid))${NC}"
    sleep 2
fi

cd ..
echo ""

# ═══════════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════════
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           VERIFYING SERVICES                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check PostgreSQL
if docker ps | grep -q postgres; then
    echo -e "${GREEN}✅ PostgreSQL:${NC} Running (port 5432)"
else
    echo -e "${RED}❌ PostgreSQL:${NC} Not running"
fi

# Check Backend
sleep 2
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend:${NC} Running (http://localhost:8000)"
else
    echo -e "${YELLOW}⏳ Backend:${NC} Starting... (check logs/backend.log)"
fi

# Check Hocuspocus
if lsof -Pi :1234 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Hocuspocus:${NC} Running (ws://localhost:1234)"
else
    echo -e "${RED}❌ Hocuspocus:${NC} Not running"
fi

# Check Frontend
FRONTEND_PORT=""
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    FRONTEND_PORT="5173"
elif lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1; then
    FRONTEND_PORT="5174"
fi

if [ -n "$FRONTEND_PORT" ]; then
    echo -e "${GREEN}✅ Frontend:${NC} Already running (http://localhost:$FRONTEND_PORT)"
else
    echo -e "${YELLOW}⚠️  Frontend:${NC} Not running"
    echo -e "${YELLOW}   Start manually: cd frontend && npm run dev${NC}"
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           SERVICES READY!                                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Access Points:${NC}"
echo -e "   Frontend:   http://localhost:${FRONTEND_PORT:-5173}"
echo -e "   Backend:    http://localhost:8000"
echo -e "   API Docs:   http://localhost:8000/docs"
echo -e "   Hocuspocus: ws://localhost:1234"
echo ""
echo -e "${YELLOW}📊 View logs:${NC}"
echo -e "   tail -f logs/*.log"
echo ""


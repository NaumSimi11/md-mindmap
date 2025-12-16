#!/bin/bash

# ═══════════════════════════════════════════════════════════
# START ALL SERVICES - MDReader Production
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
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p logs

# ═══════════════════════════════════════════════════════════
# STEP 1: PostgreSQL
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[1/4]${NC} Starting PostgreSQL..."
if docker ps | grep -q mdreader-postgres; then
    echo -e "${GREEN}✅ PostgreSQL already running${NC}"
else
    docker-compose up -d postgres
    echo -e "${GREEN}✅ PostgreSQL started${NC}"
    sleep 3
fi
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 2: Backend (FastAPI)
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[2/4]${NC} Starting Backend (FastAPI)..."
cd backendv2

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found${NC}"
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check if backend is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null; then
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
echo -e "${YELLOW}[3/4]${NC} Starting Hocuspocus Server..."
cd hocuspocus-server

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if Hocuspocus is already running
if lsof -Pi :1234 -sTCP:LISTEN -t >/dev/null; then
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
# STEP 4: Frontend (Vite)
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[4/4]${NC} Starting Frontend (Vite)..."
cd frontend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if frontend is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null || lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null; then
    echo -e "${GREEN}✅ Frontend already running${NC}"
else
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    echo $! > ../logs/frontend.pid
    echo -e "${GREEN}✅ Frontend started (PID: $(cat ../logs/frontend.pid))${NC}"
    sleep 3
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
if docker ps | grep -q mdreader-postgres; then
    echo -e "${GREEN}✅ PostgreSQL:${NC} Running (port 5432)"
else
    echo -e "${RED}❌ PostgreSQL:${NC} Not running"
fi

# Check Backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend:${NC} Running (http://localhost:8000)"
else
    echo -e "${RED}❌ Backend:${NC} Not responding"
fi

# Check Hocuspocus
if lsof -Pi :1234 -sTCP:LISTEN -t >/dev/null; then
    echo -e "${GREEN}✅ Hocuspocus:${NC} Running (ws://localhost:1234)"
else
    echo -e "${RED}❌ Hocuspocus:${NC} Not running"
fi

# Check Frontend
FRONTEND_PORT=""
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    FRONTEND_PORT="5173"
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    FRONTEND_PORT="5174"
fi

if [ -n "$FRONTEND_PORT" ]; then
    echo -e "${GREEN}✅ Frontend:${NC} Running (http://localhost:$FRONTEND_PORT)"
else
    echo -e "${RED}❌ Frontend:${NC} Not running"
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           ALL SERVICES STARTED!                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Open your browser:${NC}"
if [ -n "$FRONTEND_PORT" ]; then
    echo -e "${GREEN}   http://localhost:$FRONTEND_PORT${NC}"
else
    echo -e "${GREEN}   http://localhost:5173${NC}"
fi
echo ""
echo -e "${YELLOW}📊 View logs:${NC}"
echo -e "   tail -f logs/*.log"
echo ""
echo -e "${YELLOW}🛑 Stop all services:${NC}"
echo -e "   ./stop-all.sh"
echo ""

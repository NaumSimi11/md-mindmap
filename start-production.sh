#!/bin/bash

# Production Startup Script
# Starts all services in production mode

set -e

echo "
═══════════════════════════════════════════════════════════
🚀 STARTING MDREADER - PRODUCTION MODE
═══════════════════════════════════════════════════════════
"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "start-production.sh" ]; then
    echo "❌ Error: Must run from project root"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Starting Docker Services${NC}"
echo "   - PostgreSQL"
echo "   - Redis"
echo ""

cd backendv2
docker-compose up -d postgres redis
cd ..

# Wait for PostgreSQL
echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
sleep 3

echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Run migrations
echo -e "${BLUE}📦 Step 2: Running Database Migrations${NC}"
cd backendv2
/Users/naum/.pyenv/versions/3.12.11/bin/python -m alembic upgrade head
cd ..
echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# Start Hocuspocus
echo -e "${BLUE}📦 Step 3: Starting Hocuspocus Server${NC}"
cd hocuspocus-server
npm run prod > ../logs/hocuspocus.log 2>&1 &
HOCUSPOCUS_PID=$!
echo $HOCUSPOCUS_PID > ../logs/hocuspocus.pid
cd ..
echo -e "${GREEN}✅ Hocuspocus started (PID: $HOCUSPOCUS_PID)${NC}"
echo ""

# Start Backend
echo -e "${BLUE}📦 Step 4: Starting FastAPI Backend${NC}"
cd backendv2
/Users/naum/.pyenv/versions/3.12.11/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 7001 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Start Frontend
echo -e "${BLUE}📦 Step 5: Starting Frontend${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
sleep 5

echo "
═══════════════════════════════════════════════════════════
✅ ALL SERVICES RUNNING
═══════════════════════════════════════════════════════════

🌐 Frontend:    http://localhost:5175
🔧 Backend:     http://localhost:7001
🔌 Hocuspocus:  ws://localhost:1234
🗄️  PostgreSQL:  localhost:5432
📦 Redis:       localhost:6379

📊 Process IDs:
   Hocuspocus: $HOCUSPOCUS_PID
   Backend:    $BACKEND_PID
   Frontend:   $FRONTEND_PID

📝 Logs:
   tail -f logs/hocuspocus.log
   tail -f logs/backend.log
   tail -f logs/frontend.log

🛑 To stop all services:
   ./stop-production.sh

═══════════════════════════════════════════════════════════
"


#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║     MDReader - Service Startup Script                       ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./start-services.sh              # Start with existing data
#   ./start-services.sh --clean      # Clean database and start fresh
#   ./start-services.sh --with-user  # Start and create test user

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
BACKEND_PORT=7001
FRONTEND_PORT=5173
POSTGRES_PORT=7432
REDIS_PORT=7379
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Parse arguments
CLEAN_DB=false
CREATE_USER=false
for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN_DB=true
            shift
            ;;
        --with-user)
            CREATE_USER=true
            shift
            ;;
        *)
            ;;
    esac
done

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          MDReader - Starting All Services                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if port is in use
check_port() {
    lsof -ti:"$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    if check_port "$port"; then
        echo -e "${YELLOW}⚠️  Stopping existing $service_name on port $port...${NC}"
        lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=0
    
    echo -e "${BLUE}⏳ Waiting for $service_name to be ready...${NC}"
    while ! nc -z "$host" "$port" 2>/dev/null; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}❌ $service_name failed to start after $max_attempts seconds${NC}"
            return 1
        fi
        sleep 1
    done
    echo -e "${GREEN}✅ $service_name is ready!${NC}"
}

# Step 1: Clean up existing processes if requested
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Step 1: Cleanup${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"

# Step 2: Start Docker Services
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Step 2: Docker Services (PostgreSQL + Redis)${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$BACKEND_DIR"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Stop containers if clean is requested
if [ "$CLEAN_DB" = true ]; then
    echo -e "${YELLOW}🧹 Cleaning database...${NC}"
    docker-compose down -v
fi

# Start Docker services
echo -e "${BLUE}🐳 Starting Docker services...${NC}"
docker-compose up -d

# Wait for PostgreSQL
wait_for_service localhost $POSTGRES_PORT "PostgreSQL"

# Wait for Redis
wait_for_service localhost $REDIS_PORT "Redis"

# Step 3: Run Database Migrations
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Step 3: Database Migrations${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$BACKEND_DIR"
source venv/bin/activate

echo -e "${BLUE}🔄 Running Alembic migrations...${NC}"
PYTHONPATH=$(pwd) alembic upgrade head

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# Step 4: Create Test User (if requested)
if [ "$CREATE_USER" = true ] || [ "$CLEAN_DB" = true ]; then
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  Step 4: Creating Test User${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo -e "${BLUE}👤 Creating test user...${NC}"
    PYTHONPATH=$(pwd) python3 scripts/create_test_user.py
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test user created${NC}"
    else
        echo -e "${YELLOW}⚠️  User may already exist (continuing...)${NC}"
    fi
fi

# Step 5: Start Backend
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Step 5: Starting Backend${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$BACKEND_DIR"
echo -e "${BLUE}🚀 Starting FastAPI backend on port $BACKEND_PORT...${NC}"

# Start backend in background
PYTHONPATH=$(pwd) uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > /tmp/mdreader-backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/mdreader-backend.pid

# Wait for backend
sleep 3
wait_for_service localhost $BACKEND_PORT "Backend API"

# Step 6: Start Frontend
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Step 6: Starting Frontend${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$FRONTEND_DIR"
echo -e "${BLUE}⚛️  Starting React frontend on port $FRONTEND_PORT...${NC}"

# Start frontend in background
npm run dev > /tmp/mdreader-frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/mdreader-frontend.pid

# Wait for frontend
sleep 5
wait_for_service localhost $FRONTEND_PORT "Frontend"

# Success Summary
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            ✅ ALL SERVICES STARTED SUCCESSFULLY!             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BOLD}📊 SERVICE STATUS:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}✅${NC} PostgreSQL:  ${CYAN}localhost:$POSTGRES_PORT${NC}"
echo -e "  ${GREEN}✅${NC} Redis:       ${CYAN}localhost:$REDIS_PORT${NC}"
echo -e "  ${GREEN}✅${NC} Backend:     ${CYAN}http://localhost:$BACKEND_PORT${NC}  (PID: $BACKEND_PID)"
echo -e "  ${GREEN}✅${NC} Frontend:    ${CYAN}http://localhost:$FRONTEND_PORT${NC}  (PID: $FRONTEND_PID)"
echo ""

echo -e "${BOLD}🌐 OPEN YOUR BROWSER:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${MAGENTA}${BOLD}http://localhost:$FRONTEND_PORT${NC}"
echo ""

if [ "$CREATE_USER" = true ] || [ "$CLEAN_DB" = true ]; then
    echo -e "${BOLD}🔑 TEST CREDENTIALS:${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Email:    ${CYAN}naum@example.com${NC}"
    echo -e "  Password: ${CYAN}Kozuvcanka#1${NC}"
    echo ""
fi

echo -e "${BOLD}📝 LOGS:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Backend:  ${CYAN}tail -f /tmp/mdreader-backend.log${NC}"
echo -e "  Frontend: ${CYAN}tail -f /tmp/mdreader-frontend.log${NC}"
echo ""

echo -e "${BOLD}⚙️  MANAGEMENT:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Stop all:    ${CYAN}./stop-services.sh${NC}"
echo -e "  Clean start: ${CYAN}./start-services.sh --clean${NC}"
echo -e "  With user:   ${CYAN}./start-services.sh --with-user${NC}"
echo ""

echo -e "${GREEN}🚀 Ready to go!${NC}"


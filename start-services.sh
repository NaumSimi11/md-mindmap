#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║     MDReader - Service Startup Script                       ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./start-services.sh              # Interactive mode selection
#   ./start-services.sh --web        # Start in Web mode
#   ./start-services.sh --tauri      # Start in Tauri (Desktop) mode
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
DIM='\033[2m'

# Configuration
BACKEND_PORT=7001
FRONTEND_PORT=5173
POSTGRES_PORT=5432
REDIS_PORT=6379
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backendv2"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Parse arguments
CLEAN_DB=false
CREATE_USER=false
RUN_MODE=""  # Will be "web" or "tauri"

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
        --web)
            RUN_MODE="web"
            shift
            ;;
        --tauri)
            RUN_MODE="tauri"
            shift
            ;;
        *)
            ;;
    esac
done

# ----------------------------------------------------------------
# Mode Selection (if not specified via args)
# ----------------------------------------------------------------
select_mode() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          MDReader - Choose Your Environment                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "  ${BOLD}Select how you want to run MDReader:${NC}"
    echo ""
    echo -e "    ${GREEN}[1]${NC}  🌐  ${BOLD}Web Mode${NC}         ${DIM}(Browser - Vite dev server)${NC}"
    echo -e "    ${BLUE}[2]${NC}  🖥️   ${BOLD}Tauri Mode${NC}       ${DIM}(Desktop App - Native window)${NC}"
    echo ""
    echo -e "  ${DIM}Tip: Use --web or --tauri flag to skip this prompt${NC}"
    echo ""
    
    while true; do
        read -p "  Enter your choice [1/2]: " choice
        case $choice in
            1|web|w)
                RUN_MODE="web"
                echo ""
                echo -e "  ${GREEN}✓${NC} Selected: ${BOLD}Web Mode${NC}"
                break
                ;;
            2|tauri|t|desktop|d)
                RUN_MODE="tauri"
                echo ""
                echo -e "  ${BLUE}✓${NC} Selected: ${BOLD}Tauri Desktop Mode${NC}"
                break
                ;;
            *)
                echo -e "  ${RED}Invalid choice. Please enter 1 or 2.${NC}"
                ;;
        esac
    done
    echo ""
}

# Show mode selection if not specified
if [ -z "$RUN_MODE" ]; then
    select_mode
fi

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
if [ "$RUN_MODE" = "tauri" ]; then
echo "║     MDReader - Starting Services (Tauri Desktop Mode)        ║"
else
echo "║     MDReader - Starting Services (Web Mode)                  ║"
fi
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

cd "$PROJECT_ROOT"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Assuming services are local or already running.${NC}"
else
    # Stop containers if clean is requested
    if [ "$CLEAN_DB" = true ]; then
        echo -e "${YELLOW}🧹 Cleaning database...${NC}"
        docker-compose down -v
    fi

    # Start Docker services
    echo -e "${BLUE}🐳 Starting Docker services...${NC}"
    docker-compose up -d
fi

# Wait for PostgreSQL to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL...${NC}"
sleep 5
for i in {1..30}; do
    if docker exec mdreader-v2-postgres pg_isready -U mdreader >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        sleep 2  # Extra wait for it to fully accept connections
        break
    fi
    sleep 1
done

# Wait for Redis
echo -e "${BLUE}⏳ Waiting for Redis...${NC}"
for i in {1..10}; do
    if docker exec mdreader-v2-redis redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is ready!${NC}"
        break
    fi
    sleep 1
done

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
    PYTHONPATH=$(pwd) python3 scripts/create_test_users.py
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test user created${NC}"
    else
        echo -e "${YELLOW}⚠️  User may already exist (continuing...)${NC}"
    fi
fi

# Step 5: Start Hocuspocus (WebSocket Collaboration Server)
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Step 5: Starting Hocuspocus Server${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/hocuspocus-server"
echo -e "${BLUE}🔌 Starting Hocuspocus WebSocket server on port 1234...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Hocuspocus dependencies...${NC}"
    npm install
fi

# Start Hocuspocus in background
npm run dev > /tmp/mdreader-hocuspocus.log 2>&1 &
HOCUSPOCUS_PID=$!
echo $HOCUSPOCUS_PID > /tmp/mdreader-hocuspocus.pid

# Wait for Hocuspocus
sleep 2
wait_for_service localhost 1234 "Hocuspocus WebSocket"

# Step 6: Start Backend
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Step 6: Starting Backend${NC}"
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

# Step 7: Start Frontend (Web or Tauri)
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$RUN_MODE" = "tauri" ]; then
    echo -e "${BOLD}  Step 7: Starting Tauri Desktop App${NC}"
else
    echo -e "${BOLD}  Step 7: Starting Frontend (Web)${NC}"
fi
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
fi

if [ "$RUN_MODE" = "tauri" ]; then
    echo -e "${BLUE}🖥️  Starting Tauri Desktop Application...${NC}"
    echo -e "${DIM}   (This will open a native desktop window)${NC}"
    
    # Check if Tauri CLI is available
    if ! npx tauri --version >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Installing Tauri CLI...${NC}"
        npm install @tauri-apps/cli
    fi
    
    # Start Tauri in background (it handles its own dev server)
    npm run tauri:dev > /tmp/mdreader-tauri.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/mdreader-frontend.pid
    
    # Wait a bit for Tauri to start (it takes longer than web)
    echo -e "${BLUE}⏳ Waiting for Tauri to initialize...${NC}"
    sleep 8
    
    # Tauri runs its own vite server, so check for frontend port
    wait_for_service localhost $FRONTEND_PORT "Tauri Dev Server"
    
    echo -e "${GREEN}✅ Tauri Desktop App is launching!${NC}"
else
    echo -e "${BLUE}⚛️  Starting React frontend on port $FRONTEND_PORT...${NC}"
    
    # Start frontend in background
    npm run dev > /tmp/mdreader-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/mdreader-frontend.pid
    
    # Wait for frontend
    sleep 5
    wait_for_service localhost $FRONTEND_PORT "Frontend"
fi

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
echo -e "  ${GREEN}✅${NC} Hocuspocus:  ${CYAN}ws://localhost:1234${NC}  (PID: $HOCUSPOCUS_PID)"
echo -e "  ${GREEN}✅${NC} Backend:     ${CYAN}http://localhost:$BACKEND_PORT${NC}  (PID: $BACKEND_PID)"
if [ "$RUN_MODE" = "tauri" ]; then
echo -e "  ${GREEN}✅${NC} Tauri:       ${BLUE}Desktop App${NC}  (PID: $FRONTEND_PID)"
else
echo -e "  ${GREEN}✅${NC} Frontend:    ${CYAN}http://localhost:$FRONTEND_PORT${NC}  (PID: $FRONTEND_PID)"
fi
echo ""

echo -e "${BOLD}🎯 MODE:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$RUN_MODE" = "tauri" ]; then
echo -e "  ${BLUE}🖥️  Tauri Desktop Mode${NC} - Native window should open automatically"
else
echo -e "  ${GREEN}🌐 Web Mode${NC} - Open in browser: ${MAGENTA}${BOLD}http://localhost:$FRONTEND_PORT${NC}"
fi
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
echo -e "  Backend:    ${CYAN}tail -f /tmp/mdreader-backend.log${NC}"
if [ "$RUN_MODE" = "tauri" ]; then
echo -e "  Tauri:      ${CYAN}tail -f /tmp/mdreader-tauri.log${NC}"
else
echo -e "  Frontend:   ${CYAN}tail -f /tmp/mdreader-frontend.log${NC}"
fi
echo -e "  Hocuspocus: ${CYAN}tail -f /tmp/mdreader-hocuspocus.log${NC}"
echo ""

echo -e "${BOLD}⚙️  MANAGEMENT:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Stop all:      ${CYAN}./stop-services.sh${NC}"
echo -e "  Web mode:      ${CYAN}./start-services.sh --web${NC}"
echo -e "  Tauri mode:    ${CYAN}./start-services.sh --tauri${NC}"
echo -e "  Clean start:   ${CYAN}./start-services.sh --clean${NC}"
echo -e "  With user:     ${CYAN}./start-services.sh --with-user${NC}"
echo ""

echo -e "${GREEN}🚀 Ready to go!${NC}"

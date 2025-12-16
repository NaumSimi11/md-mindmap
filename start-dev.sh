#!/bin/bash

# ============================================================
# MDReader - Full Stack Development Startup Script
# ============================================================
# Starts: Backend v2 + Frontend + Tauri Desktop
# ============================================================

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "============================================================"
echo -e "${CYAN}🚀 MDReader - Full Stack Development Startup${NC}"
echo "============================================================"
echo ""

# Function to check if a port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 0  # Port is in use
  else
    return 1  # Port is free
  fi
}

# Function to start backend
start_backend() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📦 BACKEND V2 (FastAPI)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # Check if backend is already running
  if check_port 7001; then
    echo -e "${YELLOW}⚠️  Backend already running on port 7001${NC}"
    echo -e "${YELLOW}   Skipping backend startup...${NC}"
    echo ""
    return 0
  fi
  
  echo -e "${CYAN}Starting Backend v2...${NC}"
  cd "$PROJECT_ROOT/backendv2"
  
  # Check if start-dev.sh exists
  if [ ! -f "scripts/start-dev.sh" ]; then
    echo -e "${RED}❌ Backend start script not found!${NC}"
    echo -e "${RED}   Expected: backendv2/scripts/start-dev.sh${NC}"
    return 1
  fi
  
  # Make script executable
  chmod +x scripts/start-dev.sh
  
  # Start backend in background
  ./scripts/start-dev.sh > "$PROJECT_ROOT/backend.log" 2>&1 &
  BACKEND_PID=$!
  
  echo -e "${GREEN}✅ Backend starting (PID: $BACKEND_PID)${NC}"
  echo -e "${CYAN}   Logs: backend.log${NC}"
  echo ""
  
  # Wait for backend to be ready
  echo -e "${CYAN}⏳ Waiting for backend to be ready...${NC}"
  for i in {1..30}; do
    if check_port 7001; then
      echo -e "${GREEN}✅ Backend is ready!${NC}"
      echo -e "${GREEN}   API: http://localhost:7001${NC}"
      echo -e "${GREEN}   Docs: http://localhost:7001/docs${NC}"
      echo ""
      return 0
    fi
    sleep 1
    echo -n "."
  done
  
  echo ""
  echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
  echo -e "${YELLOW}   Check backend.log for details${NC}"
  return 1
}

# Function to start frontend
start_frontend() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🎨 FRONTEND (React + Vite)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # Check if frontend is already running
  if check_port 5173 || check_port 5174; then
    echo -e "${YELLOW}⚠️  Frontend already running${NC}"
    echo -e "${YELLOW}   Skipping frontend startup...${NC}"
    echo ""
    return 0
  fi
  
  echo -e "${CYAN}Starting Frontend...${NC}"
  cd "$PROJECT_ROOT/frontend"
  
  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
  fi
  
  # Start frontend in background
  npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  
  echo -e "${GREEN}✅ Frontend starting (PID: $FRONTEND_PID)${NC}"
  echo -e "${CYAN}   Logs: frontend.log${NC}"
  echo ""
  
  # Wait for frontend to be ready
  echo -e "${CYAN}⏳ Waiting for frontend to be ready...${NC}"
  for i in {1..20}; do
    if check_port 5173 || check_port 5174; then
      FRONTEND_PORT=5173
      if check_port 5174; then
        FRONTEND_PORT=5174
      fi
      echo -e "${GREEN}✅ Frontend is ready!${NC}"
      echo -e "${GREEN}   URL: http://localhost:$FRONTEND_PORT${NC}"
      echo ""
      return 0
    fi
    sleep 1
    echo -n "."
  done
  
  echo ""
  echo -e "${RED}❌ Frontend failed to start within 20 seconds${NC}"
  echo -e "${YELLOW}   Check frontend.log for details${NC}"
  return 1
}

# Function to start Tauri
start_tauri() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🖥️  TAURI DESKTOP APP${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  echo -e "${CYAN}Starting Tauri Desktop App...${NC}"
  cd "$PROJECT_ROOT/frontend"
  
  # Check if Tauri is installed
  if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust/Cargo not found!${NC}"
    echo -e "${YELLOW}   Install Rust: https://rustup.rs/${NC}"
    return 1
  fi
  
  # Start Tauri (this will run in foreground)
  echo -e "${GREEN}✅ Launching Tauri...${NC}"
  echo -e "${CYAN}   This will open the desktop app window${NC}"
  echo ""
  
  # Run Tauri dev (foreground)
  npm run tauri:dev
}

# ============================================================
# Main Execution
# ============================================================

echo -e "${CYAN}🔍 Checking dependencies...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found!${NC}"
  exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found!${NC}"
  exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}❌ Python 3 not found!${NC}"
  exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠️  Docker not found. Database may not start.${NC}"
fi

echo -e "${GREEN}✅ All dependencies found${NC}"
echo ""

# Start services
start_backend
BACKEND_STATUS=$?

start_frontend
FRONTEND_STATUS=$?

# Summary
echo ""
echo "============================================================"
echo -e "${CYAN}📊 STARTUP SUMMARY${NC}"
echo "============================================================"
echo ""

if [ $BACKEND_STATUS -eq 0 ]; then
  echo -e "${GREEN}✅ Backend:  Running on http://localhost:7001${NC}"
else
  echo -e "${RED}❌ Backend:  Failed to start${NC}"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
  FRONTEND_PORT=5173
  if check_port 5174; then
    FRONTEND_PORT=5174
  fi
  echo -e "${GREEN}✅ Frontend: Running on http://localhost:$FRONTEND_PORT${NC}"
else
  echo -e "${RED}❌ Frontend: Failed to start${NC}"
fi

echo ""
echo "============================================================"
echo -e "${CYAN}🔐 TEST USER CREDENTIALS${NC}"
echo "============================================================"
echo ""
echo "  User 1: john@example.com / John#123"
echo "  User 2: ljubo@example.com / Ljubisha#1"
echo ""
echo "============================================================"
echo ""

# If backend or frontend failed, exit
if [ $BACKEND_STATUS -ne 0 ] || [ $FRONTEND_STATUS -ne 0 ]; then
  echo -e "${RED}❌ Some services failed to start${NC}"
  echo -e "${YELLOW}   Check logs: backend.log, frontend.log${NC}"
  echo ""
  exit 1
fi

# Now start Tauri (foreground)
echo -e "${CYAN}🚀 Launching Tauri Desktop App...${NC}"
echo ""
sleep 2

start_tauri

# When Tauri exits, clean up
echo ""
echo "============================================================"
echo -e "${YELLOW}⚠️  Tauri closed. Stopping services...${NC}"
echo "============================================================"
echo ""

# Kill background processes
if [ ! -z "$BACKEND_PID" ]; then
  echo -e "${CYAN}Stopping Backend (PID: $BACKEND_PID)...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
fi

if [ ! -z "$FRONTEND_PID" ]; then
  echo -e "${CYAN}Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
  kill $FRONTEND_PID 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""


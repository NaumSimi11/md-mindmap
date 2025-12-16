#!/bin/bash
# ============================================================
# MDReader Backend v2 - Development Startup Script
# ============================================================

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Navigate to backendv2 directory (parent of scripts)
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

echo "============================================================"
echo "🚀 MDReader Backend v2 - Development Startup"
echo "============================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found${NC}"
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/bin/uvicorn" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from template..."
    
    # Copy template
    cp env.example .env
    
    # Generate secret key
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    
    # Update .env with generated secret key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|your-secret-key-here-change-in-production-use-openssl-rand-hex-32|$SECRET_KEY|g" .env
    else
        # Linux
        sed -i "s|your-secret-key-here-change-in-production-use-openssl-rand-hex-32|$SECRET_KEY|g" .env
    fi
    
    echo -e "${GREEN}✅ .env file created with auto-generated SECRET_KEY${NC}"
    echo -e "${YELLOW}   You can edit .env later if needed${NC}"
fi

# Check if PostgreSQL is running
echo "Checking PostgreSQL..."
if nc -z localhost 5432 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo "Starting PostgreSQL automatically..."
    
    # Find docker-compose.yml (should be in parent directory)
    if [ -f "../docker-compose.yml" ]; then
        cd ..
        docker-compose up -d postgres
        cd backendv2
        
        # Wait for PostgreSQL to start
        echo "Waiting for PostgreSQL to start..."
        for i in {1..30}; do
            if nc -z localhost 5432 2>/dev/null; then
                echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
                break
            fi
            sleep 1
            echo -n "."
        done
        
        if ! nc -z localhost 5432 2>/dev/null; then
            echo -e "${RED}❌ PostgreSQL failed to start${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ docker-compose.yml not found${NC}"
        echo "Please start PostgreSQL manually:"
        echo "  cd .. && docker-compose up -d postgres"
        exit 1
    fi
fi

# Check if migrations are up to date
echo "Checking database migrations..."
MIGRATION_STATUS=$(alembic current 2>/dev/null | grep -c "head")
if [ "$MIGRATION_STATUS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Database not up to date${NC}"
    
    # Check if migrations exist
    if [ ! "$(ls -A alembic/versions 2>/dev/null)" ]; then
        echo "Creating initial migration..."
        alembic revision --autogenerate -m "initial_schema" 2>/dev/null
    fi
    
    echo "Applying migrations..."
    alembic upgrade head 2>/dev/null
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${GREEN}✅ Database is up to date${NC}"
fi

# Create test users (idempotent - won't fail if they exist)
echo "Setting up test users..."
QUIET_MODE=true python scripts/create_test_users.py > /dev/null 2>&1
echo -e "${GREEN}✅ Test users ready${NC}"

# Check if backend is already running
echo "Checking if backend is already running..."
if lsof -Pi :7001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend is already running on port 7001${NC}"
    echo -e "${YELLOW}   The existing backend will continue running${NC}"
    echo -e "${YELLOW}   If you want to restart it, stop the existing process first:${NC}"
    echo -e "${CYAN}   kill $(lsof -ti :7001)${NC}"
    echo ""
    echo -e "${GREEN}✅ Backend is available at:${NC}"
    echo -e "   • API: http://localhost:7001"
    echo -e "   • Docs: http://localhost:7001/docs"
    echo -e "   • Health: http://localhost:7001/health"
    echo ""
    exit 0
fi

echo ""
echo "============================================================"
echo "🎉 Starting MDReader API v2"
echo "============================================================"
echo ""
echo "Server will be available at:"
echo "  • API: http://localhost:7001"
echo "  • Docs: http://localhost:7001/docs"
echo "  • Health: http://localhost:7001/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 TEST USER CREDENTIALS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  User 1: john@example.com / John#123"
echo "  User 2: ljubo@example.com / Ljubisha#1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server with uvicorn (proper way)
uvicorn app.main:app --reload --host 0.0.0.0 --port 7001

